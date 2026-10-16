import { describe, expect, it } from '@jest/globals';

import { describeScheduled, parseReminderChoice, reminderTime } from '../logic';

describe('reminders', () => {
  it('reads a saved choice and falls back to off for anything else', () => {
    expect(parseReminderChoice('evening')).toBe('evening');
    expect(parseReminderChoice('nonsense')).toBe('off');
    expect(parseReminderChoice(null)).toBe('off');
  });

  it('gives a time for each choice and none when off', () => {
    expect(reminderTime('off')).toBeNull();
    expect(reminderTime('morning')).toEqual({ hour: 8, minute: 0 });
    expect(reminderTime('afternoon')).toEqual({ hour: 13, minute: 0 });
    expect(reminderTime('evening')).toEqual({ hour: 20, minute: 0 });
  });
});

describe('describeScheduled', () => {
  it('says what is waiting in plain words', () => {
    expect(describeScheduled(false, 0, false)).toBe(
      'No daily reminder is set. No task reminders are waiting.',
    );
    expect(describeScheduled(true, 1, false)).toBe(
      'The daily reminder is set. 1 task reminder is waiting.',
    );
    expect(describeScheduled(true, 3, true)).toBe(
      'The daily reminder is set. 3 task reminders are waiting. A test reminder is on its way.',
    );
  });
});
