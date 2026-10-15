import { shiftDateString, toLocalDateString } from '../../lib/dates';
import type { Goal } from '../goals/types';
import type { Habit } from '../habits/types';
import type { JournalEntry } from '../journal/types';
import type { Task } from '../tasks/types';

export type ReviewInputs = {
  tasks: readonly Task[];
  habits: readonly Habit[];
  entries: readonly JournalEntry[];
  goals: readonly Goal[];
};

export type WeeklySummary = {
  /** First and last local date of the 7-day window, ending today. */
  start: string;
  end: string;
  tasksCompleted: number;
  tasksOverdue: number;
  habitCheckIns: number;
  habitCheckInsPossible: number;
  entries: number;
  /** Average mood of the week's entries that have one (1 to 5), or null. */
  averageMood: number | null;
  goalsAchieved: number;
};

function localDateOfMoment(iso: string): string {
  return toLocalDateString(new Date(iso));
}

/** Summary of the 7 days ending on `today` (a local `YYYY-MM-DD`). */
export function weeklySummary(inputs: ReviewInputs, today: string): WeeklySummary {
  const start = shiftDateString(today, -6) ?? today;
  const inWindow = (date: string) => date >= start && date <= today;

  const moods = inputs.entries
    .filter((entry) => inWindow(entry.entryDate) && entry.mood !== null)
    .map((entry) => entry.mood as number);

  return {
    start,
    end: today,
    tasksCompleted: inputs.tasks.filter(
      (task) => task.completedAt && inWindow(localDateOfMoment(task.completedAt)),
    ).length,
    tasksOverdue: inputs.tasks.filter(
      (task) => !task.completedAt && task.dueDate !== null && task.dueDate < today,
    ).length,
    habitCheckIns: inputs.habits.reduce(
      (sum, habit) => sum + habit.completedDates.filter(inWindow).length,
      0,
    ),
    habitCheckInsPossible: inputs.habits.length * 7,
    entries: inputs.entries.filter((entry) => inWindow(entry.entryDate)).length,
    averageMood: moods.length === 0 ? null : moods.reduce((a, b) => a + b, 0) / moods.length,
    goalsAchieved: inputs.goals.filter(
      (goal) => goal.completedAt && inWindow(localDateOfMoment(goal.completedAt)),
    ).length,
  };
}

/** Plain-language lines describing the summary, used on screen and in the saved entry. */
export function summaryLines(summary: WeeklySummary): string[] {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const lines = [
    `Tasks completed: ${summary.tasksCompleted}`,
    `Tasks overdue: ${summary.tasksOverdue}`,
  ];
  lines.push(
    summary.habitCheckInsPossible > 0
      ? `Habit check-ins: ${summary.habitCheckIns} of ${summary.habitCheckInsPossible}`
      : 'Habit check-ins: no habits yet',
  );
  lines.push(`Journal: ${plural(summary.entries, 'entry').replace('entrys', 'entries')}`);
  if (summary.averageMood !== null) {
    lines.push(`Average mood: ${summary.averageMood.toFixed(1)} out of 5`);
  }
  lines.push(`Goals achieved: ${summary.goalsAchieved}`);
  return lines;
}

/** Body text for a journal entry that stores the review and the user's reflection. */
export function reviewEntryBody(summary: WeeklySummary, reflection: string): string {
  const note = reflection.trim();
  return [...summaryLines(summary), '', 'Reflection:', note || '(nothing written)'].join('\n');
}
