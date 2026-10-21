import { describe, expect, it } from '@jest/globals';

import type { Goal } from '../../goals/types';
import type { Habit } from '../../habits/types';
import type { JournalEntry } from '../../journal/types';
import type { Task } from '../../tasks/types';
import {
  findExistingReview,
  reflectionFrom,
  reviewEntryBody,
  summaryLines,
  weeklySummary,
} from '../logic';

const TODAY = '2026-10-14';
// Noon local time, so the local date is the same in any time zone.
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();

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
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

const habit = (dates: string[]): Habit => ({
  id: 'h',
  name: 'h',
  completedDates: dates,
  days: [0, 1, 2, 3, 4, 5, 6],
  createdAt: '2026-10-01T00:00:00.000Z',
});

const entry = (date: string, mood: JournalEntry['mood']): JournalEntry => ({
  id: date,
  entryDate: date,
  title: '',
  body: '',
  mood,
  tags: [],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const goal = (completedAt: string | null): Goal => ({
  id: 'g',
  title: 'g',
  notes: '',
  targetDate: null,
  completedAt,
  milestones: [],
  createdAt: '2026-10-01T00:00:00.000Z',
});

describe('weeklySummary', () => {
  const summary = weeklySummary(
    {
      tasks: [
        task('in', { completedAt: at(2026, 10, 10) }),
        task('today', { completedAt: at(2026, 10, 14) }),
        task('old', { completedAt: at(2026, 10, 7) }),
        task('late', { dueDate: '2026-10-01' }),
        task('future', { dueDate: '2026-10-30' }),
      ],
      habits: [habit(['2026-10-14', '2026-10-09', '2026-10-08']), habit(['2026-10-13'])],
      entries: [
        entry('2026-10-14', 4),
        entry('2026-10-10', 2),
        entry('2026-10-12', null),
        entry('2026-10-01', 5),
      ],
      goals: [goal(at(2026, 10, 12)), goal(at(2026, 9, 1)), goal(null)],
    },
    TODAY,
  );

  it('covers the 7 days ending today', () => {
    expect(summary.start).toBe('2026-10-08');
    expect(summary.end).toBe(TODAY);
  });

  it('counts tasks completed inside the window and tasks overdue now', () => {
    expect(summary.tasksCompleted).toBe(2);
    expect(summary.tasksOverdue).toBe(1);
  });

  it('counts habit check-ins against what was possible', () => {
    expect(summary.habitCheckIns).toBe(4);
    expect(summary.habitCheckInsPossible).toBe(14);
  });

  it('counts entries, averages only the moods that were set, and counts goals achieved', () => {
    expect(summary.entries).toBe(3);
    expect(summary.averageMood).toBe(3);
    expect(summary.goalsAchieved).toBe(1);
  });

  it('has no average mood when no entry has one', () => {
    const none = weeklySummary(
      { tasks: [], habits: [], entries: [entry(TODAY, null)], goals: [] },
      TODAY,
    );
    expect(none.averageMood).toBeNull();
  });
});

describe('summaryLines and reviewEntryBody', () => {
  const empty = weeklySummary({ tasks: [], habits: [], entries: [], goals: [] }, TODAY);

  it('describes an empty week without odd wording', () => {
    const lines = summaryLines(empty);
    expect(lines).toContain('Habit check-ins: no habits yet');
    expect(lines).toContain('Journal: 0 entries');
    expect(lines.some((line) => line.startsWith('Average mood'))).toBe(false);
  });

  it('uses singular for one entry', () => {
    const one = weeklySummary(
      { tasks: [], habits: [], entries: [entry(TODAY, 3)], goals: [] },
      TODAY,
    );
    expect(summaryLines(one)).toContain('Journal: 1 entry');
    expect(summaryLines(one)).toContain('Average mood: 3.0 out of 5');
  });

  it('puts the reflection under the summary', () => {
    const body = reviewEntryBody(empty, '  Good week.  ');
    expect(body.endsWith('Reflection:\nGood week.')).toBe(true);
    expect(reviewEntryBody(empty, '')).toContain('(nothing written)');
  });
});

describe('findExistingReview', () => {
  const entry = (id: string, title: string, tags: string[]): JournalEntry => ({
    id,
    entryDate: TODAY,
    title,
    body: '',
    mood: null,
    tags,
    createdAt: 'x',
    updatedAt: 'x',
  });

  it('finds the review saved for the same week', () => {
    const entries = [
      entry('a', 'Weekly review: Oct 8 to Oct 14', ['weekly review']),
      entry('b', 'Weekly review: Oct 1 to Oct 7', ['weekly review']),
    ];
    expect(findExistingReview(entries, 'Weekly review: Oct 8 to Oct 14')?.id).toBe('a');
  });

  it('ignores other entries with the same title but no review tag', () => {
    const entries = [entry('a', 'Weekly review: Oct 8 to Oct 14', ['work'])];
    expect(findExistingReview(entries, 'Weekly review: Oct 8 to Oct 14')).toBeNull();
  });

  it('returns null when nothing matches', () => {
    expect(findExistingReview([], 'Weekly review: Oct 8 to Oct 14')).toBeNull();
  });
});

describe('reflectionFrom', () => {
  const summary = weeklySummary({ tasks: [], habits: [], goals: [], entries: [] }, TODAY);

  it('gets back what was written', () => {
    const body = reviewEntryBody(summary, 'Good week.\nMore rest next week.');
    expect(reflectionFrom(body)).toBe('Good week.\nMore rest next week.');
  });

  it('is empty when nothing was written', () => {
    expect(reflectionFrom(reviewEntryBody(summary, '   '))).toBe('');
  });

  it('is empty for text without a reflection', () => {
    expect(reflectionFrom('Something else')).toBe('');
  });
});
