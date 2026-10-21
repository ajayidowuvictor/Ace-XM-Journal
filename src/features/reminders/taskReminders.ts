import type { Task } from '../tasks/types';

/** Every reminder for a task has an id starting with this, so it can be told from the daily one. */
export const TASK_REMINDER_PREFIX = 'task-';

/** The phone keeps a limited number of alarms, so only the nearest reminders are scheduled. */
export const MAX_TASK_REMINDERS = 50;

export type PlannedReminder = { taskId: string; title: string; at: Date };

export type TaskNameChoice = 'hidden' | 'shown';

export const TASK_NAME_OPTIONS: readonly { value: TaskNameChoice; label: string }[] = [
  { value: 'hidden', label: 'Hide names' },
  { value: 'shown', label: 'Show names' },
];

export function parseTaskNameChoice(value: string | null): TaskNameChoice {
  return value === 'shown' ? 'shown' : 'hidden';
}

export type ReminderTimeChoice = 'off' | '08:00' | '12:00' | '17:00' | '20:00';

export const REMINDER_TIME_CHOICES: readonly { value: ReminderTimeChoice; label: string }[] = [
  { value: 'off', label: 'None' },
  { value: '08:00', label: '8 AM' },
  { value: '12:00', label: '12 PM' },
  { value: '17:00', label: '5 PM' },
  { value: '20:00', label: '8 PM' },
];

/** True for the quick reminder times; any other stored time was typed by the person. */
export function isPresetReminder(time: string): boolean {
  return REMINDER_TIME_CHOICES.some((choice) => choice.value === time);
}

/** A stored "HH:MM" reminder time as minutes after midnight, or null if it is not a time. */
export function reminderMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Minutes after midnight as the stored "HH:MM" reminder time. */
export function reminderFromMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  return `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** A stored "HH:MM" time as people say it: "8 AM", "5 PM", "2:30 PM". Anything else is returned as is. */
export function formatClock(time: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return time;
  const hour = Number(match[1]);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return match[2] === '00' ? `${twelve} ${suffix}` : `${twelve}:${match[2]} ${suffix}`;
}

/** The form choice for a stored time. A time the form cannot offer is shown as it is. */
export function reminderChoiceFor(time: string | null): string {
  return time ?? 'off';
}

/**
 * The moment a task's reminder should go off: its due date at its reminder time (device time
 * zone). Null when the task is done, has no date or time, or that moment has already passed.
 */
export function reminderMoment(task: Task, now: Date): Date | null {
  if (task.completedAt || !task.dueDate || !task.reminderTime) return null;
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(task.dueDate);
  const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(task.reminderTime);
  if (!date || !time) return null;
  const at = new Date(
    Number(date[1]),
    Number(date[2]) - 1,
    Number(date[3]),
    Number(time[1]),
    Number(time[2]),
  );
  return at.getTime() > now.getTime() ? at : null;
}

/** The reminders to schedule: the nearest ones first, up to the limit. */
export function planTaskReminders(
  tasks: readonly Task[],
  now: Date,
  limit: number = MAX_TASK_REMINDERS,
): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  for (const task of tasks) {
    const at = reminderMoment(task, now);
    if (at) planned.push({ taskId: task.id, title: task.title, at });
  }
  planned.sort((a, b) => a.at.getTime() - b.at.getTime() || a.taskId.localeCompare(b.taskId));
  return planned.slice(0, limit);
}

export const TASK_REMINDER_TITLE = 'Ace Notes';
export const TASK_REMINDER_HIDDEN_BODY = 'You have a task to do now.';
export const TASK_REMINDER_SHOWN_BODY = 'Task reminder';

/**
 * What the notification says. By default it does not include the task's words, because
 * notifications can appear on a locked screen. The person can choose to show the name.
 */
export function taskReminderContent(
  title: string,
  choice: TaskNameChoice,
): { title: string; body: string } {
  return choice === 'shown'
    ? { title, body: TASK_REMINDER_SHOWN_BODY }
    : { title: TASK_REMINDER_TITLE, body: TASK_REMINDER_HIDDEN_BODY };
}
