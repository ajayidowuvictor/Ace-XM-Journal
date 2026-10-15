import { beforeEach, describe, expect, it } from '@jest/globals';

import type { NoteInput } from '../../features/notes/types';
import { journalMigrations } from '../journalMigrations';
import {
  createNote,
  createNotebook,
  deleteNote,
  deleteNotebook,
  listNotebooks,
  listNotes,
  renameNotebook,
  updateNote,
} from '../notesRepo';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';
import type { SqlDatabase } from '../types';

const t1 = '2026-10-14T08:00:00.000Z';
const t2 = '2026-10-14T09:00:00.000Z';
const t3 = '2026-10-14T10:00:00.000Z';

const note: NoteInput = {
  notebookId: null,
  kind: 'note',
  title: 'Ideas',
  body: 'First line\nSecond line',
  reference: '',
  pinned: false,
};

const verse: NoteInput = {
  notebookId: null,
  kind: 'verse',
  title: '',
  body: 'The Lord is my shepherd; I shall not want.',
  reference: 'Psalm 23:1 (KJV)',
  pinned: true,
};

let db: SqlDatabase;

beforeEach(() => {
  db = createTestDatabase();
  migrate(db, journalMigrations);
});

describe('notes repository', () => {
  it('saves a note and reads it back exactly', () => {
    createNote(db, 'n1', note, t1);
    expect(listNotes(db)).toEqual([
      { id: 'n1', ...note, createdAt: t1, updatedAt: t1 },
    ]);
  });

  it('keeps a verse with its reference and pinned state', () => {
    createNote(db, 'v1', verse, t1);
    expect(listNotes(db)[0]).toMatchObject({
      kind: 'verse',
      reference: 'Psalm 23:1 (KJV)',
      pinned: true,
    });
  });

  it('lists pinned notes first, then the most recently changed', () => {
    createNote(db, 'old', note, t1);
    createNote(db, 'new', note, t3);
    createNote(db, 'pin', verse, t2);

    expect(listNotes(db).map((n) => n.id)).toEqual(['pin', 'new', 'old']);
  });

  it('updates the content and the changed time, not the created time', () => {
    createNote(db, 'n1', note, t1);
    updateNote(db, 'n1', { ...note, title: 'Better', pinned: true, kind: 'text' }, t2);

    expect(listNotes(db)[0]).toMatchObject({
      title: 'Better',
      pinned: true,
      kind: 'text',
      createdAt: t1,
      updatedAt: t2,
    });
  });

  it('erases the content of a deleted note and hides it', () => {
    createNote(db, 'n1', verse, t1);
    createNote(db, 'n2', note, t1);

    deleteNote(db, 'n1', t2);

    expect(listNotes(db).map((n) => n.id)).toEqual(['n2']);
    expect(
      db.first(`SELECT title, body, reference, pinned, deleted_at FROM notes WHERE id = 'n1'`),
    ).toEqual({ title: '', body: '', reference: '', pinned: 0, deleted_at: t2 });
  });

  it('does not change a note that was already deleted', () => {
    createNote(db, 'n1', note, t1);
    deleteNote(db, 'n1', t2);
    updateNote(db, 'n1', { ...note, title: 'Back again' }, t3);

    expect(listNotes(db)).toEqual([]);
    expect(db.first(`SELECT title FROM notes WHERE id = 'n1'`)).toEqual({ title: '' });
  });

  it('stores text with quotes and symbols exactly as typed', () => {
    const awkward = `It's "fine"; DROP TABLE notes; --`;
    createNote(db, 'n1', { ...note, body: awkward }, t1);
    expect(listNotes(db)[0].body).toBe(awkward);
  });

  it('stores a long text of many paragraphs without cutting it', () => {
    const long = Array.from({ length: 400 }, (_, i) => `Paragraph ${i}.`).join('\n\n');
    createNote(db, 'n1', { ...note, kind: 'text', body: long }, t1);
    expect(listNotes(db)[0].body).toBe(long);
  });

  it('reads an unknown kind as a plain note', () => {
    createNote(db, 'n1', note, t1);
    db.run(`UPDATE notes SET kind = 'something-new' WHERE id = 'n1'`);
    expect(listNotes(db)[0].kind).toBe('note');
  });
});

describe('notebooks', () => {
  it('lists notebooks alphabetically, ignoring case', () => {
    createNotebook(db, 'b', 'sermons', t1);
    createNotebook(db, 'a', 'Scriptures', t1);
    createNotebook(db, 'c', 'Ideas', t1);

    expect(listNotebooks(db).map((n) => n.name)).toEqual(['Ideas', 'Scriptures', 'sermons']);
  });

  it('renames a notebook', () => {
    createNotebook(db, 'a', 'Ideas', t1);
    renameNotebook(db, 'a', 'Big ideas', t2);
    expect(listNotebooks(db)[0]).toMatchObject({ name: 'Big ideas', updatedAt: t2, createdAt: t1 });
  });

  it('keeps the notes of a deleted notebook and moves them out of it', () => {
    createNotebook(db, 'a', 'Scriptures', t1);
    createNote(db, 'n1', { ...verse, notebookId: 'a' }, t1);
    createNote(db, 'n2', { ...note, notebookId: 'a' }, t1);

    deleteNotebook(db, 'a', t2);

    expect(listNotebooks(db)).toEqual([]);
    const notes = listNotes(db);
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.notebookId === null)).toBe(true);
    expect(db.first(`SELECT name, deleted_at FROM notebooks WHERE id = 'a'`)).toEqual({
      name: '',
      deleted_at: t2,
    });
  });

  it('leaves the notes of other notebooks alone', () => {
    createNotebook(db, 'a', 'One', t1);
    createNotebook(db, 'b', 'Two', t1);
    createNote(db, 'n1', { ...note, notebookId: 'b' }, t1);

    deleteNotebook(db, 'a', t2);

    expect(listNotes(db)[0].notebookId).toBe('b');
    expect(listNotebooks(db).map((n) => n.id)).toEqual(['b']);
  });
});
