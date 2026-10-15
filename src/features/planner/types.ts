/** A slot of the day, such as "Deep work 9:00 to 10:30". Times are minutes after local midnight. */
export type PlanBlock = {
  id: string;
  /** Local calendar date `YYYY-MM-DD`. */
  planDate: string;
  title: string;
  /** The task this block is for, or null for a free-standing block. */
  taskId: string | null;
  startMinutes: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type PlanBlockInput = {
  title: string;
  taskId: string | null;
  startMinutes: number;
  durationMinutes: number;
};

/** One of the (at most three) tasks a person chose to focus on for a day. */
export type FocusRow = {
  planDate: string;
  taskId: string;
  position: number;
};

export const MAX_FOCUS = 3;
