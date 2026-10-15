export type Habit = {
  id: string;
  name: string;
  /** Local calendar dates (`YYYY-MM-DD`) on which the habit was done, oldest first. */
  completedDates: string[];
  createdAt: string;
};
