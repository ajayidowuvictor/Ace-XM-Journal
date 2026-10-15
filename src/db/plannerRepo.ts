import { MAX_FOCUS, type FocusRow, type PlanBlock, type PlanBlockInput } from '../features/planner/types';
import type { SqlDatabase } from './types';

type FocusDbRow = { plan_date: string; task_id: string; position: number };

type BlockDbRow = {
  id: string;
  plan_date: string;
  title: string;
  task_id: string | null;
  start_minutes: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
};

const BLOCK_COLUMNS =
  'id, plan_date, title, task_id, start_minutes, duration_minutes, created_at, updated_at';

function toBlock(row: BlockDbRow): PlanBlock {
  return {
    id: row.id,
    planDate: row.plan_date,
    title: row.title,
    taskId: row.task_id,
    startMinutes: row.start_minutes,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every focus choice, ordered by day and then by the order the person picked them in. */
export function listFocus(db: SqlDatabase): FocusRow[] {
  return db
    .all<FocusDbRow>('SELECT plan_date, task_id, position FROM plan_focus ORDER BY plan_date, position')
    .map((row) => ({ planDate: row.plan_date, taskId: row.task_id, position: row.position }));
}

/** Replaces the focus tasks for one day (at most three, duplicates ignored). */
export function replaceFocus(
  db: SqlDatabase,
  planDate: string,
  taskIds: readonly string[],
  nowIso: string,
): void {
  const unique = [...new Set(taskIds)].slice(0, MAX_FOCUS);
  db.transaction(() => {
    db.run('DELETE FROM plan_focus WHERE plan_date = ?', [planDate]);
    unique.forEach((taskId, position) => {
      db.run(
        'INSERT INTO plan_focus (plan_date, task_id, position, created_at) VALUES (?, ?, ?, ?)',
        [planDate, taskId, position, nowIso],
      );
    });
  });
}

/** All blocks that have not been deleted, ordered by day and start time. */
export function listBlocks(db: SqlDatabase): PlanBlock[] {
  return db
    .all<BlockDbRow>(
      `SELECT ${BLOCK_COLUMNS} FROM plan_blocks WHERE deleted_at IS NULL
       ORDER BY plan_date, start_minutes, id`,
    )
    .map(toBlock);
}

export function createBlock(
  db: SqlDatabase,
  id: string,
  planDate: string,
  input: PlanBlockInput,
  nowIso: string,
): void {
  db.run(
    `INSERT INTO plan_blocks
       (id, plan_date, title, task_id, start_minutes, duration_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, planDate, input.title, input.taskId, input.startMinutes, input.durationMinutes, nowIso, nowIso],
  );
}

export function updateBlock(
  db: SqlDatabase,
  id: string,
  input: PlanBlockInput,
  nowIso: string,
): void {
  db.run(
    `UPDATE plan_blocks
        SET title = ?, task_id = ?, start_minutes = ?, duration_minutes = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    [input.title, input.taskId, input.startMinutes, input.durationMinutes, nowIso, id],
  );
}

/** Soft delete: the row is kept (hidden) so cloud sync can be added later without data loss. */
export function deleteBlock(db: SqlDatabase, id: string, nowIso: string): void {
  db.run(
    'UPDATE plan_blocks SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    [nowIso, nowIso, id],
  );
}
