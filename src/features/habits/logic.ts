import { parseLocalDate, shiftDateString } from '../../lib/dates';

export const MAX_NAME_LENGTH = 60;

/** Returns an error message for an unusable habit name, or null when the name is fine. */
export function validateHabitName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a habit name.';
  if (trimmed.length > MAX_NAME_LENGTH) return `Keep the name under ${MAX_NAME_LENGTH} letters.`;
  return null;
}

/** Weekdays as numbers: 0 is Monday and 6 is Sunday. */
export const ALL_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS_ONLY: readonly number[] = [0, 1, 2, 3, 4];
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type HabitLike = { completedDates: readonly string[]; days?: readonly number[] };

/** A list of weekdays cleaned up: whole numbers 0 to 6, no repeats, in order. */
export function cleanDays(days: readonly unknown[]): number[] {
  const valid = days.filter(
    (d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6,
  );
  return [...new Set(valid)].sort((a, b) => a - b);
}

/** Returns an error message when no day is chosen, otherwise null. */
export function validateHabitDays(days: readonly number[]): string | null {
  return cleanDays(days).length === 0 ? 'Choose at least one day.' : null;
}

/** How days are kept in the database: "024" means Monday, Wednesday and Friday. */
export function daysToText(days: readonly number[]): string {
  return cleanDays(days).join('');
}

/** Reads the stored text back. Anything unusable means every day. */
export function daysFromText(text: string | null | undefined): number[] {
  const days = cleanDays((text ?? '').split('').map(Number));
  return days.length === 0 ? [...ALL_DAYS] : days;
}

/** Whether the habit is planned on this date (`YYYY-MM-DD`). */
export function isScheduledOn(days: readonly number[], date: string): boolean {
  const parsed = parseLocalDate(date);
  return parsed ? days.includes((parsed.getDay() + 6) % 7) : true;
}

/** "Every day", "Weekdays", "Weekends" or the day names, such as "Mon, Wed, Fri". */
export function scheduleLabel(days: readonly number[]): string {
  const clean = cleanDays(days);
  if (clean.length === 7) return 'Every day';
  if (clean.join('') === '01234') return 'Weekdays';
  if (clean.join('') === '56') return 'Weekends';
  return clean.map((d) => DAY_NAMES[d]).join(', ');
}

/**
 * Times in a row the habit was done on the days it is planned, counted back from today. Days it
 * is not planned are skipped and never break the streak. If today is planned but not done yet
 * the streak is still alive, so it only resets after a planned day was missed.
 */
export function currentStreak(
  dates: readonly string[],
  today: string,
  days: readonly number[] = ALL_DAYS,
): number {
  const done = new Set(dates);
  let day: string | null = today;
  let streak = 0;
  for (let step = 0; step < 4000 && day; step += 1) {
    if (done.has(day)) {
      streak += 1;
    } else if (isScheduledOn(days, day) && day !== today) {
      break;
    }
    day = shiftDateString(day, -1);
  }
  return streak;
}

/** The longest run of planned days done in a row, ever recorded. */
export function longestStreak(
  dates: readonly string[],
  days: readonly number[] = ALL_DAYS,
): number {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return 0;
  const last = sorted[sorted.length - 1];
  const done = new Set(sorted);
  let best = 0;
  let run = 0;
  let day: string | null = sorted[0];
  for (let step = 0; step < 4000 && day && day <= last; step += 1) {
    if (done.has(day)) {
      run += 1;
      best = Math.max(best, run);
    } else if (isScheduledOn(days, day)) {
      run = 0;
    }
    day = shiftDateString(day, 1);
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

/** Planned days inside the last `window` days, and how many of them the habit was done on. */
export function plannedInLastDays(
  dates: readonly string[],
  today: string,
  window: number,
  days: readonly number[] = ALL_DAYS,
): { planned: number; done: number } {
  const done = new Set(dates);
  let planned = 0;
  let kept = 0;
  let day: string | null = today;
  for (let i = 0; i < window && day; i += 1) {
    if (isScheduledOn(days, day)) {
      planned += 1;
      if (done.has(day)) kept += 1;
    }
    day = shiftDateString(day, -1);
  }
  return { planned, done: kept };
}

export type TodaySummary = { done: number; total: number; progress: number };

/** Habits finished today out of the habits planned for today, with progress from 0 to 1. */
export function todaySummary(habits: readonly HabitLike[], today: string) {
  const planned = habits.filter((habit) => isScheduledOn(habit.days ?? ALL_DAYS, today));
  const total = planned.length;
  const done = planned.filter((habit) => habit.completedDates.includes(today)).length;
  return { done, total, progress: total === 0 ? 0 : done / total } satisfies TodaySummary;
}

export type WeekDay = {
  date: string;
  /** One letter for the weekday, such as "M". */
  label: string;
  /** all: every planned habit done. some: at least one. none: missed. rest: none planned. future: not here yet. */
  status: 'all' | 'some' | 'none' | 'rest' | 'future';
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
export function weekConsistency(habits: readonly HabitLike[], today: string): WeekConsistency {
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
    const planned = habits.filter((habit) => isScheduledOn(habit.days ?? ALL_DAYS, date));
    const count = planned.filter((habit) => habit.completedDates.includes(date)).length;
    done += count;
    possible += planned.length;
    const status =
      habits.length > 0 && planned.length === 0
        ? 'rest'
        : habits.length > 0 && count === planned.length
          ? 'all'
          : count > 0
            ? 'some'
            : 'none';
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
