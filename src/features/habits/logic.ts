import { parseLocalDate, shiftDateString } from '../../lib/dates';

export const MAX_NAME_LENGTH = 60;

/** Returns an error message for an unusable habit name, or null when the name is fine. */
export function validateHabitName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a habit name.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Keep the name under ${MAX_NAME_LENGTH} letters.`;
  return null;
}

/**
 * Days in a row the habit was done, counted back from today. If today is not done yet the
 * streak is still alive (counted from yesterday), so it only resets after a missed full day.
 */
export function currentStreak(dates: readonly string[], today: string): number {
  const done = new Set(dates);
  let day: string | null = done.has(today) ? today : shiftDateString(today, -1);
  let streak = 0;
  while (day && done.has(day)) {
    streak += 1;
    day = shiftDateString(day, -1);
  }
  return streak;
}

/** The longest run of consecutive days ever recorded. */
export function longestStreak(dates: readonly string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sorted) {
    run = previous !== null && shiftDateString(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

/** How many of the last `days` days (ending today) the habit was done. */
export function doneInLastDays(dates: readonly string[], today: string, days: number): number {
  const done = new Set(dates);
  let count = 0;
  let day: string | null = today;
  for (let i = 0; i < days && day; i += 1) {
    if (done.has(day)) count += 1;
    day = shiftDateString(day, -1);
  }
  return count;
}

export type TodaySummary = { done: number; total: number; progress: number };

/** Habits finished today out of all habits, with progress from 0 to 1. */
export function todaySummary(
  habits: readonly { completedDates: readonly string[] }[],
  today: string,
) {
  const total = habits.length;
  const done = habits.filter((habit) => habit.completedDates.includes(today)).length;
  return { done, total, progress: total === 0 ? 0 : done / total } satisfies TodaySummary;
}

export type WeekDay = {
  date: string;
  /** One letter for the weekday, such as "M". */
  label: string;
  /** all: every habit done. some: at least one. none: missed. future: not here yet. */
  status: 'all' | 'some' | 'none' | 'future';
  isToday: boolean;
};

export type WeekConsistency = {
  days: WeekDay[];
  /** Habit check-ins so far this week, and how many there could have been up to today. */
  done: number;
  possible: number;
  /** From 0 to 1; 0 when there are no habits. */
  rate: number;
};

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** The week from Monday to Sunday that contains `today`, with how well the habits were kept. */
export function weekConsistency(
  habits: readonly { completedDates: readonly string[] }[],
  today: string,
): WeekConsistency {
  const todayDate = parseLocalDate(today);
  const sinceMonday = todayDate ? (todayDate.getDay() + 6) % 7 : 0;
  const monday = shiftDateString(today, -sinceMonday) ?? today;

  const days: WeekDay[] = [];
  let done = 0;
  let possible = 0;
  for (let index = 0; index < 7; index += 1) {
    const date = shiftDateString(monday, index) ?? monday;
    const isToday = date === today;
    if (date > today) {
      days.push({ date, label: WEEKDAY_LETTERS[index], status: 'future', isToday });
      continue;
    }
    const count = habits.filter((habit) => habit.completedDates.includes(date)).length;
    done += count;
    possible += habits.length;
    const status =
      habits.length > 0 && count === habits.length ? 'all' : count > 0 ? 'some' : 'none';
    days.push({ date, label: WEEKDAY_LETTERS[index], status, isToday });
  }
  return { days, done, possible, rate: possible === 0 ? 0 : done / possible };
}

/** Whether the habit was done on each of the last `count` days ending today, oldest first. */
export function lastDaysDone(dates: readonly string[], today: string, count = 7): boolean[] {
  const done = new Set(dates);
  const result: boolean[] = [];
  for (let back = count - 1; back >= 0; back -= 1) {
    const day = shiftDateString(today, -back);
    result.push(day !== null && done.has(day));
  }
  return result;
}
