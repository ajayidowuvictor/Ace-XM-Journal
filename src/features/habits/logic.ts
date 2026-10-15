import { shiftDateString } from '../../lib/dates';

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
