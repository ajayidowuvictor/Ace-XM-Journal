import { addDays, isValidDateString, parseLocalDate, toLocalDateString } from '../../lib/dates';
import type { RepeatRule, Task, TaskInput } from './types';

const RULES: readonly RepeatRule[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly'];

export function toRepeatRule(value: unknown): RepeatRule {
  return RULES.includes(value as RepeatRule) ? (value as RepeatRule) : 'none';
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True for a time written as `HH:MM` on a 24-hour clock. */
export function isValidReminderTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** A stored reminder time, or null when it is missing or not a real time. */
export function toReminderTime(value: unknown): string | null {
  return typeof value === 'string' && isValidReminderTime(value) ? value : null;
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

/** The last day of a month (month is 0 to 11). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * The due date of the next copy of a repeating task, as `YYYY-MM-DD`. It is always after both the
 * old due date and `today`, so finishing a task late or early never gives a date in the past or a
 * second copy for today. Weekly and monthly tasks keep their weekday or day of the month. Returns
 * null when the task does not repeat or a date is not valid.
 */
export function nextDueDate(dueDate: string, rule: RepeatRule, today: string): string | null {
  if (rule === 'none' || !isValidDateString(dueDate) || !isValidDateString(today)) return null;
  const due = parseLocalDate(dueDate);
  const now = parseLocalDate(today);
  if (!due || !now) return null;
  const base = due > now ? due : now;

  if (rule === 'daily') return addDays(base, 1);

  if (rule === 'weekdays') {
    let candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    while (isWeekend(candidate)) {
      candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 1);
    }
    return toLocalDateString(candidate);
  }

  if (rule === 'weekly') {
    const dayMs = 24 * 60 * 60 * 1000;
    // Whole days, rounded to cope with the hour that daylight saving can add or remove.
    const gap = Math.round((base.getTime() - due.getTime()) / dayMs);
    const weeks = Math.floor(gap / 7) + 1;
    return addDays(due, weeks * 7);
  }

  // Monthly: same day of the month as before, or the last day of a shorter month.
  const anchorDay = due.getDate();
  let year = due.getFullYear();
  let month = due.getMonth();
  for (let step = 0; step < 2400; step += 1) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    const candidate = new Date(year, month, Math.min(anchorDay, daysInMonth(year, month)));
    if (candidate > base) return toLocalDateString(candidate);
  }
  return null;
}

/**
 * The next copy of a repeating task that has just been finished, or null if it does not repeat
 * (or has no due date to count from). Title, notes, priority, repeat rule and reminder carry over.
 */
export function nextOccurrence(task: Task, today: string): TaskInput | null {
  if (task.repeat === 'none' || !task.dueDate) return null;
  const dueDate = nextDueDate(task.dueDate, task.repeat, today);
  if (!dueDate) return null;
  return {
    title: task.title,
    notes: task.notes,
    dueDate,
    priority: task.priority,
    repeat: task.repeat,
    reminderTime: task.reminderTime,
  };
}
