import type { Priority, Task, TaskInput } from '../features/tasks/types';
import type { SqlDatabase } from './types';

type Row = {
  id: string;
  title: string;
  notes: string;
  due_date: string | null;
  priority: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = 'id, title, notes, due_date, priority, completed_at, created_at, updated_at';

function toTask(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    dueDate: row.due_date,
    priority: row.priority as Priority,
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
    `INSERT INTO tasks (id, title, notes, due_date, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.notes, input.dueDate, input.priority, nowIso, nowIso],
  );
}

export function updateTask(db: SqlDatabase, id: string, input: TaskInput, nowIso: string): void {
  db.run(
    `UPDATE tasks SET title = ?, notes = ?, due_date = ?, priority = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [input.title, input.notes, input.dueDate, input.priority, nowIso, id],
  );
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
