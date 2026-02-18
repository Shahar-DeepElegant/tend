import { getDatabase } from './sqlite';
import type {
  AppConfig,
  AppConfigUpdate,
  CircleId,
  ContactEventInput,
  ContactEventRecord,
  ContactInput,
  ContactLogRecord,
  ContactRecord,
  ContactUpdatePatch,
  GardenContactRow,
  LeafProfileData,
  NotificationStateRecord,
  UpNextContactRow,
} from './types';

const CIRCLE_ORDER: Record<CircleId, number> = {
  inner: 1,
  mid: 2,
  outer: 3,
};

const DEFAULT_CONFIG: AppConfig = {
  defaultCadenceInnerDays: 14,
  defaultCadenceMidDays: 30,
  defaultCadenceOuterDays: 90,
  fuzzyRemindersEnabled: true,
  shouldKeepRemindersPersistent: true,
  reminderNotificationTime: '10:00',
  contactEventsReminderDays: 7,
  automaticLogging: false,
};

type ConfigRow = {
  key: string;
  value_text: string | null;
  value_int: number | null;
  value_bool: number | null;
};

type ContactRowDb = {
  system_id: string;
  full_name: string;
  nick_name: string | null;
  image_uri: string | null;
  description: string | null;
  circle_id: CircleId;
  custom_reminder_days: number | null;
  created_at: string;
  updated_at: string;
};

type ContactListBaseRow = {
  system_id: string;
  full_name: string;
  nick_name: string | null;
  image_uri: string | null;
  description: string | null;
  circle_id: CircleId;
  custom_reminder_days: number | null;
  last_spoke_at: string | null;
  base_due_at: string;
};

type LogRowDb = {
  id: number;
  contact_system_id: string;
  created_at: string;
  summary: string;
  was_overdue: 0 | 1;
};

type ContactEventRowDb = {
  id: number;
  contact_system_id: string;
  source_event_id: string;
  event_type: 'birthday' | 'anniversary' | 'custom';
  label: string | null;
  month: number;
  day: number;
  year: number | null;
  next_occurrence_at: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
};

type RuntimeStateRowDb = {
  key: string;
  value_text: string | null;
  updated_at: string;
};

function toBool(value: number | null | undefined, fallback: boolean) {
  if (value === null || value === undefined) return fallback;
  return value === 1;
}

function mapConfigRows(rows: ConfigRow[]): AppConfig {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return {
    defaultCadenceInnerDays:
      byKey.get('default_cadence_inner_days')?.value_int ?? DEFAULT_CONFIG.defaultCadenceInnerDays,
    defaultCadenceMidDays:
      byKey.get('default_cadence_mid_days')?.value_int ?? DEFAULT_CONFIG.defaultCadenceMidDays,
    defaultCadenceOuterDays:
      byKey.get('default_cadence_outer_days')?.value_int ?? DEFAULT_CONFIG.defaultCadenceOuterDays,
    fuzzyRemindersEnabled: toBool(
      byKey.get('fuzzy_reminders_enabled')?.value_bool,
      DEFAULT_CONFIG.fuzzyRemindersEnabled
    ),
    shouldKeepRemindersPersistent: toBool(
      byKey.get('should_keep_reminders_persistent')?.value_bool,
      DEFAULT_CONFIG.shouldKeepRemindersPersistent
    ),
    reminderNotificationTime:
      byKey.get('reminder_notification_time')?.value_text ?? DEFAULT_CONFIG.reminderNotificationTime,
    contactEventsReminderDays:
      byKey.get('contact_events_reminder_days')?.value_int ?? DEFAULT_CONFIG.contactEventsReminderDays,
    automaticLogging: toBool(byKey.get('automatic_logging')?.value_bool, DEFAULT_CONFIG.automaticLogging),
  };
}

function sqlNowToISO(sqlDate: string | null) {
  if (!sqlDate) return null;
  return `${sqlDate.replace(' ', 'T')}Z`;
}

function isoToSqlDate(input?: string) {
  if (!input) return null;
  return new Date(input).toISOString().slice(0, 19).replace('T', ' ');
}

function toNextOccurrenceISO(month: number, day: number, nowDate = new Date()) {
  const safeMonth = Math.max(1, Math.min(12, month));
  const safeDay = Math.max(1, Math.min(31, day));
  const year = nowDate.getFullYear();
  let candidate = new Date(year, safeMonth - 1, safeDay, 9, 0, 0, 0);
  if (candidate.getMonth() !== safeMonth - 1) {
    candidate = new Date(year, safeMonth, 0, 9, 0, 0, 0);
  }
  if (candidate.getTime() < nowDate.getTime()) {
    candidate = new Date(year + 1, safeMonth - 1, safeDay, 9, 0, 0, 0);
    if (candidate.getMonth() !== safeMonth - 1) {
      candidate = new Date(year + 1, safeMonth, 0, 9, 0, 0, 0);
    }
  }
  return candidate.toISOString();
}

function fromContactRow(row: ContactRowDb): ContactRecord {
  return {
    systemId: row.system_id,
    fullName: row.full_name,
    nickName: row.nick_name,
    imageUri: row.image_uri,
    description: row.description,
    circleId: row.circle_id,
    customReminderDays: row.custom_reminder_days,
    createdAt: sqlNowToISO(row.created_at) ?? new Date().toISOString(),
    updatedAt: sqlNowToISO(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapListRow(row: ContactListBaseRow & { due_at: string; overdue_seconds: number }): GardenContactRow {
  const overdueSeconds = Number(row.overdue_seconds ?? 0);
  return {
    systemId: row.system_id,
    fullName: row.full_name,
    nickName: row.nick_name,
    imageUri: row.image_uri,
    description: row.description,
    circleId: row.circle_id,
    customReminderDays: row.custom_reminder_days,
    lastSpokeAt: sqlNowToISO(row.last_spoke_at),
    dueAt: sqlNowToISO(row.due_at),
    overdueSeconds,
    isOverdue: overdueSeconds > 0,
  };
}

function getEffectiveCadenceDays(contact: ContactRecord, config: AppConfig) {
  if (contact.customReminderDays !== null) return contact.customReminderDays;
  if (contact.circleId === 'inner') return config.defaultCadenceInnerDays;
  if (contact.circleId === 'mid') return config.defaultCadenceMidDays;
  return config.defaultCadenceOuterDays;
}

function formatDateDistance(iso: string | null) {
  if (!iso) return 'Never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export async function getConfig(): Promise<AppConfig> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ConfigRow>('SELECT key, value_text, value_int, value_bool FROM app_config');
  return mapConfigRows(rows);
}

const CONFIG_KEY_BY_FIELD: Record<keyof AppConfigUpdate, string> = {
  defaultCadenceInnerDays: 'default_cadence_inner_days',
  defaultCadenceMidDays: 'default_cadence_mid_days',
  defaultCadenceOuterDays: 'default_cadence_outer_days',
  fuzzyRemindersEnabled: 'fuzzy_reminders_enabled',
  shouldKeepRemindersPersistent: 'should_keep_reminders_persistent',
  reminderNotificationTime: 'reminder_notification_time',
  contactEventsReminderDays: 'contact_events_reminder_days',
  automaticLogging: 'automatic_logging',
};

export async function updateConfig(patch: AppConfigUpdate) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const [field, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const key = CONFIG_KEY_BY_FIELD[field as keyof AppConfigUpdate];
      const asNumber = typeof value === 'number' ? value : null;
      const asBool = typeof value === 'boolean' ? (value ? 1 : 0) : null;
      const asText = typeof value === 'string' ? value : null;
      await db.runAsync(
        `INSERT INTO app_config (key, value_text, value_int, value_bool, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET
           value_text=excluded.value_text,
           value_int=excluded.value_int,
           value_bool=excluded.value_bool,
           updated_at=datetime('now')`,
        [key, asText, asNumber, asBool]
      );
    }
  });
}

export async function upsertContact(input: ContactInput) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO contacts (
      system_id,
      full_name,
      nick_name,
      image_uri,
      description,
      circle_id,
      custom_reminder_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(system_id) DO UPDATE SET
      full_name=excluded.full_name,
      nick_name=excluded.nick_name,
      image_uri=excluded.image_uri,
      description=excluded.description,
      circle_id=excluded.circle_id,
      custom_reminder_days=excluded.custom_reminder_days,
      updated_at=datetime('now')`,
    [
      input.systemId,
      input.fullName,
      input.nickName ?? null,
      input.imageUri ?? null,
      input.description ?? null,
      input.circleId,
      input.customReminderDays ?? null,
    ]
  );
}

export async function updateContactFields(systemId: string, patch: ContactUpdatePatch) {
  const db = await getDatabase();
  const clauses: string[] = [];
  const args: (string | number | null)[] = [];

  if (patch.description !== undefined) {
    clauses.push('description = ?');
    args.push(patch.description);
  }

  if (patch.customReminderDays !== undefined) {
    clauses.push('custom_reminder_days = ?');
    args.push(patch.customReminderDays);
  }

  if (clauses.length === 0) return;

  clauses.push("updated_at=datetime('now')");
  args.push(systemId);

  await db.runAsync(`UPDATE contacts SET ${clauses.join(', ')} WHERE system_id = ?`, args);
}

export async function deleteContact(systemId: string) {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM contacts WHERE system_id = ?`, [systemId]);
}

export async function getAllContacts(): Promise<ContactRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ContactRowDb>(`SELECT * FROM contacts ORDER BY full_name COLLATE NOCASE ASC`);
  return rows.map(fromContactRow);
}

export async function getContactsBySystemIds(systemIds: string[]): Promise<ContactRecord[]> {
  if (systemIds.length === 0) return [];
  const db = await getDatabase();
  const placeholders = systemIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<ContactRowDb>(
    `SELECT * FROM contacts WHERE system_id IN (${placeholders})`,
    systemIds
  );
  return rows.map(fromContactRow);
}

async function listContactsForViews(searchQuery?: string): Promise<GardenContactRow[]> {
  const db = await getDatabase();
  const config = await getConfig();
  const normalizedQuery = searchQuery?.trim() ?? '';
  const hasSearch = normalizedQuery.length > 0;
  const likeQuery = `%${normalizedQuery}%`;

  const args: (string | number)[] = [
    config.defaultCadenceInnerDays,
    config.defaultCadenceMidDays,
    config.defaultCadenceOuterDays,
  ];
  if (hasSearch) {
    args.push(likeQuery, likeQuery);
  }
  const rows = await db.getAllAsync<ContactListBaseRow>(
    `SELECT
       c.system_id,
       c.full_name,
       c.nick_name,
       c.image_uri,
       c.description,
       c.circle_id,
       c.custom_reminder_days,
       ll.last_spoke_at,
       CASE
         WHEN ll.last_spoke_at IS NULL THEN datetime('1970-01-01')
         ELSE datetime(ll.last_spoke_at, '+' || (
           COALESCE(
             c.custom_reminder_days,
             CASE c.circle_id
               WHEN 'inner' THEN ?
               WHEN 'mid' THEN ?
               ELSE ?
             END
           )
         ) || ' days')
       END AS base_due_at
     FROM contacts c
     LEFT JOIN (
       SELECT contact_system_id, MAX(created_at) AS last_spoke_at
       FROM contact_logs
       GROUP BY contact_system_id
     ) ll ON ll.contact_system_id = c.system_id
     ${hasSearch ? `WHERE c.full_name LIKE ? COLLATE NOCASE OR c.nick_name LIKE ? COLLATE NOCASE` : ''}`,
    args
  );

  return rows
    .map((row: ContactListBaseRow) => {
      const cadenceDays =
        row.custom_reminder_days ??
        (row.circle_id === 'inner'
          ? config.defaultCadenceInnerDays
          : row.circle_id === 'mid'
            ? config.defaultCadenceMidDays
            : config.defaultCadenceOuterDays);
      const baseDueAt = sqlNowToISO(row.base_due_at);
      const baseMs = baseDueAt ? new Date(baseDueAt).getTime() : Date.now();
      const fuzzyMs = config.fuzzyRemindersEnabled ? cadenceDays * 0.3 * 24 * 60 * 60 * 1000 : 0;
      const dueMs = baseMs + fuzzyMs;
      const overdueSeconds = Math.floor((Date.now() - dueMs) / 1000);
      return mapListRow({
        ...row,
        due_at: new Date(dueMs).toISOString().slice(0, 19).replace('T', ' '),
        overdue_seconds: overdueSeconds,
      });
    })
    .sort((a: GardenContactRow, b: GardenContactRow) => {
      const circleSort = CIRCLE_ORDER[a.circleId] - CIRCLE_ORDER[b.circleId];
      if (circleSort !== 0) return circleSort;
      return a.fullName.localeCompare(b.fullName);
    });
}

export async function getGardenContacts(searchQuery?: string): Promise<GardenContactRow[]> {
  return listContactsForViews(searchQuery);
}

export async function getUpNextContacts(): Promise<UpNextContactRow[]> {
  const rows = await listContactsForViews();
  return rows.sort((a, b) => {
    if (a.overdueSeconds !== b.overdueSeconds) return b.overdueSeconds - a.overdueSeconds;
    return a.fullName.localeCompare(b.fullName);
  });
}

export async function getOverdueContacts(nowISO?: string): Promise<UpNextContactRow[]> {
  const rows = await getUpNextContacts();
  if (!nowISO) {
    return rows.filter((row) => row.overdueSeconds > 0);
  }
  const nowMs = new Date(nowISO).getTime();
  return rows.filter((row) => row.dueAt && new Date(row.dueAt).getTime() < nowMs);
}

function mapContactEventRow(row: ContactEventRowDb): ContactEventRecord {
  return {
    id: row.id,
    contactSystemId: row.contact_system_id,
    sourceEventId: row.source_event_id,
    label: row.label,
    eventType: row.event_type,
    month: row.month,
    day: row.day,
    year: row.year,
    nextOccurrenceAt: sqlNowToISO(row.next_occurrence_at) ?? new Date().toISOString(),
    isActive: row.is_active === 1,
    createdAt: sqlNowToISO(row.created_at) ?? new Date().toISOString(),
    updatedAt: sqlNowToISO(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function upsertContactEvents(contactSystemId: string, events: ContactEventInput[]) {
  const db = await getDatabase();
  const now = new Date();
  await db.withTransactionAsync(async () => {
    for (const event of events) {
      const nextOccurrence = toNextOccurrenceISO(event.month, event.day, now);
      await db.runAsync(
        `INSERT INTO contact_events (
          contact_system_id,
          source_event_id,
          event_type,
          label,
          month,
          day,
          year,
          next_occurrence_at,
          is_active,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(contact_system_id, source_event_id) DO UPDATE SET
          event_type=excluded.event_type,
          label=excluded.label,
          month=excluded.month,
          day=excluded.day,
          year=excluded.year,
          next_occurrence_at=excluded.next_occurrence_at,
          is_active=excluded.is_active,
          updated_at=datetime('now')`,
        [
          contactSystemId,
          event.sourceEventId,
          event.eventType,
          event.label ?? null,
          event.month,
          event.day,
          event.year ?? null,
          isoToSqlDate(nextOccurrence),
          event.isActive === false ? 0 : 1,
        ]
      );
    }
  });
}

export async function replaceContactEventsForContact(contactSystemId: string, events: ContactEventInput[]) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM contact_events WHERE contact_system_id = ?`, [contactSystemId]);
    if (events.length === 0) return;
    for (const event of events) {
      const nextOccurrence = toNextOccurrenceISO(event.month, event.day);
      await db.runAsync(
        `INSERT INTO contact_events (
          contact_system_id,
          source_event_id,
          event_type,
          label,
          month,
          day,
          year,
          next_occurrence_at,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactSystemId,
          event.sourceEventId,
          event.eventType,
          event.label ?? null,
          event.month,
          event.day,
          event.year ?? null,
          isoToSqlDate(nextOccurrence),
          event.isActive === false ? 0 : 1,
        ]
      );
    }
  });
}

export async function getUpcomingContactEvents(leadDays: number, nowISO?: string): Promise<ContactEventRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ContactEventRowDb>(
    `SELECT *
     FROM contact_events
     WHERE is_active = 1
     ORDER BY next_occurrence_at ASC`
  );
  const nowMs = nowISO ? new Date(nowISO).getTime() : Date.now();
  const endMs = nowMs + Math.max(0, leadDays) * 24 * 60 * 60 * 1000;
  return rows
    .map(mapContactEventRow)
    .filter((row) => {
      const eventMs = new Date(row.nextOccurrenceAt).getTime();
      return eventMs >= nowMs && eventMs <= endMs;
    });
}

export async function getNotificationState(key: string): Promise<NotificationStateRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<RuntimeStateRowDb>(
    `SELECT key, value_text, updated_at FROM app_runtime_state WHERE key = ?`,
    [key]
  );
  if (!row) return null;
  return {
    key: row.key,
    valueText: row.value_text,
    updatedAt: sqlNowToISO(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function setNotificationState(key: string, valueText: string | null) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_runtime_state (key, value_text, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value_text=excluded.value_text,
       updated_at=datetime('now')`,
    [key, valueText]
  );
}

export async function getLatestLogsByContact(contactSystemId: string, limit = 31): Promise<ContactLogRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LogRowDb>(
    `SELECT id, contact_system_id, created_at, summary, was_overdue
     FROM contact_logs
     WHERE contact_system_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [contactSystemId, limit]
  );
  return rows.map((row: LogRowDb) => ({
    id: row.id,
    contactSystemId: row.contact_system_id,
    createdAt: sqlNowToISO(row.created_at) ?? new Date().toISOString(),
    summary: row.summary,
    wasOverdue: row.was_overdue === 1,
  }));
}

function computeStreak(logs: ContactLogRecord[]) {
  let streak = 0;
  for (const log of logs) {
    if (log.wasOverdue) break;
    streak += 1;
  }
  return streak;
}

export async function getLeafProfileData(systemId: string): Promise<LeafProfileData | null> {
  const db = await getDatabase();
  const contactRow = await db.getFirstAsync<ContactRowDb>(`SELECT * FROM contacts WHERE system_id = ?`, [systemId]);
  if (!contactRow) return null;

  const contact = fromContactRow(contactRow);
  const config = await getConfig();
  const logs = await getLatestLogsByContact(systemId, 31);
  const lastSpokeAt = logs[0]?.createdAt ?? null;
  const effectiveCadenceDays = getEffectiveCadenceDays(contact, config);
  const dueAt =
    lastSpokeAt === null
      ? null
      : new Date(new Date(lastSpokeAt).getTime() + effectiveCadenceDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    contact,
    lastSpokeAt,
    effectiveCadenceDays,
    dueAt,
    streakCount: computeStreak(logs),
    logs,
  };
}

export async function getFirstContactId() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ system_id: string }>(
    `SELECT system_id FROM contacts ORDER BY created_at ASC LIMIT 1`
  );
  return row?.system_id ?? null;
}

export async function computeWasOverdueAt(contactSystemId: string, createdAtISO: string) {
  const profile = await getLeafProfileData(contactSystemId);
  if (!profile || !profile.lastSpokeAt) return false;

  const config = await getConfig();
  const cadenceDays = profile.effectiveCadenceDays;
  const lastSpokeMs = new Date(profile.lastSpokeAt).getTime();
  const dueMs = lastSpokeMs + cadenceDays * 24 * 60 * 60 * 1000;
  const fuzzyMs = config.fuzzyRemindersEnabled ? cadenceDays * 0.3 * 24 * 60 * 60 * 1000 : 0;
  const upperBoundMs = dueMs + fuzzyMs;
  const createdMs = new Date(createdAtISO).getTime();
  return createdMs > upperBoundMs;
}

export async function insertContactLog(input: {
  contactSystemId: string;
  summary: string;
  createdAtISO?: string;
}) {
  const db = await getDatabase();
  const createdAtISO = input.createdAtISO ?? new Date().toISOString();
  const wasOverdue = await computeWasOverdueAt(input.contactSystemId, createdAtISO);

  const result = await db.runAsync(
    `INSERT INTO contact_logs (contact_system_id, created_at, summary, was_overdue)
     VALUES (?, ?, ?, ?)`,
    [input.contactSystemId, isoToSqlDate(createdAtISO), input.summary, wasOverdue ? 1 : 0]
  );
  return result.lastInsertRowId;
}

export function formatLastSpokeLabel(lastSpokeAt: string | null) {
  return `Last spoke: ${formatDateDistance(lastSpokeAt)}`;
}
