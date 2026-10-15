import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { openAppDatabase } from '../../db/expoDatabase';
import {
  addMilestone,
  createGoal,
  deleteGoal,
  deleteMilestone,
  listGoals,
  setGoalDone,
  setMilestoneDone,
  updateGoal,
} from '../../db/goalsRepo';
import type { SqlDatabase } from '../../db/types';
import { newId } from '../../lib/id';
import { validateGoalTitle, validateMilestoneTitle } from './logic';
import type { Goal, GoalInput } from './types';

type GoalsValue = {
  goals: Goal[];
  error: string | null;
  /** Saves a new goal. Returns `{ id }` or `{ problem }` with a message to show. */
  add: (input: GoalInput) => { id: string } | { problem: string };
  edit: (id: string, input: GoalInput) => string | null;
  setDone: (id: string, done: boolean) => void;
  remove: (id: string) => void;
  addStep: (goalId: string, title: string) => string | null;
  setStepDone: (stepId: string, done: boolean) => void;
  removeStep: (stepId: string) => void;
  /** Re-reads everything from the database (used after all data is erased). */
  reload: () => void;
};

const GoalsContext = createContext<GoalsValue>({
  goals: [],
  error: null,
  add: () => ({ problem: 'Goals are not ready.' }),
  edit: () => null,
  setDone: () => {},
  remove: () => {},
  addStep: () => null,
  setStepDone: () => {},
  removeStep: () => {},
  reload: () => {},
});

const SAVE_ERROR = 'Your change could not be saved. Please try again.';

function open(): { db: SqlDatabase | null; goals: Goal[]; error: string | null } {
  try {
    const db = openAppDatabase();
    return { db, goals: listGoals(db), error: null };
  } catch {
    return { db: null, goals: [], error: 'Your goals could not be opened on this device.' };
  }
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(open);
  const [goals, setGoals] = useState<Goal[]>(initial.goals);
  const [error, setError] = useState<string | null>(initial.error);
  const db = initial.db;

  const run = useCallback(
    (change: (database: SqlDatabase, nowIso: string) => void): boolean => {
      if (!db) return false;
      try {
        change(db, new Date().toISOString());
        setGoals(listGoals(db));
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
    (input: GoalInput) => {
      const problem = validateGoalTitle(input.title);
      if (problem) return { problem };
      const id = newId();
      const clean = { ...input, title: input.title.trim(), notes: input.notes.trim() };
      return run((database, now) => createGoal(database, id, clean, now))
        ? { id }
        : { problem: SAVE_ERROR };
    },
    [run],
  );

  const edit = useCallback(
    (id: string, input: GoalInput) => {
      const problem = validateGoalTitle(input.title);
      if (problem) return problem;
      const clean = { ...input, title: input.title.trim(), notes: input.notes.trim() };
      return run((database, now) => updateGoal(database, id, clean, now)) ? null : SAVE_ERROR;
    },
    [run],
  );

  const setDone = useCallback(
    (id: string, done: boolean) => {
      run((database, now) => setGoalDone(database, id, done, now));
    },
    [run],
  );

  const remove = useCallback(
    (id: string) => {
      run((database, now) => deleteGoal(database, id, now));
    },
    [run],
  );

  const addStep = useCallback(
    (goalId: string, title: string) => {
      const problem = validateMilestoneTitle(title);
      if (problem) return problem;
      const clean = title.trim();
      return run((database, now) => addMilestone(database, newId(), goalId, clean, now))
        ? null
        : SAVE_ERROR;
    },
    [run],
  );

  const setStepDone = useCallback(
    (stepId: string, done: boolean) => {
      run((database, now) => setMilestoneDone(database, stepId, done, now));
    },
    [run],
  );

  const removeStep = useCallback(
    (stepId: string) => {
      run((database, now) => deleteMilestone(database, stepId, now));
    },
    [run],
  );

  const reload = useCallback(() => {
    if (db) setGoals(listGoals(db));
  }, [db]);

  const value = useMemo(
    () => ({ goals, error, add, edit, setDone, remove, addStep, setStepDone, removeStep, reload }),
    [goals, error, add, edit, setDone, remove, addStep, setStepDone, removeStep, reload],
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals(): GoalsValue {
  return useContext(GoalsContext);
}
