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
  ALL_DAYS,
  cleanDays,
  daysFromText,
  daysToText,
  isScheduledOn,
  plannedInLastDays,
  scheduleLabel,
  validateHabitDays,
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
    expect(lastDaysDone([], '2026-10-14')).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe('habit days', () => {
  // 2026-10-14 is a Wednesday. Days are 0 Monday to 6 Sunday.
  const MON_WED_FRI = [0, 2, 4];

  it('cleans, validates and stores day lists', () => {
    expect(cleanDays([4, 0, 0, 9, -1, 2.5, 2])).toEqual([0, 2, 4]);
    expect(validateHabitDays([])).toBe('Choose at least one day.');
    expect(validateHabitDays([3])).toBeNull();
    expect(daysToText([4, 0, 2])).toBe('024');
    expect(daysFromText('024')).toEqual([0, 2, 4]);
    expect(daysFromText('')).toEqual([...ALL_DAYS]);
    expect(daysFromText('xyz')).toEqual([...ALL_DAYS]);
    expect(daysFromText(null)).toEqual([...ALL_DAYS]);
  });

  it('knows which dates a habit is planned for', () => {
    expect(isScheduledOn(MON_WED_FRI, '2026-10-14')).toBe(true); // Wednesday
    expect(isScheduledOn(MON_WED_FRI, '2026-10-15')).toBe(false); // Thursday
    expect(isScheduledOn(MON_WED_FRI, '2026-10-18')).toBe(false); // Sunday
    expect(isScheduledOn([6], '2026-10-18')).toBe(true);
  });

  it('describes a schedule in words', () => {
    expect(scheduleLabel(ALL_DAYS)).toBe('Every day');
    expect(scheduleLabel([0, 1, 2, 3, 4])).toBe('Weekdays');
    expect(scheduleLabel([5, 6])).toBe('Weekends');
    expect(scheduleLabel([4, 0, 2])).toBe('Mon, Wed, Fri');
  });

  it('keeps a streak alive over rest days', () => {
    // Done Mon 12, Wed 14... check on Wed 14 and on Thu 15 (a rest day).
    const dates = ['2026-10-09', '2026-10-12', '2026-10-14'];
    expect(currentStreak(dates, '2026-10-14', MON_WED_FRI)).toBe(3);
    expect(currentStreak(dates, '2026-10-15', MON_WED_FRI)).toBe(3);
    expect(currentStreak(dates, '2026-10-16', MON_WED_FRI)).toBe(3);
  });

  it('breaks a streak when a planned day was missed', () => {
    // Fri 9 done, Mon 12 missed, Wed 14 done.
    const dates = ['2026-10-09', '2026-10-14'];
    expect(currentStreak(dates, '2026-10-14', MON_WED_FRI)).toBe(1);
  });

  it('does not break today while a planned day is still open', () => {
    const dates = ['2026-10-09', '2026-10-12'];
    expect(currentStreak(dates, '2026-10-14', MON_WED_FRI)).toBe(2);
    // The next day, Wednesday was missed, so the streak is gone.
    expect(currentStreak(dates, '2026-10-15', MON_WED_FRI)).toBe(0);
  });

  it('counts an extra day done on a rest day', () => {
    const dates = ['2026-10-12', '2026-10-13', '2026-10-14'];
    expect(currentStreak(dates, '2026-10-14', MON_WED_FRI)).toBe(3);
  });

  it('finds the longest run over planned days only', () => {
    const dates = ['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12', '2026-10-16'];
    // Mon 5, Wed 7, Fri 9, Mon 12 in a row; Wed 14 missed; Fri 16 alone.
    expect(longestStreak(dates, MON_WED_FRI)).toBe(4);
    expect(longestStreak([], MON_WED_FRI)).toBe(0);
  });

  it('counts planned days in a window', () => {
    const dates = ['2026-10-12', '2026-10-14'];
    // Last 7 days ending Wed 14: Thu 8 to Wed 14 has Fri 9, Mon 12, Wed 14 planned.
    expect(plannedInLastDays(dates, '2026-10-14', 7, MON_WED_FRI)).toEqual({
      planned: 3,
      done: 2,
    });
    expect(plannedInLastDays(dates, '2026-10-14', 7)).toEqual({ planned: 7, done: 2 });
  });

  it('only counts habits planned for today in the summary', () => {
    const habits = [
      { completedDates: ['2026-10-15'], days: [3] }, // Thursday, done
      { completedDates: [], days: [3] }, // Thursday, open
      { completedDates: [], days: [0] }, // Monday only: rest today
    ];
    expect(todaySummary(habits, '2026-10-15')).toEqual({ done: 1, total: 2, progress: 0.5 });
  });

  it('marks days with no planned habits as rest in the week', () => {
    const week = weekConsistency([{ completedDates: ['2026-10-12'], days: [0] }], '2026-10-14');
    expect(week.days.map((d) => d.status)).toEqual([
      'all',
      'rest',
      'rest',
      'future',
      'future',
      'future',
      'future',
    ]);
    expect(week.possible).toBe(1);
    expect(week.done).toBe(1);
  });
});
