import { describe, expect, it } from '@jest/globals';

import { formatLongDate, greetingForHour } from '../greeting';

describe('greetingForHour', () => {
  it.each([
    [0, 'Good evening'],
    [4, 'Good evening'],
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [17, 'Good afternoon'],
    [18, 'Good evening'],
    [23, 'Good evening'],
  ])('hour %i gives %s', (hour, expected) => {
    expect(greetingForHour(hour)).toBe(expected);
  });
});

describe('formatLongDate', () => {
  it('includes the weekday, day and month', () => {
    // Local date, so the result does not depend on the time zone of the machine running the test.
    const date = new Date(2026, 9, 14, 12, 0, 0);
    expect(formatLongDate(date, 'en-GB')).toBe('Wednesday 14 October');
  });
});
