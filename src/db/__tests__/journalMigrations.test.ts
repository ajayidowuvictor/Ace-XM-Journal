import { describe, expect, it } from '@jest/globals';

import { journalMigrations } from '../journalMigrations';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';

describe('journal migrations', () => {
  it('have increasing version numbers starting at 1', () => {
    expect(journalMigrations.map((m) => m.version)).toEqual(journalMigrations.map((_, i) => i + 1));
  });

  it('create the entry and tag tables and can run twice', () => {
    const db = createTestDatabase();
    migrate(db, journalMigrations);
    expect(migrate(db, journalMigrations)).toBe(journalMigrations.length);

    const tables = db
      .all<{ name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(['journal_entries', 'entry_tags']));
  });
});
