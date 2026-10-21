import { describe, expect, it } from '@jest/globals';

import { dayInfo, hasActivity, monthGrid, monthName, shiftMonth } from '../logic';

describe('monthGrid', () => {
  it('lays out October 2026 (starts on a Thursday) in whole Monday-first weeks', () => {
    const weeks = monthGrid(2026, 9);

    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(weeks[4]).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      null,
    ]);
  });

  it('contains every day of the month exactly once', () => {
    const days = monthGrid(2028, 1)
      .flat()
      .filter((cell): cell is string => cell !== null);
    expect(days).toHaveLength(29);
    expect(days[0]).toBe('2028-02-01');
    expect(days[28]).toBe('2028-02-29');
    expect(new Set(days).size).toBe(29);
  });

  it('starts the first week with no gap when the month starts on a Monday', () => {
    expect(monthGrid(2026, 5)[0][0]).toBe('2026-06-01');
  });
});

describe('shiftMonth', () => {
  it('rolls over the year in both directions', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, monthIndex: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
    expect(shiftMonth(2026, 5, 1)).toEqual({ year: 2026, monthIndex: 6 });
  });
});

describe('dayInfo', () => {
  const inputs = {
    tasks: [
      { dueDate: '2026-10-14', completedAt: null },
      { dueDate: '2026-10-14', completedAt: '2026-10-14T08:00:00.000Z' },
      { dueDate: '2026-10-15', completedAt: null },
      { dueDate: null, completedAt: null },
    ],
    habits: [{ completedDates: ['2026-10-14'] }, { completedDates: ['2026-10-13'] }],
    entries: [{ entryDate: '2026-10-14' }, { entryDate: '2026-10-14' }],
  };

  it('counts tasks due, habits done and journal entries for a date', () => {
    expect(dayInfo('2026-10-14', inputs)).toEqual({ tasksDue: 2, habitsDone: 1, entries: 2 });
    expect(dayInfo('2026-10-16', inputs)).toEqual({ tasksDue: 0, habitsDone: 0, entries: 0 });
  });

  it('reports whether anything is on a day', () => {
    expect(hasActivity(dayInfo('2026-10-14', inputs))).toBe(true);
    expect(hasActivity(dayInfo('2026-10-16', inputs))).toBe(false);
  });
});

describe('monthName', () => {
  it('names months and wraps around the year', () => {
    expect(monthName(0)).toBe('January');
    expect(monthName(9)).toBe('October');
    expect(monthName(11)).toBe('December');
    expect(monthName(12)).toBe('January');
    expect(monthName(-1)).toBe('December');
  });
});
