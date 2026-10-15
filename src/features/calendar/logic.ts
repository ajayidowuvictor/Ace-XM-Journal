import { toLocalDateString } from '../../lib/dates';

/** Weeks of a month, Monday first. Each cell is a `YYYY-MM-DD` date or null outside the month. */
export function monthGrid(year: number, monthIndex: number): (string | null)[][] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Monday = 0

  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toLocalDateString(new Date(year, monthIndex, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The month before or after (`delta` is -1 or 1), rolling the year over when needed. */
export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export type DayInfo = {
  tasksDue: number;
  habitsDone: number;
  entries: number;
};

export type DayInputs = {
  tasks: readonly { dueDate: string | null; completedAt: string | null }[];
  habits: readonly { completedDates: readonly string[] }[];
  entries: readonly { entryDate: string }[];
};

/** What happened or is planned on one date. Finished tasks still count on their due date. */
export function dayInfo(date: string, { tasks, habits, entries }: DayInputs): DayInfo {
  return {
    tasksDue: tasks.filter((task) => task.dueDate === date).length,
    habitsDone: habits.filter((habit) => habit.completedDates.includes(date)).length,
    entries: entries.filter((entry) => entry.entryDate === date).length,
  };
}

export function hasActivity(info: DayInfo): boolean {
  return info.tasksDue + info.habitsDone + info.entries > 0;
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
