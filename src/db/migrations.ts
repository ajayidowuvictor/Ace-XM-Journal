import type { SqlDatabase } from './types';

export type Migration = { version: number; sql: string };

/**
 * Numbered, append-only changes to the database layout. Never edit a migration that has shipped;
 * add a new one instead. Every row has a UUID, created/updated times and a soft-delete time.
 */
export const migrations: readonly Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        due_date TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX idx_tasks_due_date ON tasks (due_date);
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE habits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE TABLE habit_completions (
        habit_id TEXT NOT NULL,
        completed_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (habit_id, completed_date)
      );
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE goals (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        target_date TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE TABLE milestones (
        id TEXT PRIMARY KEY NOT NULL,
        goal_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX idx_milestones_goal ON milestones (goal_id);
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TABLE plan_focus (
        plan_date TEXT NOT NULL,
        task_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (plan_date, task_id)
      );
      CREATE TABLE plan_blocks (
        id TEXT PRIMARY KEY NOT NULL,
        plan_date TEXT NOT NULL,
        title TEXT NOT NULL,
        task_id TEXT,
        start_minutes INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX idx_plan_blocks_date ON plan_blocks (plan_date);
    `,
  },
  {
    version: 5,
    sql: `
      ALTER TABLE tasks ADD COLUMN repeat TEXT NOT NULL DEFAULT 'none';
      ALTER TABLE tasks ADD COLUMN reminder_time TEXT;
    `,
  },
  {
    version: 6,
    sql: `
      ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'none';
    `,
  },
  {
    version: 7,
    // Which weekdays a habit repeats on, as digits (0 Monday to 6 Sunday). Every day by default.
    sql: `
      ALTER TABLE habits ADD COLUMN days TEXT NOT NULL DEFAULT '0123456';
    `,
  },
  {
    version: 8,
    // The goal a task counts towards, or nothing. Tasks without a goal are unchanged.
    sql: `
      ALTER TABLE tasks ADD COLUMN goal_id TEXT;
    `,
  },
];

/** Applies any migrations the database has not seen yet. Returns the resulting version. */
export function migrate(db: SqlDatabase, list: readonly Migration[] = migrations): number {
  const current = db.first<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  const pending = list.filter((m) => m.version > current).sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    db.transaction(() => {
      db.exec(migration.sql);
      db.exec(`PRAGMA user_version = ${migration.version}`);
    });
  }

  return pending.length > 0 ? pending[pending.length - 1].version : current;
}
