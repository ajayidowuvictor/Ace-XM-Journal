import type { Habit } from '../features/habits/types';
import type { SqlDatabase } from './types';

type HabitRow = { id: string; name: string; created_at: string };

/** Habits that have not been deleted, oldest first, each with the dates it was done. */
export function listHabits(db: SqlDatabase): Habit[] {
  const rows = db.all<HabitRow>(
    'SELECT id, name, created_at FROM habits WHERE deleted_at IS NULL ORDER BY created_at, id',
  );
  const completions = db.all<{ habit_id: string; completed_date: string }>(
    `SELECT c.habit_id, c.completed_date FROM habit_completions c
     JOIN habits h ON h.id = c.habit_id
     WHERE h.deleted_at IS NULL ORDER BY c.completed_date`,
  );

  const byHabit = new Map<string, string[]>();
  for (const { habit_id, completed_date } of completions) {
    byHabit.set(habit_id, [...(byHabit.get(habit_id) ?? []), completed_date]);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    completedDates: byHabit.get(row.id) ?? [],
    createdAt: row.created_at,
  }));
}

export function createHabit(db: SqlDatabase, id: string, name: string, nowIso: string): void {
  db.run('INSERT INTO habits (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', [
    id,
    name,
    nowIso,
    nowIso,
  ]);
}

export function renameHabit(db: SqlDatabase, id: string, name: string, nowIso: string): void {
  db.run('UPDATE habits SET name = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [
    name,
    nowIso,
    id,
  ]);
}

/** Marks a habit done (or not done) for a local date. Safe to repeat. */
export function setHabitDone(
  db: SqlDatabase,
  id: string,
  date: string,
  done: boolean,
  nowIso: string,
): void {
  if (done) {
    db.run(
      `INSERT OR IGNORE INTO habit_completions (habit_id, completed_date, created_at)
       SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM habits WHERE id = ? AND deleted_at IS NULL)`,
      [id, date, nowIso, id],
    );
  } else {
    db.run('DELETE FROM habit_completions WHERE habit_id = ? AND completed_date = ?', [id, date]);
  }
}

/** Removes a habit and its history. Keeps an empty marker row with the deletion time. */
export function deleteHabit(db: SqlDatabase, id: string, nowIso: string): void {
  db.transaction(() => {
    db.run('UPDATE habits SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [
      nowIso,
      nowIso,
      id,
    ]);
    db.run('DELETE FROM habit_completions WHERE habit_id = ?', [id]);
  });
}
