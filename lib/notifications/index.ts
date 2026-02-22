import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { AppState, Platform } from "react-native";

import { syncDeviceContactEventsOncePerDay } from "@/lib/contacts/event-sync";
import {
    getConfig,
    getContactsBySystemIds,
    getNotificationState,
    getOverdueContacts,
    getUpcomingContactEvents,
    setNotificationState,
} from "@/lib/db";

const BACKGROUND_REMINDER_TASK = "tend.daily-sync-and-notify";
const BACKGROUND_TASK_MIN_INTERVAL_MINUTES = 60;
const OVERDUE_NOTIFICATION_ID = "tend.overdue";
const EVENTS_NOTIFICATION_ID = "tend.events";
const OVERDUE_CHANNEL_ID = "tend-overdue";
const EVENTS_CHANNEL_ID = "tend-events";
const LAST_DAILY_EVAL_LOCAL_DATE_KEY = "last_daily_reminder_eval_local_date";
const LAST_OVERDUE_HASH_KEY = "last_overdue_notification_hash";
const LAST_EVENT_HASH_SET_KEY = "last_event_notification_hash";

type EvaluationSource = "startup" | "focus" | "background";

let initialized = false;
let appStateSubscription: { remove: () => void } | null = null;

function toLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseReminderTimeToMinutes(value: string) {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 10 * 60;
  }
  return (
    Math.max(0, Math.min(23, hour)) * 60 + Math.max(0, Math.min(59, minute))
  );
}

function hasReachedReminderTime(now: Date, reminderTime: string) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= parseReminderTimeToMinutes(reminderTime);
}

function safeParseHashSet(raw: string | null | undefined) {
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(
      parsed.filter((item): item is string => typeof item === "string"),
    );
  } catch {
    return new Set<string>();
  }
}

async function ensureNotificationRuntimeReady() {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });

  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(OVERDUE_CHANNEL_ID, {
      name: "Overdue Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 150, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
      sound: "default",
    });

    await Notifications.setNotificationChannelAsync(EVENTS_CHANNEL_ID, {
      name: "Contact Events",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: true,
      sound: "default",
    });
  }
}

async function clearNotification(identifier: string) {
  try {
    await Notifications.dismissNotificationAsync(identifier);
  } catch {
    // ignore
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // ignore
  }
}

async function evaluateOverdueReminders(now: Date) {
  const config = await getConfig();
  const overdue = await getOverdueContacts(now.toISOString());
  if (overdue.length === 0) {
    await clearNotification(OVERDUE_NOTIFICATION_ID);
    await setNotificationState(LAST_OVERDUE_HASH_KEY, null);
    return;
  }

  const topNames = overdue
    .slice(0, 3)
    .map((item) => item.nickName || item.fullName)
    .join(", ");
  const overdueHash = `${toLocalDateKey(now)}|${overdue.map((item) => item.systemId).join(",")}|${
    config.shouldKeepRemindersPersistent ? "persistent" : "single"
  }`;
  const previous = await getNotificationState(LAST_OVERDUE_HASH_KEY);
  if (previous?.valueText === overdueHash) return;

  const body =
    overdue.length === 1
      ? `${topNames} is overdue. Time for a call.`
      : `${overdue.length} people are overdue (${topNames}). Time for calls.`;

  await Notifications.scheduleNotificationAsync({
    identifier: OVERDUE_NOTIFICATION_ID,
    content: {
      title: "Friendly Reminder",
      body,
      sound: "default",
      autoDismiss: !config.shouldKeepRemindersPersistent,
      sticky: config.shouldKeepRemindersPersistent,
      priority: "max",
      data: { type: "overdue", count: overdue.length },
    },
    trigger: null,
  });
  await setNotificationState(LAST_OVERDUE_HASH_KEY, overdueHash);
}

async function evaluateEventReminders(now: Date) {
  const config = await getConfig();
  const upcoming = await getUpcomingContactEvents(
    config.contactEventsReminderDays,
    now.toISOString(),
  );
  const eventKeys = upcoming.map(
    (event) =>
      `${event.contactSystemId}|${event.sourceEventId}|${event.nextOccurrenceAt}`,
  );
  const nextSet = new Set(eventKeys);

  const previous = await getNotificationState(LAST_EVENT_HASH_SET_KEY);
  const previousSet = safeParseHashSet(previous?.valueText);
  const newKeys = [...nextSet].filter((key) => !previousSet.has(key));

  if (newKeys.length === 0) {
    await setNotificationState(
      LAST_EVENT_HASH_SET_KEY,
      JSON.stringify([...nextSet]),
    );
    return;
  }

  const contactIds = [
    ...new Set(upcoming.map((event) => event.contactSystemId)),
  ];
  const contacts = await getContactsBySystemIds(contactIds);
  const contactById = new Map(
    contacts.map((contact) => [contact.systemId, contact]),
  );

  const newEvents = upcoming.filter((event) =>
    newKeys.includes(
      `${event.contactSystemId}|${event.sourceEventId}|${event.nextOccurrenceAt}`,
    ),
  );
  const preview = newEvents
    .slice(0, 3)
    .map((event) => {
      const contact = contactById.get(event.contactSystemId);
      const name = contact?.nickName || contact?.fullName || "Contact";
      const label =
        event.label || (event.eventType === "birthday" ? "Birthday" : "Event");
      return `${name}: ${label}`;
    })
    .join(", ");

  const title =
    newEvents.length === 1
      ? "Upcoming contact event"
      : `Upcoming contact events (${newEvents.length})`;
  await Notifications.scheduleNotificationAsync({
    identifier: EVENTS_NOTIFICATION_ID,
    content: {
      title,
      body: preview || "An important contact event is coming up.",
      sound: "default",
      priority: "high",
      autoDismiss: true,
      sticky: false,
      data: { type: "events", count: newEvents.length },
    },
    trigger: null,
  });

  await setNotificationState(
    LAST_EVENT_HASH_SET_KEY,
    JSON.stringify([...nextSet]),
  );
}

async function shouldRunEvaluationToday(
  now: Date,
  reminderTime: string,
  force: boolean,
) {
  if (!force && !hasReachedReminderTime(now, reminderTime)) return false;
  if (force) return true;
  const last = await getNotificationState(LAST_DAILY_EVAL_LOCAL_DATE_KEY);
  return last?.valueText !== toLocalDateKey(now);
}

if (!TaskManager.isTaskDefined(BACKGROUND_REMINDER_TASK)) {
  TaskManager.defineTask(BACKGROUND_REMINDER_TASK, async () => {
    try {
      await runDailyReminderEvaluation({ source: "background" });
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function runDailyReminderEvaluation({
  source,
  force = false,
}: {
  source: EvaluationSource;
  force?: boolean;
}) {
  if (Platform.OS === "web") return false;

  const config = await getConfig();
  const now = new Date();
  const shouldRun = await shouldRunEvaluationToday(
    now,
    config.reminderNotificationTime,
    force,
  );
  if (!shouldRun) return false;

  if (source !== "background") {
    try {
      await syncDeviceContactEventsOncePerDay({ allowPermissionPrompt: true });
    } catch {
      // Keep reminder evaluation independent from contact sync failures.
    }
  }
  await evaluateOverdueReminders(now);
  await evaluateEventReminders(now);
  await setNotificationState(
    LAST_DAILY_EVAL_LOCAL_DATE_KEY,
    toLocalDateKey(now),
  );

  return true;
}

export async function clearOverduePersistentIfResolved() {
  if (Platform.OS === "web") return;
  const overdue = await getOverdueContacts();
  if (overdue.length > 0) return;
  await clearNotification(OVERDUE_NOTIFICATION_ID);
  await setNotificationState(LAST_OVERDUE_HASH_KEY, null);
}

export async function rescheduleOnConfigChange() {
  if (Platform.OS === "web") return;
  await registerBackgroundTask();
  await runDailyReminderEvaluation({ source: "startup", force: true });
}

async function registerBackgroundTask() {
  if (Platform.OS === "web") return;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_REMINDER_TASK,
  );
  if (isRegistered) {
    try {
      const options = await TaskManager.getTaskOptionsAsync<{
        minimumInterval?: number;
      }>(BACKGROUND_REMINDER_TASK);
      if (options?.minimumInterval === BACKGROUND_TASK_MIN_INTERVAL_MINUTES) {
        return;
      }
    } catch {
      // If task options cannot be read, re-register with the expected interval.
    }
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_REMINDER_TASK);
  }
  await BackgroundTask.registerTaskAsync(BACKGROUND_REMINDER_TASK, {
    minimumInterval: BACKGROUND_TASK_MIN_INTERVAL_MINUTES,
  });
}

export async function initNotifications() {
  if (initialized || Platform.OS === "web") return;
  initialized = true;
  await ensureNotificationRuntimeReady();
  await registerBackgroundTask();
  await runDailyReminderEvaluation({ source: "startup" });

  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") return;
    runDailyReminderEvaluation({ source: "focus" }).catch(() => {
      // ignore foreground evaluation errors
    });
  });
}
