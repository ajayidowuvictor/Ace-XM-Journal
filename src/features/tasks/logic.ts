import { addDays } from '../../lib/dates';

import type { Task, TaskInput } from './types';

export const MAX_TITLE_LENGTH = 200;

/** Returns an error message for an unusable title, or null when the title is fine. */
export function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return 'Enter a task title.';
  if (trimmed.length > MAX_TITLE_LENGTH) return `Keep the title under ${MAX_TITLE_LENGTH} letters.`;
  return null;
}

export function cleanInput(input: TaskInput): TaskInput {
  return { ...input, title: input.title.trim(), notes: input.notes.trim() };
}

export type TaskGroups = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  noDate: Task[];
  done: Task[];
};

function byPriorityThenAge(a: Task, b: Task): number {
  return b.priority - a.priority || a.createdAt.localeCompare(b.createdAt);
}

function byDateThenPriority(a: Task, b: Task): number {
  return (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || byPriorityThenAge(a, b);
}

/** Sorts tasks into the sections shown on the Tasks screen. `today` is a local `YYYY-MM-DD`. */
export function groupTasks(tasks: readonly Task[], today: string): TaskGroups {
  const groups: TaskGroups = { overdue: [], today: [], upcoming: [], noDate: [], done: [] };

  for (const task of tasks) {
    if (task.completedAt) groups.done.push(task);
    else if (!task.dueDate) groups.noDate.push(task);
    else if (task.dueDate < today) groups.overdue.push(task);
    else if (task.dueDate === today) groups.today.push(task);
    else groups.upcoming.push(task);
  }

  groups.overdue.sort(byDateThenPriority);
  groups.today.sort(byPriorityThenAge);
  groups.upcoming.sort(byDateThenPriority);
  groups.noDate.sort(byPriorityThenAge);
  groups.done.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  return groups;
}

/** Open tasks due today or overdue, most important first. Used on the Home screen. */
export function todaysPriorities(tasks: readonly Task[], today: string): Task[] {
  const { overdue, today: dueToday } = groupTasks(tasks, today);
  return [...overdue, ...dueToday];
}

export type DueChoice = 'none' | 'today' | 'tomorrow' | 'week' | 'keep' | 'custom';

/** The due date a choice on the task form stands for. `keep` leaves an existing date as it is. */
export function dueDateFor(
  choice: DueChoice,
  existing: string | null,
  now: Date,
  custom: string | null = null,
): string | null {
  switch (choice) {
    case 'none':
      return null;
    case 'today':
      return addDays(now, 0);
    case 'tomorrow':
      return addDays(now, 1);
    case 'week':
      return addDays(now, 7);
    case 'keep':
      return existing;
    case 'custom':
      return custom;
  }
}

/** Which form choice matches a stored date. Dates the form cannot offer map to `keep`. */
export function choiceFor(existing: string | null, now: Date): DueChoice {
  if (!existing) return 'none';
  if (existing === addDays(now, 0)) return 'today';
  if (existing === addDays(now, 1)) return 'tomorrow';
  if (existing === addDays(now, 7)) return 'week';
  return 'keep';
}
