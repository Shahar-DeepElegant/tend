import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";

import { syncDeviceContactEventsOncePerDay } from "@/lib/contacts/event-sync";
import {
  getConfig,
  getContactsBySystemIds,
  getOverdueContacts,
  getUpcomingContactEvents,
} from "@/lib/db";

const BACKGROUND_REMINDER_TASK = "tend.daily-sync-and-notify";
const OVERDUE_NOTIFICATION_ID = "tend.overdue";
const EVENTS_NOTIFICATION_ID = "tend.events";
const OVERDUE_CHANNEL_ID = "tend-overdue";
const EVENTS_CHANNEL_ID = "tend-events";
const MANAGED_OVERDUE_PREFIX = "tend.overdue.";
const MANAGED_EVENTS_PREFIX = "tend.events.";
const REMINDER_WINDOW_DAYS = 14;

type EvaluationSource = "startup" | "focus" | "background";
type RefreshReason = "startup" | "focus" | "config" | "data";
type ReminderType = "overdue" | "events";

type ReminderContent = {
  title: string;
  body: string;
  priority: "max" | "high";
  autoDismiss: boolean;
  sticky: boolean;
  data: Record<string, unknown>;
};

let initialized = false;
let appStateSubscription: { remove: () => void } | null = null;
let refreshQueue: Promise<void> = Promise.resolve();

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

function getReminderTimeDateForLocalDay(
  dayOffset: number,
  reminderHHmm: string,
  base = new Date(),
) {
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);

  const minutes = parseReminderTimeToMinutes(reminderHHmm);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  date.setHours(hour, minute, 0, 0);
  return date;
}

function buildReminderWindowStart(now: Date, reminderHHmm: string) {
  const todayReminder = getReminderTimeDateForLocalDay(0, reminderHHmm, now);
  return now.getTime() < todayReminder.getTime() ? 0 : 1;
}

function listReminderTargets(now: Date, reminderHHmm: string, days = REMINDER_WINDOW_DAYS) {
  const startOffset = buildReminderWindowStart(now, reminderHHmm);
  const targets: Date[] = [];
  for (let i = 0; i < days; i += 1) {
    targets.push(getReminderTimeDateForLocalDay(startOffset + i, reminderHHmm, now));
  }
  return targets;
}

function toEventKey(event: {
  contactSystemId: string;
  sourceEventId: string;
  nextOccurrenceAt: string;
}) {
  return `${event.contactSystemId}|${event.sourceEventId}|${event.nextOccurrenceAt}`;
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

async function cancelManagedReminderSchedules() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const managedIdentifiers = scheduled
    .map((item) => item.identifier)
    .filter((identifier) => {
      return (
        identifier.startsWith(MANAGED_OVERDUE_PREFIX) ||
        identifier.startsWith(MANAGED_EVENTS_PREFIX) ||
        identifier === OVERDUE_NOTIFICATION_ID ||
        identifier === EVENTS_NOTIFICATION_ID
      );
    });

  for (const identifier of managedIdentifiers) {
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {
      // ignore cancellation failures for stale ids
    });
  }

  await clearNotification(OVERDUE_NOTIFICATION_ID);
  await clearNotification(EVENTS_NOTIFICATION_ID);
}

async function buildOverdueContent(targetDate: Date): Promise<ReminderContent | null> {
  const config = await getConfig();
  const overdue = await getOverdueContacts(targetDate.toISOString());
  if (overdue.length === 0) return null;

  const topNames = overdue
    .slice(0, 3)
    .map((item) => item.nickName || item.fullName)
    .join(", ");

  const body =
    overdue.length === 1
      ? `${topNames} is overdue. Time for a call.`
      : `${overdue.length} people are overdue (${topNames}). Time for calls.`;

  return {
    title: "Friendly Reminder",
    body,
    priority: "max",
    autoDismiss: !config.shouldKeepRemindersPersistent,
    sticky: config.shouldKeepRemindersPersistent,
    data: { type: "overdue", count: overdue.length, date: toLocalDateKey(targetDate) },
  };
}

async function buildEventContent(
  targetDate: Date,
  leadDays: number,
  seenEventKeys: Set<string>,
): Promise<ReminderContent | null> {
  const upcoming = await getUpcomingContactEvents(leadDays, targetDate.toISOString());
  const upcomingKeys = upcoming.map(toEventKey);
  const newKeys = upcomingKeys.filter((key) => !seenEventKeys.has(key));
  upcomingKeys.forEach((key) => seenEventKeys.add(key));

  if (newKeys.length === 0) return null;

  const newEvents = upcoming.filter((event) => newKeys.includes(toEventKey(event)));
  const contactIds = [...new Set(newEvents.map((event) => event.contactSystemId))];
  const contacts = await getContactsBySystemIds(contactIds);
  const contactById = new Map(contacts.map((contact) => [contact.systemId, contact]));

  const preview = newEvents
    .slice(0, 3)
    .map((event) => {
      const contact = contactById.get(event.contactSystemId);
      const name = contact?.nickName || contact?.fullName || "Contact";
      const label = event.label || (event.eventType === "birthday" ? "Birthday" : "Event");
      return `${name}: ${label}`;
    })
    .join(", ");

  const title =
    newEvents.length === 1
      ? "Upcoming contact event"
      : `Upcoming contact events (${newEvents.length})`;

  return {
    title,
    body: preview || "An important contact event is coming up.",
    priority: "high",
    autoDismiss: true,
    sticky: false,
    data: { type: "events", count: newEvents.length, date: toLocalDateKey(targetDate) },
  };
}

async function scheduleManagedReminder(
  type: ReminderType,
  targetDate: Date,
  content: ReminderContent,
) {
  const dateKey = toLocalDateKey(targetDate);
  const identifier =
    type === "overdue"
      ? `${MANAGED_OVERDUE_PREFIX}${dateKey}`
      : `${MANAGED_EVENTS_PREFIX}${dateKey}`;

  const channelId =
    Platform.OS === "android"
      ? type === "overdue"
        ? OVERDUE_CHANNEL_ID
        : EVENTS_CHANNEL_ID
      : undefined;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: content.title,
      body: content.body,
      sound: "default",
      autoDismiss: content.autoDismiss,
      sticky: content.sticky,
      priority: content.priority,
      data: content.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
      ...(channelId ? { channelId } : {}),
    },
  });
}

async function runRefreshReminderNotificationSchedule(options: {
  reason: RefreshReason;
  forceSyncContacts?: boolean;
}) {
  if (Platform.OS === "web") return;

  const shouldSyncContacts = options.forceSyncContacts ?? options.reason !== "data";
  if (shouldSyncContacts) {
    await syncDeviceContactEventsOncePerDay({ allowPermissionPrompt: true }).catch(() => {
      // Keep scheduling independent from contact sync failures.
    });
  }

  const config = await getConfig();
  const now = new Date();
  const targets = listReminderTargets(now, config.reminderNotificationTime, REMINDER_WINDOW_DAYS);

  await cancelManagedReminderSchedules();

  const seenEventKeys = new Set<string>();
  for (const target of targets) {
    const overdueContent = await buildOverdueContent(target);
    if (overdueContent) {
      await scheduleManagedReminder("overdue", target, overdueContent);
    }

    const eventContent = await buildEventContent(
      target,
      config.contactEventsReminderDays,
      seenEventKeys,
    );
    if (eventContent) {
      await scheduleManagedReminder("events", target, eventContent);
    }
  }
}

export async function refreshReminderNotificationSchedule(options?: {
  reason: RefreshReason;
  forceSyncContacts?: boolean;
}) {
  if (Platform.OS === "web") return;
  const nextOptions = options ?? { reason: "data" as const };

  const nextRun = refreshQueue.then(async () => {
    await ensureNotificationRuntimeReady();
    await runRefreshReminderNotificationSchedule(nextOptions);
  });
  refreshQueue = nextRun.catch(() => {
    // keep queue alive after failures
  });
  await nextRun;
}

export async function runDailyReminderEvaluation({
  source,
  force = false,
}: {
  source: EvaluationSource;
  force?: boolean;
}) {
  if (Platform.OS === "web") return false;
  const reason: RefreshReason = source === "background" ? "focus" : source;
  await refreshReminderNotificationSchedule({
    reason,
    forceSyncContacts: force || source !== "background",
  });
  return true;
}

export async function clearOverduePersistentIfResolved() {
  if (Platform.OS === "web") return;
  await refreshReminderNotificationSchedule({ reason: "data" });
}

export async function rescheduleOnConfigChange() {
  if (Platform.OS === "web") return;
  await refreshReminderNotificationSchedule({
    reason: "config",
    forceSyncContacts: true,
  });
}

export async function initNotifications() {
  if (initialized || Platform.OS === "web") return;
  initialized = true;

  await ensureNotificationRuntimeReady();
  await BackgroundTask.unregisterTaskAsync(BACKGROUND_REMINDER_TASK).catch(() => {
    // ignore when task was never registered
  });

  await refreshReminderNotificationSchedule({
    reason: "startup",
    forceSyncContacts: true,
  });

  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state !== "active") return;
    refreshReminderNotificationSchedule({
      reason: "focus",
      forceSyncContacts: true,
    }).catch(() => {
      // ignore foreground refresh errors
    });
  });
}
