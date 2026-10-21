import { describe, expect, it } from '@jest/globals';

import type { Habit } from '../../habits/types';
import type { JournalEntry } from '../../journal/types';
import type { Task } from '../../tasks/types';
import {
  habitRates,
  moodWords,
  scaleMax,
  weeklyTrends,
  writingDays,
  writingStreak,
} from '../logic';

const TODAY = '2026-10-16';

function entry(date: string, mood: JournalEntry['mood'] = null): JournalEntry {
  return {
    id: date,
    entryDate: date,
    title: '',
    body: 'x',
    mood,
    tags: [],
    createdAt: 'x',
    updatedAt: 'x',
  };
}

function doneTask(id: string, completedAt: string): Task {
  return {
    id,
    title: id,
    notes: '',
    dueDate: null,
    priority: 0,
    repeat: 'none',
    reminderTime: null,
    category: 'none',
    completedAt,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('weeklyTrends', () => {
  it('gives eight weeks, oldest first, the newest ending today', () => {
    const trends = weeklyTrends({ tasks: [], habits: [], goals: [], entries: [] }, TODAY);
    expect(trends).toHaveLength(8);
    expect(trends[7].end).toBe(TODAY);
    expect(trends[7].start).toBe('2026-10-10');
    expect(trends[6].end).toBe('2026-10-09');
    expect(trends[0].end).toBe('2026-08-28');
  });

  it('counts each week on its own', () => {
    const noon = (date: string) => new Date(`${date}T12:00:00`).toISOString();
    const trends = weeklyTrends(
      {
        tasks: [
          doneTask('a', noon('2026-10-15')),
          doneTask('b', noon('2026-10-12')),
          doneTask('c', noon('2026-10-05')),
        ],
        habits: [],
        goals: [],
        entries: [entry('2026-10-14', 4), entry('2026-10-15', 5), entry('2026-10-05', 2)],
      },
      TODAY,
      2,
    );
    expect(trends).toHaveLength(2);
    expect(trends[0]).toMatchObject({ tasksCompleted: 1, entries: 1, averageMood: 2 });
    expect(trends[1]).toMatchObject({ tasksCompleted: 2, entries: 2, averageMood: 4.5 });
  });
});

describe('habitRates', () => {
  const habits: Habit[] = [
    {
      id: 'a',
      name: 'Walk',
      completedDates: ['2026-10-16', '2026-10-15', '2026-10-01'],
      days: [0, 1, 2, 3, 4, 5, 6],
      createdAt: 'x',
    },
    {
      id: 'b',
      name: 'Read',
      completedDates: Array.from(
        { length: 10 },
        (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`,
      ),
      days: [0, 1, 2, 3, 4, 5, 6],
      createdAt: 'x',
    },
    { id: 'c', name: 'Pray', completedDates: [], days: [0, 1, 2, 3, 4, 5, 6], createdAt: 'x' },
  ];

  it('works out days done, rate and streak, best first', () => {
    const rates = habitRates(habits, TODAY, 30);
    expect(rates.map((r) => r.id)).toEqual(['b', 'a', 'c']);
    expect(rates[0]).toMatchObject({ done: 10, days: 30, streak: 0 });
    expect(rates[0].rate).toBeCloseTo(10 / 30);
    expect(rates[1]).toMatchObject({ done: 3, streak: 2 });
    expect(rates[2]).toMatchObject({ done: 0, rate: 0, streak: 0 });
  });

  it('gives an empty list when there are no habits', () => {
    expect(habitRates([], TODAY)).toEqual([]);
  });
});

describe('writing', () => {
  const entries = [
    entry('2026-10-16'),
    entry('2026-10-16'),
    entry('2026-10-15'),
    entry('2026-10-13'),
    entry('2026-08-01'),
  ];

  it('counts days with an entry in the window, not entries', () => {
    expect(writingDays(entries, TODAY, 30)).toBe(3);
    expect(writingDays(entries, TODAY, 2)).toBe(2);
    expect(writingDays([], TODAY)).toBe(0);
  });

  it('counts the streak back from today, or from yesterday if today is still empty', () => {
    expect(writingStreak(entries, TODAY)).toBe(2);
    expect(writingStreak([entry('2026-10-15'), entry('2026-10-14')], TODAY)).toBe(2);
    expect(writingStreak([entry('2026-10-13')], TODAY)).toBe(0);
  });
});

describe('small helpers', () => {
  it('sizes bars from a largest value of at least 1', () => {
    expect(scaleMax([])).toBe(1);
    expect(scaleMax([0, 0])).toBe(1);
    expect(scaleMax([2, 7, 3])).toBe(7);
  });

  it('puts an average mood into words', () => {
    expect(moodWords(null)).toBe('-');
    expect(moodWords(4.4)).toContain('Good');
    expect(moodWords(4.5)).toContain('Great');
    expect(moodWords(0.2)).toContain('Very low');
    expect(moodWords(9)).toContain('Great');
  });
});
