export type Milestone = {
  id: string;
  goalId: string;
  title: string;
  completedAt: string | null;
};

export type Goal = {
  id: string;
  title: string;
  notes: string;
  /** Local calendar date `YYYY-MM-DD`, or null when there is no target date. */
  targetDate: string | null;
  completedAt: string | null;
  milestones: Milestone[];
  createdAt: string;
};

export type GoalInput = { title: string; notes: string; targetDate: string | null };
