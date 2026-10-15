import type { Note, NoteInput, NoteKind, Notebook } from '../features/notes/types';
import type { SqlDatabase } from './types';

type NoteRow = {
  id: string;
  notebook_id: string | null;
  kind: string;
  title: string;
  body: string;
  reference: string;
  pinned: number;
  created_at: string;
  updated_at: string;
};

type NotebookRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

function toKind(value: string): NoteKind {
  return value === 'verse' || value === 'text' ? value : 'note';
}

/** Notebooks that have not been deleted, in alphabetical order. */
export function listNotebooks(db: SqlDatabase): Notebook[] {
  return db
    .all<NotebookRow>(
      `SELECT id, name, created_at, updated_at FROM notebooks
       WHERE deleted_at IS NULL ORDER BY lower(name), id`,
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
}

export function createNotebook(db: SqlDatabase, id: string, name: string, nowIso: string): void {
  db.run('INSERT INTO notebooks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', [
    id,
    name,
    nowIso,
    nowIso,
  ]);
}

export function renameNotebook(db: SqlDatabase, id: string, name: string, nowIso: string): void {
  db.run('UPDATE notebooks SET name = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [
    name,
    nowIso,
    id,
  ]);
}

/**
 * Deletes a notebook. Its notes are not deleted: they move out of the notebook and stay in the
 * list. The notebook's name is erased and only an empty marker row is kept.
 */
export function deleteNotebook(db: SqlDatabase, id: string, nowIso: string): void {
  db.transaction(() => {
    db.run(
      `UPDATE notes SET notebook_id = NULL, updated_at = ?
       WHERE notebook_id = ? AND deleted_at IS NULL`,
      [nowIso, id],
    );
    db.run(
      `UPDATE notebooks SET name = '', deleted_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [nowIso, nowIso, id],
    );
  });
}

/** Notes that have not been deleted: pinned first, then the most recently changed. */
export function listNotes(db: SqlDatabase): Note[] {
  return db
    .all<NoteRow>(
      `SELECT id, notebook_id, kind, title, body, reference, pinned, created_at, updated_at
       FROM notes WHERE deleted_at IS NULL
       ORDER BY pinned DESC, updated_at DESC, id`,
    )
    .map((row) => ({
      id: row.id,
      notebookId: row.notebook_id,
      kind: toKind(row.kind),
      title: row.title,
      body: row.body,
      reference: row.reference,
      pinned: row.pinned === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
}

export function createNote(db: SqlDatabase, id: string, input: NoteInput, nowIso: string): void {
  db.run(
    `INSERT INTO notes
       (id, notebook_id, kind, title, body, reference, pinned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.notebookId,
      input.kind,
      input.title,
      input.body,
      input.reference,
      input.pinned ? 1 : 0,
      nowIso,
      nowIso,
    ],
  );
}

export function updateNote(db: SqlDatabase, id: string, input: NoteInput, nowIso: string): void {
  db.run(
    `UPDATE notes
     SET notebook_id = ?, kind = ?, title = ?, body = ?, reference = ?, pinned = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [
      input.notebookId,
      input.kind,
      input.title,
      input.body,
      input.reference,
      input.pinned ? 1 : 0,
      nowIso,
      id,
    ],
  );
}

/**
 * Deletes a note's content for good (title, text and reference are erased) and keeps only an
 * empty marker row with the deletion time, so cloud sync can be added later.
 */
export function deleteNote(db: SqlDatabase, id: string, nowIso: string): void {
  db.run(
    `UPDATE notes
     SET title = '', body = '', reference = '', pinned = 0, notebook_id = NULL,
         deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [nowIso, nowIso, id],
  );
}
