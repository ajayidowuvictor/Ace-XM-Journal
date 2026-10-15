import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { openAppDatabase } from '../../db/expoDatabase';
import {
  createHabit,
  deleteHabit,
  listHabits,
  renameHabit,
  setHabitDone,
} from '../../db/habitsRepo';
import type { SqlDatabase } from '../../db/types';
import { toLocalDateString } from '../../lib/dates';
import { newId } from '../../lib/id';
import { validateHabitName } from './logic';
import type { Habit } from './types';

type HabitsValue = {
  habits: Habit[];
  error: string | null;
  /** Saves a new habit. Returns an error message if the name is not valid, otherwise null. */
  add: (name: string) => string | null;
  rename: (id: string, name: string) => string | null;
  /** Marks the habit done or not done for today (the device's local date). */
  setDoneToday: (id: string, done: boolean) => void;
  remove: (id: string) => void;
};

const HabitsContext = createContext<HabitsValue>({
  habits: [],
  error: null,
  add: () => null,
  rename: () => null,
  setDoneToday: () => {},
  remove: () => {},
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
    (name: string) => {
      const problem = validateHabitName(name);
      if (problem) return problem;
      const clean = name.trim();
      return run((database, now) => createHabit(database, newId(), clean, now)) ? null : SAVE_ERROR;
    },
    [run],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const problem = validateHabitName(name);
      if (problem) return problem;
      const clean = name.trim();
      return run((database, now) => renameHabit(database, id, clean, now)) ? null : SAVE_ERROR;
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

  const value = useMemo(
    () => ({ habits, error, add, rename, setDoneToday, remove }),
    [habits, error, add, rename, setDoneToday, remove],
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsValue {
  return useContext(HabitsContext);
}
