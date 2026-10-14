import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { openAppDatabase } from '../../db/expoDatabase';
import {
  createTask,
  deleteTask,
  listTasks,
  setTaskCompleted,
  updateTask,
} from '../../db/tasksRepo';
import type { SqlDatabase } from '../../db/types';
import { newId } from '../../lib/id';
import { cleanInput, validateTitle } from './logic';
import type { Task, TaskInput } from './types';

type TasksValue = {
  tasks: Task[];
  /** A plain-language problem message when the database could not be opened or used. */
  error: string | null;
  /** Saves a new task. Returns an error message if the input is not valid, otherwise null. */
  add: (input: TaskInput) => string | null;
  edit: (id: string, input: TaskInput) => string | null;
  setCompleted: (id: string, completed: boolean) => void;
  remove: (id: string) => void;
};

const TasksContext = createContext<TasksValue>({
  tasks: [],
  error: null,
  add: () => null,
  edit: () => null,
  setCompleted: () => {},
  remove: () => {},
});

const SAVE_ERROR = 'Your change could not be saved. Please try again.';

function open(): { db: SqlDatabase | null; tasks: Task[]; error: string | null } {
  try {
    const db = openAppDatabase();
    return { db, tasks: listTasks(db), error: null };
  } catch {
    return { db: null, tasks: [], error: 'Your tasks could not be opened on this device.' };
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(open);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [error, setError] = useState<string | null>(initial.error);
  const db = initial.db;

  const run = useCallback(
    (change: (database: SqlDatabase, nowIso: string) => void): boolean => {
      if (!db) return false;
      try {
        change(db, new Date().toISOString());
        setTasks(listTasks(db));
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
    (input: TaskInput) => {
      const problem = validateTitle(input.title);
      if (problem) return problem;
      const clean = cleanInput(input);
      return run((database, now) => createTask(database, newId(), clean, now)) ? null : SAVE_ERROR;
    },
    [run],
  );

  const edit = useCallback(
    (id: string, input: TaskInput) => {
      const problem = validateTitle(input.title);
      if (problem) return problem;
      const clean = cleanInput(input);
      return run((database, now) => updateTask(database, id, clean, now)) ? null : SAVE_ERROR;
    },
    [run],
  );

  const setCompleted = useCallback(
    (id: string, completed: boolean) => {
      run((database, now) => setTaskCompleted(database, id, completed, now));
    },
    [run],
  );

  const remove = useCallback(
    (id: string) => {
      run((database, now) => deleteTask(database, id, now));
    },
    [run],
  );

  const value = useMemo(
    () => ({ tasks, error, add, edit, setCompleted, remove }),
    [tasks, error, add, edit, setCompleted, remove],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksValue {
  return useContext(TasksContext);
}
