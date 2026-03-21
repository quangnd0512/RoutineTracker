import * as SQLite from 'expo-sqlite';
import log from './logger';

export type SQLiteDatabase = SQLite.SQLiteDatabase;

let _db: SQLiteDatabase | null = null;

const SCHEMA_VERSION = 1;

const MIGRATIONS = [
  // Version 1: Initial schema
  `
    CREATE TABLE IF NOT EXISTS routine_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      icon TEXT,
      do_it_at TEXT,
      repeat TEXT,
      repeat_values TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      task_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES routine_tasks(id) ON DELETE CASCADE,
      UNIQUE(task_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(date);

    CREATE TABLE IF NOT EXISTS mood_logs (
      date TEXT PRIMARY KEY NOT NULL,
      mood_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `,
];

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  log.info('[DB] Running database migrations');

  // Get current schema version
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  log.info('[DB] Current schema version:', { currentVersion, targetVersion: SCHEMA_VERSION });

  if (currentVersion >= SCHEMA_VERSION) {
    log.info('[DB] Schema is up to date, no migrations needed');
    return;
  }

  // Run pending migrations
  for (let version = currentVersion + 1; version <= SCHEMA_VERSION; version++) {
    const migrationIndex = version - 1;
    if (migrationIndex < MIGRATIONS.length) {
      log.info(`[DB] Running migration to version ${version}`);
      try {
        await db.execAsync(MIGRATIONS[migrationIndex]); 
      } catch (error) {
        log.error(`[DB] Migration to version ${version} failed`, { error });
        throw error;
      }
    }
  }

  // Update schema version
  await db.runAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  log.info('[DB] Migrations complete, schema version:', { version: SCHEMA_VERSION });
}

export async function getDB(): Promise<SQLiteDatabase> {
  if (_db !== null) {
    return _db;
  }

  try {
    log.info('[DB] Opening database connection');
  
    const db = await SQLite.openDatabaseAsync('routine_tracker.db');
  
    // Enable WAL mode and foreign keys
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');
  
    // Run migrations
    await runMigrations(db);
  
    _db = db;
    log.info('[DB] Database connection established');
  
    return db; 
  } catch (error) {
    log.error('[DB] Failed to open database', { error });
    throw error;
  }
}
