import { shiftDateString } from '../../lib/dates';
import type { Habit } from '../habits/types';
import { currentStreak, doneInLastDays } from '../habits/logic';
import type { JournalEntry } from '../journal/types';
import { moodFor } from '../journal/logic';
import { weeklySummary, type ReviewInputs, type WeeklySummary } from '../review/logic';

/**
 * The last `weeks` weeks, oldest first. Each is the 7 days ending `7 * n` days before today, so
 * the newest ends today and matches the Weekly review.
 */
export function weeklyTrends(inputs: ReviewInputs, today: string, weeks = 8): WeeklySummary[] {
  const trends: WeeklySummary[] = [];
  for (let back = weeks - 1; back >= 0; back -= 1) {
    const end = shiftDateString(today, -7 * back) ?? today;
    trends.push(weeklySummary(inputs, end));
  }
  return trends;
}

export type HabitRate = {
  id: string;
  name: string;
  /** Days done out of the last `days` days. */
  done: number;
  days: number;
  /** From 0 to 1. */
  rate: number;
  streak: number;
};

/** How steadily each habit was kept over the last `days` days, best first. */
export function habitRates(habits: readonly Habit[], today: string, days = 30): HabitRate[] {
  return habits
    .map<HabitRate>((habit) => {
      const done = doneInLastDays(habit.completedDates, today, days);
      return {
        id: habit.id,
        name: habit.name,
        done,
        days,
        rate: days > 0 ? done / days : 0,
        streak: currentStreak(habit.completedDates, today),
      };
    })
    .sort((a, b) => b.rate - a.rate || b.streak - a.streak || a.name.localeCompare(b.name));
}

/** On how many of the last `days` days (ending today) there is at least one journal entry. */
export function writingDays(entries: readonly JournalEntry[], today: string, days = 30): number {
  const start = shiftDateString(today, -(days - 1)) ?? today;
  return new Set(
    entries
      .filter((entry) => entry.entryDate >= start && entry.entryDate <= today)
      .map((e) => e.entryDate),
  ).size;
}

/**
 * Days in a row with a journal entry, counted back from today. Like a habit streak, it stays
 * alive until a full day has been missed (counted from yesterday if today has no entry yet).
 */
export function writingStreak(entries: readonly JournalEntry[], today: string): number {
  return currentStreak(
    entries.map((entry) => entry.entryDate),
    today,
  );
}

/** The largest of the values, at least 1, so a bar can be sized as value / max. */
export function scaleMax(values: readonly number[]): number {
  return Math.max(1, ...values);
}

/** Words for an average mood, such as "😊 Good", or a dash when there is none. */
export function moodWords(average: number | null): string {
  if (average === null) return '-';
  const mood = moodFor(Math.min(5, Math.max(1, Math.round(average))));
  return mood ? `${mood.emoji} ${mood.label}` : '-';
}
