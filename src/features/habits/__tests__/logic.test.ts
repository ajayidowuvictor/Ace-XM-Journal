import { describe, expect, it } from '@jest/globals';

import {
  MAX_NAME_LENGTH,
  currentStreak,
  doneInLastDays,
  longestStreak,
  todaySummary,
  validateHabitName,
} from '../logic';

const TODAY = '2026-10-14';

describe('validateHabitName', () => {
  it('rejects blank and very long names', () => {
    expect(validateHabitName('  ')).not.toBeNull();
    expect(validateHabitName('a'.repeat(MAX_NAME_LENGTH + 1))).not.toBeNull();
    expect(validateHabitName('Read 10 pages')).toBeNull();
  });
});

describe('currentStreak', () => {
  it('is 0 with no history', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-10-12', '2026-10-13', '2026-10-14'], TODAY)).toBe(3);
  });

  it('stays alive when today is not done yet but yesterday was', () => {
    expect(currentStreak(['2026-10-12', '2026-10-13'], TODAY)).toBe(2);
  });

  it('resets after a missed full day', () => {
    expect(currentStreak(['2026-10-10', '2026-10-11'], TODAY)).toBe(0);
  });

  it('stops at a gap', () => {
    expect(currentStreak(['2026-10-10', '2026-10-13', '2026-10-14'], TODAY)).toBe(2);
  });

  it('counts across month and year boundaries', () => {
    expect(currentStreak(['2026-12-31', '2027-01-01', '2027-01-02'], '2027-01-02')).toBe(3);
  });
});

describe('longestStreak', () => {
  it('finds the longest run, ignoring order and repeats', () => {
    expect(
      longestStreak(['2026-10-05', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-02']),
    ).toBe(3);
  });

  it('is 0 with no history and 1 for a single day', () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(['2026-10-14'])).toBe(1);
  });
});

describe('doneInLastDays', () => {
  it('counts only days inside the window, including today', () => {
    const dates = ['2026-10-14', '2026-10-12', '2026-10-08', '2026-10-07'];
    expect(doneInLastDays(dates, TODAY, 6)).toBe(2);
    expect(doneInLastDays(dates, TODAY, 7)).toBe(3);
    expect(doneInLastDays(dates, TODAY, 8)).toBe(4);
  });
});

describe('todaySummary', () => {
  it('reports how many habits are done today', () => {
    const habits = [
      { completedDates: [TODAY] },
      { completedDates: ['2026-10-13'] },
      { completedDates: [] },
      { completedDates: [TODAY, '2026-10-13'] },
    ];
    expect(todaySummary(habits, TODAY)).toEqual({ done: 2, total: 4, progress: 0.5 });
  });

  it('has zero progress when there are no habits', () => {
    expect(todaySummary([], TODAY)).toEqual({ done: 0, total: 0, progress: 0 });
  });
});
