import { describe, expect, it } from '@jest/globals';

import {
  choiceFor,
  cleanInput,
  dueDateFor,
  groupTasks,
  MAX_TITLE_LENGTH,
  todaysPriorities,
  validateTitle,
} from '../logic';
import type { Task } from '../types';

const TODAY = '2026-10-14';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    notes: '',
    dueDate: null,
    priority: 0,
    repeat: 'none',
    reminderTime: null,
    category: 'none',
    completedAt: null,
    createdAt: `2026-10-01T00:00:0${id.length}.000Z`,
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('validateTitle', () => {
  it('rejects empty and blank titles', () => {
    expect(validateTitle('')).not.toBeNull();
    expect(validateTitle('    ')).not.toBeNull();
  });

  it('accepts a normal title', () => {
    expect(validateTitle('  Pay rent ')).toBeNull();
  });

  it('rejects a very long title', () => {
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1))).not.toBeNull();
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH))).toBeNull();
  });
});

describe('cleanInput', () => {
  it('trims the title and notes', () => {
    expect(cleanInput({ title: '  Hi ', notes: ' there  ', dueDate: null, priority: 0 })).toEqual({
      title: 'Hi',
      notes: 'there',
      dueDate: null,
      priority: 0,
    });
  });
});

describe('groupTasks', () => {
  it('puts each task in the right section', () => {
    const groups = groupTasks(
      [
        task('late', { dueDate: '2026-10-13' }),
        task('now', { dueDate: TODAY }),
        task('soon', { dueDate: '2026-10-20' }),
        task('open'),
        task('done', { dueDate: TODAY, completedAt: '2026-10-14T08:00:00.000Z' }),
      ],
      TODAY,
    );

    expect(groups.overdue.map((t) => t.id)).toEqual(['late']);
    expect(groups.today.map((t) => t.id)).toEqual(['now']);
    expect(groups.upcoming.map((t) => t.id)).toEqual(['soon']);
    expect(groups.noDate.map((t) => t.id)).toEqual(['open']);
    expect(groups.done.map((t) => t.id)).toEqual(['done']);
  });

  it('shows higher priority first, then the earlier due date', () => {
    const groups = groupTasks(
      [
        task('low', { dueDate: TODAY, priority: 1 }),
        task('high', { dueDate: TODAY, priority: 3 }),
        task('b', { dueDate: '2026-10-22' }),
        task('a', { dueDate: '2026-10-18' }),
      ],
      TODAY,
    );

    expect(groups.today.map((t) => t.id)).toEqual(['high', 'low']);
    expect(groups.upcoming.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('lists the most recently completed task first', () => {
    const groups = groupTasks(
      [
        task('first', { completedAt: '2026-10-14T08:00:00.000Z' }),
        task('second', { completedAt: '2026-10-14T09:00:00.000Z' }),
      ],
      TODAY,
    );

    expect(groups.done.map((t) => t.id)).toEqual(['second', 'first']);
  });
});

describe('todaysPriorities', () => {
  it('returns overdue then today tasks and leaves out finished and future ones', () => {
    const result = todaysPriorities(
      [
        task('future', { dueDate: '2026-10-15' }),
        task('now', { dueDate: TODAY }),
        task('late', { dueDate: '2026-10-10' }),
        task('done', { dueDate: TODAY, completedAt: '2026-10-14T08:00:00.000Z' }),
        task('undated'),
      ],
      TODAY,
    );

    expect(result.map((t) => t.id)).toEqual(['late', 'now']);
  });
});

describe('due date choices', () => {
  const now = new Date(2026, 9, 14, 15, 0);

  it('turns each choice into a local date', () => {
    expect(dueDateFor('none', '2026-10-20', now)).toBeNull();
    expect(dueDateFor('today', null, now)).toBe('2026-10-14');
    expect(dueDateFor('tomorrow', null, now)).toBe('2026-10-15');
    expect(dueDateFor('week', null, now)).toBe('2026-10-21');
    expect(dueDateFor('keep', '2026-10-20', now)).toBe('2026-10-20');
  });

  it('picks the matching choice for a stored date, or keeps an unusual one', () => {
    expect(choiceFor(null, now)).toBe('none');
    expect(choiceFor('2026-10-14', now)).toBe('today');
    expect(choiceFor('2026-10-15', now)).toBe('tomorrow');
    expect(choiceFor('2026-10-21', now)).toBe('week');
    expect(choiceFor('2026-10-18', now)).toBe('keep');
  });
});
