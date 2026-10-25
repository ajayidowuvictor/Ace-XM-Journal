import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { openAppDatabase } from '../../db/expoDatabase';
import {
  createHabit,
  deleteHabit,
  listHabits,
  setHabitDone,
  updateHabit,
} from '../../db/habitsRepo';
import type { SqlDatabase } from '../../db/types';
import { toLocalDateString } from '../../lib/dates';
import { newId } from '../../lib/id';
import { validateHabitDays, validateHabitName } from './logic';
import type { Habit } from './types';

type HabitsValue = {
  habits: Habit[];
  error: string | null;
  /** Saves a new habit. Returns an error message if the name or days are not valid, otherwise null. */
  add: (name: string, days: readonly number[]) => string | null;
  /** Changes a habit's name and the days it repeats on. */
  edit: (id: string, name: string, days: readonly number[]) => string | null;
  /** Marks the habit done or not done for today (the device's local date). */
  setDoneToday: (id: string, done: boolean) => void;
  remove: (id: string) => void;
  /** Re-reads everything from the database (used after all data is erased). */
  reload: () => void;
};

const HabitsContext = createContext<HabitsValue>({
  habits: [],
  error: null,
  add: () => null,
  edit: () => null,
  setDoneToday: () => {},
  remove: () => {},
  reload: () => {},
});

const SAVE_ERROR = 'Your change could not be saved. Please try again.';

function open(): { db: SqlDatabase | null; habits: Habit[]; error: string | null } {
  try {
    const db = openAppDatabase();
    return { db, habits: listHabits(db), error: null };
  } catch {
    return { db: null, habits: [], error: 'Your habits could not be opened on this device.' };
  }
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(open);
  const [habits, setHabits] = useState<Habit[]>(initial.habits);
  const [error, setError] = useState<string | null>(initial.error);
  const db = initial.db;

  const run = useCallback(
    (change: (database: SqlDatabase, nowIso: string) => void): boolean => {
      if (!db) return false;
      try {
        change(db, new Date().toISOString());
        setHabits(listHabits(db));
        setError(null);
        return true;
      } catch {
        setError(SAVE_ERROR);
        return false;
      }
    },
    [db],
  );

  const add = useCallback(
    (name: string, days: readonly number[]) => {
      const problem = validateHabitName(name) ?? validateHabitDays(days);
      if (problem) return problem;
      const clean = name.trim();
      return run((database, now) => createHabit(database, newId(), clean, now, days))
        ? null
        : SAVE_ERROR;
    },
    [run],
  );

  const edit = useCallback(
    (id: string, name: string, days: readonly number[]) => {
      const problem = validateHabitName(name) ?? validateHabitDays(days);
      if (problem) return problem;
      const clean = name.trim();
      return run((database, now) => updateHabit(database, id, clean, days, now))
        ? null
        : SAVE_ERROR;
    },
    [run],
  );

  const setDoneToday = useCallback(
    (id: string, done: boolean) => {
      const today = toLocalDateString(new Date());
      run((database, now) => setHabitDone(database, id, today, done, now));
    },
    [run],
  );

  const remove = useCallback(
    (id: string) => {
      run((database, now) => deleteHabit(database, id, now));
    },
    [run],
  );

  const reload = useCallback(() => {
    if (db) setHabits(listHabits(db));
  }, [db]);

  const value = useMemo(
    () => ({ habits, error, add, edit, setDoneToday, remove, reload }),
    [habits, error, add, edit, setDoneToday, remove, reload],
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsValue {
  return useContext(HabitsContext);
}
