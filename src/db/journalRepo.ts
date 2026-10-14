import { escapeLike } from '../features/journal/logic';
import type { EntryInput, JournalEntry, Mood } from '../features/journal/types';
import type { SqlDatabase } from './types';

type Row = {
  id: string;
  entry_date: string;
  title: string;
  body: string;
  mood: number | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = 'e.id, e.entry_date, e.title, e.body, e.mood, e.created_at, e.updated_at';

/** Entries that have not been deleted, newest first. A search matches title, text or tags. */
export function listEntries(db: SqlDatabase, search = ''): JournalEntry[] {
  const term = search.trim();
  const params: string[] = [];
  let filter = '';
  if (term) {
    const pattern = `%${escapeLike(term.toLowerCase())}%`;
    filter = `AND (lower(e.title) LIKE ? ESCAPE '\\'
                OR lower(e.body) LIKE ? ESCAPE '\\'
                OR EXISTS (SELECT 1 FROM entry_tags t WHERE t.entry_id = e.id AND t.tag LIKE ? ESCAPE '\\'))`;
    params.push(pattern, pattern, pattern);
  }

  const rows = db.all<Row>(
    `SELECT ${COLUMNS} FROM journal_entries e
     WHERE e.deleted_at IS NULL ${filter}
     ORDER BY e.entry_date DESC, e.created_at DESC, e.id`,
    params,
  );

  const tagRows = db.all<{ entry_id: string; tag: string }>(
    `SELECT t.entry_id, t.tag FROM entry_tags t
     JOIN journal_entries e ON e.id = t.entry_id
     WHERE e.deleted_at IS NULL ORDER BY t.tag`,
  );
  const tagsByEntry = new Map<string, string[]>();
  for (const { entry_id, tag } of tagRows) {
    tagsByEntry.set(entry_id, [...(tagsByEntry.get(entry_id) ?? []), tag]);
  }

  return rows.map((row) => ({
    id: row.id,
    entryDate: row.entry_date,
    title: row.title,
    body: row.body,
    mood: row.mood as Mood | null,
    tags: tagsByEntry.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function replaceTags(db: SqlDatabase, id: string, tags: readonly string[]): void {
  db.run('DELETE FROM entry_tags WHERE entry_id = ?', [id]);
  for (const tag of tags) {
    db.run('INSERT INTO entry_tags (entry_id, tag) VALUES (?, ?)', [id, tag]);
  }
}

export function createEntry(
  db: SqlDatabase,
  id: string,
  entryDate: string,
  input: EntryInput,
  nowIso: string,
): void {
  db.transaction(() => {
    db.run(
      `INSERT INTO journal_entries (id, entry_date, title, body, mood, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, entryDate, input.title, input.body, input.mood, nowIso, nowIso],
    );
    replaceTags(db, id, input.tags);
  });
}

export function updateEntry(db: SqlDatabase, id: string, input: EntryInput, nowIso: string): void {
  db.transaction(() => {
    db.run(
      `UPDATE journal_entries SET title = ?, body = ?, mood = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [input.title, input.body, input.mood, nowIso, id],
    );
    replaceTags(db, id, input.tags);
  });
}

/**
 * Deletes an entry's content for good (title, text, mood and tags are erased) and keeps only an
 * empty marker row with the deletion time, so cloud sync can be added later.
 */
export function deleteEntry(db: SqlDatabase, id: string, nowIso: string): void {
  db.transaction(() => {
    db.run(
      `UPDATE journal_entries
       SET title = '', body = '', mood = NULL, deleted_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [nowIso, nowIso, id],
    );
    db.run('DELETE FROM entry_tags WHERE entry_id = ?', [id]);
  });
}
