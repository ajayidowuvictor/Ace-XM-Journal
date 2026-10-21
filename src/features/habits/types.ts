export type Habit = {
  id: string;
  name: string;
  /** Local calendar dates (`YYYY-MM-DD`) on which the habit was done, oldest first. */
  completedDates: string[];
  /** Weekdays the habit repeats on: 0 is Monday and 6 is Sunday. Never empty; every day by default. */
  days: number[];
  createdAt: string;
};
