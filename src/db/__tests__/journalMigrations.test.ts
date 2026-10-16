import { describe, expect, it } from '@jest/globals';

import { journalMigrations } from '../journalMigrations';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';

describe('journal migrations', () => {
  it('have increasing version numbers starting at 1', () => {
    expect(journalMigrations.map((m) => m.version)).toEqual(journalMigrations.map((_, i) => i + 1));
  });

  it('create the entry, tag, note and notebook tables and can run twice', () => {
    const db = createTestDatabase();
    migrate(db, journalMigrations);
    expect(migrate(db, journalMigrations)).toBe(journalMigrations.length);

    const tables = db
      .all<{ name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .map((t) => t.name);
    expect(tables).toEqual(
      expect.arrayContaining(['journal_entries', 'entry_tags', 'notes', 'notebooks']),
    );
  });

  it('keep existing entries when the note tables are added', () => {
    const db = createTestDatabase();
    migrate(db, journalMigrations.slice(0, 1));
    db.run(
      `INSERT INTO journal_entries (id, entry_date, title, body, created_at, updated_at)
       VALUES ('e1', '2026-10-14', 'Kept', 'Still here', 't', 't')`,
    );

    expect(migrate(db, journalMigrations)).toBe(journalMigrations.length);

    expect(db.first(`SELECT title, body FROM journal_entries WHERE id = 'e1'`)).toEqual({
      title: 'Kept',
      body: 'Still here',
    });
  });
});
