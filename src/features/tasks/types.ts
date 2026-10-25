export type Priority = 0 | 1 | 2 | 3;

export const PRIORITY_LABELS: Record<Priority, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

/** How often a task comes back after it is done. */
export type RepeatRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export const REPEAT_LABELS: Record<RepeatRule, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekdays: 'Every weekday',
  weekly: 'Every week',
  monthly: 'Every month',
};

/** What kind of task it is. Shown as a small coloured label; "none" means no label. */
export type TaskCategory = 'none' | 'deep' | 'routine' | 'personal' | 'health';

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  none: 'None',
  deep: 'Deep work',
  routine: 'Routine',
  personal: 'Personal',
  health: 'Health',
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  /** Local calendar date `YYYY-MM-DD`, or null when the task has no date. */
  dueDate: string | null;
  priority: Priority;
  repeat: RepeatRule;
  /** Local time `HH:MM` for a reminder on the due date, or null for no reminder. */
  reminderTime: string | null;
  category: TaskCategory;
  /** The goal this task counts towards, or null. */
  goalId: string | null;
  /** UTC timestamp (ISO 8601) when completed, or null while still open. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  notes: string;
  dueDate: string | null;
  priority: Priority;
  /** Left out means "does not repeat" when adding and "unchanged" when editing. */
  repeat?: RepeatRule;
  /** Left out means "no reminder" when adding and "unchanged" when editing. */
  reminderTime?: string | null;
  /** Left out means "no category" when adding and "unchanged" when editing. */
  category?: TaskCategory;
  /** Left out means "no goal" when adding and "unchanged" when editing. */
  goalId?: string | null;
};
