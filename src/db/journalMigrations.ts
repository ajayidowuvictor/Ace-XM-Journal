import type { Migration } from './migrations';

/** Layout of the encrypted journal database. Same rules as the main migrations: append only. */
export const journalMigrations: readonly Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE journal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        entry_date TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        mood INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX idx_journal_entries_date ON journal_entries (entry_date);
      CREATE TABLE entry_tags (
        entry_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (entry_id, tag)
      );
    `,
  },
  {
    // Notes, verses and long texts, filed in notebooks. Kept in the encrypted journal database.
    version: 2,
    sql: `
      CREATE TABLE notebooks (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE TABLE notes (
        id TEXT PRIMARY KEY NOT NULL,
        notebook_id TEXT,
        kind TEXT NOT NULL DEFAULT 'note',
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        reference TEXT NOT NULL DEFAULT '',
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX idx_notes_notebook ON notes (notebook_id);
    `,
  },
];
