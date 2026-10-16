import { describe, expect, it } from '@jest/globals';

import {
  isValidReminderTime,
  nextDueDate,
  nextOccurrence,
  toReminderTime,
  toRepeatRule,
} from '../repeat';
import type { Task } from '../types';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Water the plants',
    notes: 'Front and back',
    dueDate: '2026-10-14',
    priority: 2,
    repeat: 'daily',
    reminderTime: '08:00',
    completedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('repeat rules and reminder times', () => {
  it('reads a stored rule and falls back to none', () => {
    expect(toRepeatRule('weekly')).toBe('weekly');
    expect(toRepeatRule('hourly')).toBe('none');
    expect(toRepeatRule(null)).toBe('none');
    expect(toRepeatRule(3)).toBe('none');
  });

  it('accepts only real 24-hour times', () => {
    expect(isValidReminderTime('08:00')).toBe(true);
    expect(isValidReminderTime('23:59')).toBe(true);
    expect(isValidReminderTime('24:00')).toBe(false);
    expect(isValidReminderTime('8:00')).toBe(false);
    expect(isValidReminderTime('08:60')).toBe(false);
    expect(toReminderTime('17:30')).toBe('17:30');
    expect(toReminderTime('late')).toBeNull();
    expect(toReminderTime(null)).toBeNull();
    expect(toReminderTime(800)).toBeNull();
  });
});

describe('nextDueDate', () => {
  it('gives nothing when the task does not repeat or a date is wrong', () => {
    expect(nextDueDate('2026-10-14', 'none', '2026-10-14')).toBeNull();
    expect(nextDueDate('2026-13-45', 'daily', '2026-10-14')).toBeNull();
    expect(nextDueDate('2026-10-14', 'daily', 'today')).toBeNull();
  });

  it('daily: the day after the due date, or after today if the task is late', () => {
    expect(nextDueDate('2026-10-14', 'daily', '2026-10-14')).toBe('2026-10-15');
    expect(nextDueDate('2026-10-14', 'daily', '2026-10-20')).toBe('2026-10-21');
    // Done early: still counts from the due date, never earlier than tomorrow.
    expect(nextDueDate('2026-10-20', 'daily', '2026-10-14')).toBe('2026-10-21');
  });

  it('weekdays: skips Saturday and Sunday', () => {
    // 2026-10-16 is a Friday.
    expect(nextDueDate('2026-10-16', 'weekdays', '2026-10-16')).toBe('2026-10-19');
    expect(nextDueDate('2026-10-14', 'weekdays', '2026-10-14')).toBe('2026-10-15');
    // Late on a Saturday: next is Monday.
    expect(nextDueDate('2026-10-12', 'weekdays', '2026-10-17')).toBe('2026-10-19');
  });

  it('weekly: keeps the weekday and never lands on or before today', () => {
    expect(nextDueDate('2026-10-14', 'weekly', '2026-10-14')).toBe('2026-10-21');
    // Three weeks late (a Wednesday task done on a Wednesday): next Wednesday.
    expect(nextDueDate('2026-09-23', 'weekly', '2026-10-14')).toBe('2026-10-21');
    // Done on the Friday after: still a Wednesday, the week after.
    expect(nextDueDate('2026-10-14', 'weekly', '2026-10-16')).toBe('2026-10-21');
    // Done a day early.
    expect(nextDueDate('2026-10-14', 'weekly', '2026-10-13')).toBe('2026-10-21');
  });

  it('monthly: keeps the day of the month, using the last day of short months', () => {
    expect(nextDueDate('2026-10-14', 'monthly', '2026-10-14')).toBe('2026-11-14');
    expect(nextDueDate('2026-12-20', 'monthly', '2026-12-20')).toBe('2027-01-20');
    expect(nextDueDate('2026-01-31', 'monthly', '2026-01-31')).toBe('2026-02-28');
    expect(nextDueDate('2028-01-31', 'monthly', '2028-01-31')).toBe('2028-02-29');
    // A 31st task late into March comes back on the 31st, not the 28th.
    expect(nextDueDate('2026-01-31', 'monthly', '2026-03-05')).toBe('2026-03-31');
  });
});

describe('nextOccurrence', () => {
  it('copies the task forward with the next date', () => {
    expect(nextOccurrence(task(), '2026-10-14')).toEqual({
      title: 'Water the plants',
      notes: 'Front and back',
      dueDate: '2026-10-15',
      priority: 2,
      repeat: 'daily',
      reminderTime: '08:00',
    });
  });

  it('gives nothing for a task that does not repeat or has no date', () => {
    expect(nextOccurrence(task({ repeat: 'none' }), '2026-10-14')).toBeNull();
    expect(nextOccurrence(task({ dueDate: null }), '2026-10-14')).toBeNull();
  });
});
