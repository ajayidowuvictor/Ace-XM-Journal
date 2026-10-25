import { describe, expect, it } from '@jest/globals';

import {
  MAX_TITLE_LENGTH,
  goalProgress,
  linkableTasks,
  milestoneCounts,
  sortGoals,
  targetChoiceFor,
  targetDateFor,
  taskCounts,
  tasksForGoal,
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
    expect(targetDateFor('custom', '2027-01-01', now, '2027-06-30')).toBe('2027-06-30');
    expect(targetDateFor('custom', null, now)).toBeNull();
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

describe('tasks linked to a goal', () => {
  const step = (id: string, done: boolean) => ({
    id,
    goalId: 'g',
    title: id,
    completedAt: done ? '2026-10-14T00:00:00.000Z' : null,
  });
  const linked = (done: boolean) => ({ completedAt: done ? '2026-10-14T00:00:00.000Z' : null });

  it('counts steps and linked tasks together', () => {
    const g = goal('g', { milestones: [step('a', true), step('b', false)] });
    expect(goalProgress(g)).toBe(0.5);
    // 1 step done + 1 of 2 tasks done = 2 of 4.
    expect(goalProgress(g, [linked(true), linked(false)])).toBe(0.5);
    // 1 step done + 2 of 2 tasks done = 3 of 4.
    expect(goalProgress(g, [linked(true), linked(true)])).toBe(0.75);
  });

  it('moves with tasks alone when a goal has no steps', () => {
    const g = goal('g');
    expect(goalProgress(g)).toBe(0);
    expect(goalProgress(g, [linked(true), linked(false), linked(false), linked(false)])).toBe(0.25);
  });

  it('is full for a goal marked as achieved, whatever its tasks', () => {
    const g = goal('g', { completedAt: '2026-10-14T00:00:00.000Z' });
    expect(goalProgress(g, [linked(false)])).toBe(1);
  });

  it('picks out the tasks for one goal and counts them', () => {
    const tasks = [
      { id: '1', goalId: 'g', completedAt: '2026-10-14T00:00:00.000Z' },
      { id: '2', goalId: 'g', completedAt: null },
      { id: '3', goalId: 'other', completedAt: null },
      { id: '4', goalId: null, completedAt: null },
    ];
    const mine = tasksForGoal(tasks, 'g');
    expect(mine.map((x) => x.id)).toEqual(['1', '2']);
    expect(taskCounts(mine)).toEqual({ done: 1, total: 2 });
    expect(taskCounts([])).toEqual({ done: 0, total: 0 });
  });

  it('offers only open tasks that have no goal yet, newest first', () => {
    const base = {
      notes: '',
      dueDate: null,
      priority: 0 as const,
      repeat: 'none' as const,
      reminderTime: null,
      category: 'none' as const,
      updatedAt: 'x',
    };
    const make = (id: string, createdAt: string, goalId: string | null, done: boolean) => ({
      ...base,
      id,
      title: id,
      goalId,
      createdAt,
      completedAt: done ? 'x' : null,
    });
    const offered = linkableTasks([
      make('old', '2026-10-01', null, false),
      make('new', '2026-10-09', null, false),
      make('done', '2026-10-05', null, true),
      make('taken', '2026-10-06', 'g', false),
    ]);
    expect(offered.map((x) => x.id)).toEqual(['new', 'old']);
  });
});
