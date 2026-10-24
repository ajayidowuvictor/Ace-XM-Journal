import { addDays } from '../../lib/dates';
import type { Task } from '../tasks/types';
import type { Goal } from './types';

export const MAX_TITLE_LENGTH = 120;

export function validateGoalTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return 'Enter a goal.';
  if (trimmed.length > MAX_TITLE_LENGTH) return `Keep the goal under ${MAX_TITLE_LENGTH} letters.`;
  return null;
}

export function validateMilestoneTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return 'Enter a step.';
  if (trimmed.length > MAX_TITLE_LENGTH) return `Keep the step under ${MAX_TITLE_LENGTH} letters.`;
  return null;
}

type LinkedTask = Pick<Task, 'completedAt'>;

/** The tasks that count towards a goal, oldest first as given. */
export function tasksForGoal<T extends Pick<Task, 'goalId'>>(tasks: readonly T[], goalId: string): T[] {
  return tasks.filter((task) => task.goalId === goalId);
}

/**
 * Progress from 0 to 1: the share of steps and linked tasks that are done together, or 0 for a
 * goal with neither. A goal marked as achieved is always 1.
 */
export function goalProgress(
  goal: Pick<Goal, 'milestones' | 'completedAt'>,
  linked: readonly LinkedTask[] = [],
): number {
  if (goal.completedAt) return 1;
  const total = goal.milestones.length + linked.length;
  if (total === 0) return 0;
  const done =
    goal.milestones.filter((m) => m.completedAt).length +
    linked.filter((task) => task.completedAt).length;
  return done / total;
}

export function milestoneCounts(goal: Pick<Goal, 'milestones'>) {
  return {
    done: goal.milestones.filter((m) => m.completedAt).length,
    total: goal.milestones.length,
  };
}

export function taskCounts(linked: readonly LinkedTask[]) {
  return { done: linked.filter((task) => task.completedAt).length, total: linked.length };
}

/** Open tasks not yet linked to any goal, newest first: the ones that can be added to a goal. */
export function linkableTasks(tasks: readonly Task[]): Task[] {
  return tasks
    .filter((task) => task.goalId === null && task.completedAt === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type TargetChoice = 'none' | 'month' | 'quarter' | 'half' | 'keep' | 'custom';

export function targetDateFor(
  choice: TargetChoice,
  existing: string | null,
  now: Date,
  custom: string | null = null,
): string | null {
  switch (choice) {
    case 'none':
      return null;
    case 'month':
      return addDays(now, 30);
    case 'quarter':
      return addDays(now, 90);
    case 'half':
      return addDays(now, 180);
    case 'keep':
      return existing;
    case 'custom':
      return custom;
  }
}

/** A stored date can only be re-picked as `keep`: the form offers relative choices. */
export function targetChoiceFor(existing: string | null): TargetChoice {
  return existing ? 'keep' : 'none';
}

/** Open goals first (nearest target date first, undated last), finished goals after. */
export function sortGoals(goals: readonly Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const aDone = a.completedAt ? 1 : 0;
    const bDone = b.completedAt ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (a.targetDate && b.targetDate && a.targetDate !== b.targetDate) {
      return a.targetDate.localeCompare(b.targetDate);
    }
    if (a.targetDate && !b.targetDate) return -1;
    if (!a.targetDate && b.targetDate) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
