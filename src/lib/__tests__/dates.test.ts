import { describe, expect, it } from '@jest/globals';

import { addDays, isValidDateString, toLocalDateString } from '../dates';

describe('toLocalDateString', () => {
  it('uses the local calendar day with zero padding', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toLocalDateString(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });
});

describe('isValidDateString', () => {
  it('accepts real dates, including 29 February in a leap year', () => {
    expect(isValidDateString('2026-10-14')).toBe(true);
    expect(isValidDateString('2028-02-29')).toBe(true);
  });

  it('rejects impossible or badly formatted dates', () => {
    expect(isValidDateString('2026-02-29')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-1-1')).toBe(false);
    expect(isValidDateString('tomorrow')).toBe(false);
  });
});

describe('addDays', () => {
  it('moves across month and year boundaries', () => {
    expect(addDays(new Date(2026, 9, 31), 1)).toBe('2026-11-01');
    expect(addDays(new Date(2026, 11, 31), 1)).toBe('2027-01-01');
    expect(addDays(new Date(2026, 2, 1), -1)).toBe('2026-02-28');
  });
});
