import { beforeEach, describe, expect, it } from '@jest/globals';

import type { EntryInput } from '../../features/journal/types';
import { journalMigrations } from '../journalMigrations';
import { createEntry, deleteEntry, listEntries, updateEntry } from '../journalRepo';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';
import type { SqlDatabase } from '../types';

const t1 = '2026-10-14T08:00:00.000Z';
const t2 = '2026-10-14T09:00:00.000Z';
const input: EntryInput = {
  title: 'A good day',
  body: 'Met the team.\nShipped the first version.',
  mood: 4,
  tags: ['work', 'family'],
};

let db: SqlDatabase;

beforeEach(() => {
  db = createTestDatabase();
  migrate(db, journalMigrations);
});

describe('journal repository', () => {
  it('saves an entry with its tags and mood', () => {
    createEntry(db, 'e1', '2026-10-14', input, t1);

    expect(listEntries(db)).toEqual([
      {
        id: 'e1',
        entryDate: '2026-10-14',
        title: 'A good day',
        body: 'Met the team.\nShipped the first version.',
        mood: 4,
        tags: ['family', 'work'],
        createdAt: t1,
        updatedAt: t1,
      },
    ]);
  });

  it('keeps an entry without a mood or tags', () => {
    createEntry(db, 'e1', '2026-10-14', { title: '', body: 'Just text', mood: null, tags: [] }, t1);
    const [entry] = listEntries(db);
    expect(entry.mood).toBeNull();
    expect(entry.tags).toEqual([]);
  });

  it('lists the newest day first', () => {
    createEntry(db, 'old', '2026-10-01', input, t1);
    createEntry(db, 'new', '2026-10-14', input, t1);
    createEntry(db, 'mid', '2026-10-07', input, t1);

    expect(listEntries(db).map((e) => e.id)).toEqual(['new', 'mid', 'old']);
  });

  it('updates text, mood and tags and the updated time, not the date or created time', () => {
    createEntry(db, 'e1', '2026-10-14', input, t1);
    updateEntry(db, 'e1', { title: 'Better', body: 'Edited', mood: 5, tags: ['joy'] }, t2);

    expect(listEntries(db)[0]).toMatchObject({
      title: 'Better',
      body: 'Edited',
      mood: 5,
      tags: ['joy'],
      entryDate: '2026-10-14',
      createdAt: t1,
      updatedAt: t2,
    });
  });

  it('finds entries by title, text or tag, ignoring case', () => {
    createEntry(db, 'a', '2026-10-14', input, t1);
    createEntry(
      db,
      'b',
      '2026-10-13',
      { title: 'Quiet', body: 'Rested', mood: null, tags: ['health'] },
      t1,
    );

    expect(listEntries(db, 'GOOD DAY').map((e) => e.id)).toEqual(['a']);
    expect(listEntries(db, 'rested').map((e) => e.id)).toEqual(['b']);
    expect(listEntries(db, 'health').map((e) => e.id)).toEqual(['b']);
    expect(listEntries(db, 'nothing like this')).toEqual([]);
    expect(listEntries(db, '   ')).toHaveLength(2);
  });

  it('matches % and _ in a search as plain characters', () => {
    createEntry(db, 'a', '2026-10-14', { title: '100% done', body: '', mood: null, tags: [] }, t1);
    createEntry(db, 'b', '2026-10-14', { title: 'Other', body: '', mood: null, tags: [] }, t1);

    expect(listEntries(db, '%').map((e) => e.id)).toEqual(['a']);
    expect(listEntries(db, '_')).toEqual([]);
  });

  it('erases the content of a deleted entry and hides it', () => {
    createEntry(db, 'e1', '2026-10-14', input, t1);
    createEntry(db, 'e2', '2026-10-14', { ...input, title: 'Keep' }, t1);

    deleteEntry(db, 'e1', t2);

    expect(listEntries(db).map((e) => e.id)).toEqual(['e2']);
    expect(listEntries(db, 'Shipped').map((e) => e.id)).toEqual(['e2']);
    expect(
      db.first(`SELECT title, body, mood, deleted_at FROM journal_entries WHERE id = 'e1'`),
    ).toEqual({ title: '', body: '', mood: null, deleted_at: t2 });
    expect(db.all(`SELECT tag FROM entry_tags WHERE entry_id = 'e1'`)).toEqual([]);
  });

  it('stores text with quotes and symbols exactly as typed', () => {
    const awkward = `It's "fine"; DROP TABLE journal_entries; --`;
    createEntry(db, 'e1', '2026-10-14', { ...input, body: awkward }, t1);
    expect(listEntries(db)[0].body).toBe(awkward);
  });
});
