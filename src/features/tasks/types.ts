export type Priority = 0 | 1 | 2 | 3;

export const PRIORITY_LABELS: Record<Priority, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  /** Local calendar date `YYYY-MM-DD`, or null when the task has no date. */
  dueDate: string | null;
  priority: Priority;
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
};
