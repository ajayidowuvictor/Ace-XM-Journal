import { nextOccurrence, toReminderTime, toRepeatRule } from '../features/tasks/repeat';
import type { Priority, Task, TaskInput } from '../features/tasks/types';
import type { SqlDatabase } from './types';

type Row = {
  id: string;
  title: string;
  notes: string;
  due_date: string | null;
  priority: number;
  repeat: string;
  reminder_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, title, notes, due_date, priority, repeat, reminder_time, completed_at, created_at, updated_at';

function toTask(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    dueDate: row.due_date,
    priority: row.priority as Priority,
    repeat: toRepeatRule(row.repeat),
    reminderTime: toReminderTime(row.reminder_time),
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** All tasks that have not been deleted, oldest first. */
export function listTasks(db: SqlDatabase): Task[] {
  return db
    .all<Row>(`SELECT ${COLUMNS} FROM tasks WHERE deleted_at IS NULL ORDER BY created_at, id`)
    .map(toTask);
}

export function createTask(db: SqlDatabase, id: string, input: TaskInput, nowIso: string): void {
  db.run(
    `INSERT INTO tasks (id, title, notes, due_date, priority, repeat, reminder_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.notes,
      input.dueDate,
      input.priority,
      input.repeat ?? 'none',
      input.reminderTime ?? null,
      nowIso,
      nowIso,
    ],
  );
}

/** Saves the edited fields. A repeat rule or reminder time that is left out stays as it was. */
export function updateTask(db: SqlDatabase, id: string, input: TaskInput, nowIso: string): void {
  db.run(
    `UPDATE tasks SET title = ?, notes = ?, due_date = ?, priority = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [input.title, input.notes, input.dueDate, input.priority, nowIso, id],
  );
  if (input.repeat !== undefined) {
    db.run('UPDATE tasks SET repeat = ? WHERE id = ? AND deleted_at IS NULL', [input.repeat, id]);
  }
  if (input.reminderTime !== undefined) {
    db.run('UPDATE tasks SET reminder_time = ? WHERE id = ? AND deleted_at IS NULL', [
      input.reminderTime,
      id,
    ]);
  }
}

export function setTaskCompleted(
  db: SqlDatabase,
  id: string,
  completed: boolean,
  nowIso: string,
): void {
  db.run(`UPDATE tasks SET completed_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, [
    completed ? nowIso : null,
    nowIso,
    id,
  ]);
}

/** Soft delete: the row is kept (hidden) so cloud sync can be added later without data loss. */
export function deleteTask(db: SqlDatabase, id: string, nowIso: string): void {
  db.run(`UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`, [
    nowIso,
    nowIso,
    id,
  ]);
}

/**
 * Marks a task done and, if it repeats, adds its next copy. The next copy is added only when the
 * task was open, so a second tap on a finished task never makes a duplicate. All or nothing.
 * Returns the id of the new copy, or null when none was added.
 */
export function completeTask(
  db: SqlDatabase,
  id: string,
  today: string,
  nowIso: string,
  nextId: string,
): string | null {
  let created: string | null = null;
  db.transaction(() => {
    const before = listTasks(db).find((task) => task.id === id);
    setTaskCompleted(db, id, true, nowIso);
    if (before && !before.completedAt) {
      const next = nextOccurrence(before, today);
      if (next) {
        createTask(db, nextId, next, nowIso);
        created = nextId;
      }
    }
  });
  return created;
}
