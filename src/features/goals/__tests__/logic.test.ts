import { describe, expect, it } from '@jest/globals';

import {
  MAX_TITLE_LENGTH,
  goalProgress,
  milestoneCounts,
  sortGoals,
  targetChoiceFor,
  targetDateFor,
  validateGoalTitle,
  validateMilestoneTitle,
} from '../logic';
import type { Goal } from '../types';

function goal(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    title: id,
    notes: '',
    targetDate: null,
    completedAt: null,
    milestones: [],
    createdAt: `2026-10-0${id.length}T00:00:00.000Z`,
    ...overrides,
  };
}

const step = (done: boolean) => ({
  id: Math.random().toString(),
  goalId: 'g',
  title: 's',
  completedAt: done ? '2026-10-14T00:00:00.000Z' : null,
});

describe('validation', () => {
  it('rejects blank and very long titles', () => {
    expect(validateGoalTitle(' ')).not.toBeNull();
    expect(validateGoalTitle('a'.repeat(MAX_TITLE_LENGTH + 1))).not.toBeNull();
    expect(validateGoalTitle('Save money')).toBeNull();
    expect(validateMilestoneTitle('')).not.toBeNull();
    expect(validateMilestoneTitle('Open account')).toBeNull();
  });
});

describe('goalProgress', () => {
  it('is the share of steps done', () => {
    expect(
      goalProgress(goal('a', { milestones: [step(true), step(false), step(false), step(true)] })),
    ).toBe(0.5);
  });

  it('is 0 with no steps, and 1 once the goal is marked done', () => {
    expect(goalProgress(goal('a'))).toBe(0);
    expect(goalProgress(goal('a', { completedAt: '2026-10-14T00:00:00.000Z' }))).toBe(1);
  });

  it('counts steps', () => {
    expect(milestoneCounts(goal('a', { milestones: [step(true), step(false)] }))).toEqual({
      done: 1,
      total: 2,
    });
  });
});

describe('target dates', () => {
  const now = new Date(2026, 9, 14);

  it('turns each choice into a local date', () => {
    expect(targetDateFor('none', '2027-01-01', now)).toBeNull();
    expect(targetDateFor('month', null, now)).toBe('2026-11-13');
    expect(targetDateFor('quarter', null, now)).toBe('2027-01-12');
    expect(targetDateFor('keep', '2027-01-01', now)).toBe('2027-01-01');
  });

  it('keeps an existing date and shows none otherwise', () => {
    expect(targetChoiceFor('2027-01-01')).toBe('keep');
    expect(targetChoiceFor(null)).toBe('none');
  });
});

describe('sortGoals', () => {
  it('puts open goals first, nearest target first, undated last, finished at the end', () => {
    const sorted = sortGoals([
      goal('done', { completedAt: '2026-10-14T00:00:00.000Z', targetDate: '2026-01-01' }),
      goal('nodate'),
      goal('later', { targetDate: '2027-06-01' }),
      goal('soon', { targetDate: '2026-12-01' }),
    ]);
    expect(sorted.map((g) => g.id)).toEqual(['soon', 'later', 'nodate', 'done']);
  });
});
