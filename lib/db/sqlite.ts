import * as SQLite from 'expo-sqlite';

const DB_NAME = 'friendly-reminder.db';
const TARGET_DB_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

type ConfigSeed = {
  key: string;
  valueInt?: number;
  valueBool?: number;
  valueText?: string;
};

const DEFAULT_CONFIG_ROWS: ConfigSeed[] = [
  { key: 'default_cadence_inner_days', valueInt: 14 },
  { key: 'default_cadence_mid_days', valueInt: 30 },
  { key: 'default_cadence_outer_days', valueInt: 90 },
  { key: 'fuzzy_reminders_enabled', valueBool: 1 },
  { key: 'should_keep_reminders_persistent', valueBool: 1 },
  { key: 'reminder_notification_time', valueText: '10:00' },
  { key: 'contact_events_reminder_days', valueInt: 7 },
  { key: 'automatic_logging', valueBool: 0 },
];

async function migrateToV1(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS contacts (
      system_id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      nick_name TEXT,
      image_uri TEXT,
      description TEXT,
      circle_id TEXT NOT NULL CHECK (circle_id IN ('inner','mid','outer')),
      custom_reminder_days INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_system_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      summary TEXT NOT NULL,
      was_overdue INTEGER NOT NULL CHECK (was_overdue IN (0,1)),
      FOREIGN KEY(contact_system_id) REFERENCES contacts(system_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY NOT NULL,
      value_text TEXT,
      value_int INTEGER,
      value_bool INTEGER CHECK (value_bool IN (0,1)),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_circle ON contacts(circle_id);
    CREATE INDEX IF NOT EXISTS idx_logs_contact_created_desc ON contact_logs(contact_system_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_created_desc ON contact_logs(created_at DESC);
  `);

  for (const row of DEFAULT_CONFIG_ROWS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO app_config (key, value_text, value_int, value_bool) VALUES (?, ?, ?, ?)`,
      [row.key, row.valueText ?? null, row.valueInt ?? null, row.valueBool ?? null]
    );
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateToV1(db);
    await db.execAsync('PRAGMA user_version = 1;');
  }

  if (currentVersion > TARGET_DB_VERSION) {
    throw new Error(`Database version ${currentVersion} is newer than app version ${TARGET_DB_VERSION}`);
  }
}

export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      return db;
    })();
  }
  return dbPromise;
}

export async function initDatabase() {
  await getDatabase();
}
