import { describe, expect, it } from '@jest/globals';

import {
  MAX_NAME_LENGTH,
  currentStreak,
  doneInLastDays,
  lastDaysDone,
  longestStreak,
  todaySummary,
  weekConsistency,
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

describe('weekConsistency', () => {
  // 2026-10-14 is a Wednesday; its week is Monday 12 to Sunday 18 October.
  const habits = [
    { completedDates: ['2026-10-12', '2026-10-13', '2026-10-14'] },
    { completedDates: ['2026-10-12', '2026-10-14'] },
  ];

  it('marks each day of the week from Monday', () => {
    const week = weekConsistency(habits, '2026-10-14');
    expect(week.days.map((d) => d.date)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
    expect(week.days.map((d) => d.label).join('')).toBe('MTWTFSS');
    expect(week.days.map((d) => d.status)).toEqual([
      'all',
      'some',
      'all',
      'future',
      'future',
      'future',
      'future',
    ]);
    expect(week.days[2].isToday).toBe(true);
    expect(week.days[1].isToday).toBe(false);
  });

  it('counts check-ins against what was possible up to today', () => {
    const week = weekConsistency(habits, '2026-10-14');
    expect(week.done).toBe(5);
    expect(week.possible).toBe(6);
    expect(week.rate).toBeCloseTo(5 / 6);
  });

  it('starts a new week on Monday and handles a Sunday', () => {
    expect(weekConsistency(habits, '2026-10-12').days[0].isToday).toBe(true);
    const sunday = weekConsistency(habits, '2026-10-18');
    expect(sunday.days[0].date).toBe('2026-10-12');
    expect(sunday.days[6].isToday).toBe(true);
  });

  it('has no rate and marks days as missed when there are no habits', () => {
    const week = weekConsistency([], '2026-10-14');
    expect(week.rate).toBe(0);
    expect(week.possible).toBe(0);
    expect(week.days[0].status).toBe('none');
  });
});

describe('lastDaysDone', () => {
  it('lists the last days oldest first', () => {
    expect(lastDaysDone(['2026-10-14', '2026-10-12'], '2026-10-14', 4)).toEqual([
      false,
      true,
      false,
      true,
    ]);
    expect(lastDaysDone([], '2026-10-14')).toEqual([false, false, false, false, false, false, false]);
  });
});
