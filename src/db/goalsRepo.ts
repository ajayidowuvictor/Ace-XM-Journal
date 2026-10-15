import type { Goal, GoalInput, Milestone } from '../features/goals/types';
import type { SqlDatabase } from './types';

type GoalRow = {
  id: string;
  title: string;
  notes: string;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
};
type MilestoneRow = { id: string; goal_id: string; title: string; completed_at: string | null };

/** Goals that have not been deleted, oldest first, each with its steps (oldest first). */
export function listGoals(db: SqlDatabase): Goal[] {
  const goals = db.all<GoalRow>(
    `SELECT id, title, notes, target_date, completed_at, created_at FROM goals
     WHERE deleted_at IS NULL ORDER BY created_at, id`,
  );
  const steps = db.all<MilestoneRow>(
    `SELECT m.id, m.goal_id, m.title, m.completed_at FROM milestones m
     JOIN goals g ON g.id = m.goal_id
     WHERE m.deleted_at IS NULL AND g.deleted_at IS NULL ORDER BY m.created_at, m.id`,
  );
  const byGoal = new Map<string, Milestone[]>();
  for (const step of steps) {
    byGoal.set(step.goal_id, [
      ...(byGoal.get(step.goal_id) ?? []),
      { id: step.id, goalId: step.goal_id, title: step.title, completedAt: step.completed_at },
    ]);
  }
  return goals.map((row) => ({
    id: row.id,
    title: row.title,
    notes: row.notes,
    targetDate: row.target_date,
    completedAt: row.completed_at,
    milestones: byGoal.get(row.id) ?? [],
    createdAt: row.created_at,
  }));
}

export function createGoal(db: SqlDatabase, id: string, input: GoalInput, nowIso: string): void {
  db.run(
    `INSERT INTO goals (id, title, notes, target_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.notes, input.targetDate, nowIso, nowIso],
  );
}

export function updateGoal(db: SqlDatabase, id: string, input: GoalInput, nowIso: string): void {
  db.run(
    `UPDATE goals SET title = ?, notes = ?, target_date = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [input.title, input.notes, input.targetDate, nowIso, id],
  );
}

export function setGoalDone(db: SqlDatabase, id: string, done: boolean, nowIso: string): void {
  db.run('UPDATE goals SET completed_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL', [
    done ? nowIso : null,
    nowIso,
    id,
  ]);
}

/** Removes a goal and its steps (their content is erased; empty markers keep the deletion time). */
export function deleteGoal(db: SqlDatabase, id: string, nowIso: string): void {
  db.transaction(() => {
    db.run(
      `UPDATE goals SET title = '', notes = '', deleted_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [nowIso, nowIso, id],
    );
    db.run(
      `UPDATE milestones SET title = '', deleted_at = ?, updated_at = ?
       WHERE goal_id = ? AND deleted_at IS NULL`,
      [nowIso, nowIso, id],
    );
  });
}

export function addMilestone(
  db: SqlDatabase,
  id: string,
  goalId: string,
  title: string,
  nowIso: string,
): void {
  db.run(
    `INSERT INTO milestones (id, goal_id, title, created_at, updated_at)
     SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM goals WHERE id = ? AND deleted_at IS NULL)`,
    [id, goalId, title, nowIso, nowIso, goalId],
  );
}

export function setMilestoneDone(db: SqlDatabase, id: string, done: boolean, nowIso: string): void {
  db.run(
    'UPDATE milestones SET completed_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    [done ? nowIso : null, nowIso, id],
  );
}

export function deleteMilestone(db: SqlDatabase, id: string, nowIso: string): void {
  db.run(
    `UPDATE milestones SET title = '', deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [nowIso, nowIso, id],
  );
}
