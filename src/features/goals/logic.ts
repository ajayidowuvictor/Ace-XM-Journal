import { addDays } from '../../lib/dates';
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

/** Progress from 0 to 1: the share of steps done, or 0/1 for a goal with no steps. */
export function goalProgress(goal: Pick<Goal, 'milestones' | 'completedAt'>): number {
  if (goal.completedAt) return 1;
  const total = goal.milestones.length;
  if (total === 0) return 0;
  return goal.milestones.filter((m) => m.completedAt).length / total;
}

export function milestoneCounts(goal: Pick<Goal, 'milestones'>) {
  return {
    done: goal.milestones.filter((m) => m.completedAt).length,
    total: goal.milestones.length,
  };
}

export type TargetChoice = 'none' | 'month' | 'quarter' | 'half' | 'keep';

export function targetDateFor(
  choice: TargetChoice,
  existing: string | null,
  now: Date,
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
