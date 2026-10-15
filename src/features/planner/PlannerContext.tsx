import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { openAppDatabase } from '../../db/expoDatabase';
import {
  createBlock,
  deleteBlock,
  listBlocks,
  listFocus,
  replaceFocus,
  updateBlock,
} from '../../db/plannerRepo';
import type { SqlDatabase } from '../../db/types';
import { newId } from '../../lib/id';
import { cleanBlockInput, validateBlock } from './logic';
import { MAX_FOCUS, type FocusRow, type PlanBlock, type PlanBlockInput } from './types';

type PlannerValue = {
  focus: FocusRow[];
  blocks: PlanBlock[];
  /** A plain-language problem message when the database could not be opened or used. */
  error: string | null;
  /** Replaces the focus tasks of a day (at most three). Returns true when saved. */
  setFocus: (planDate: string, taskIds: string[]) => boolean;
  /** Saves a new block. Returns an error message if the input is not valid, otherwise null. */
  addBlock: (planDate: string, input: PlanBlockInput) => string | null;
  editBlock: (id: string, input: PlanBlockInput) => string | null;
  removeBlock: (id: string) => void;
  /** Re-reads everything from the database (used after all data is erased). */
  reload: () => void;
};

const PlannerContext = createContext<PlannerValue>({
  focus: [],
  blocks: [],
  error: null,
  setFocus: () => false,
  addBlock: () => null,
  editBlock: () => null,
  removeBlock: () => {},
  reload: () => {},
});

const SAVE_ERROR = 'Your change could not be saved. Please try again.';

function open(): {
  db: SqlDatabase | null;
  focus: FocusRow[];
  blocks: PlanBlock[];
  error: string | null;
} {
  try {
    const db = openAppDatabase();
    return { db, focus: listFocus(db), blocks: listBlocks(db), error: null };
  } catch {
    return {
      db: null,
      focus: [],
      blocks: [],
      error: 'Your day plan could not be opened on this device.',
    };
  }
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(open);
  const [focus, setFocusRows] = useState<FocusRow[]>(initial.focus);
  const [blocks, setBlocks] = useState<PlanBlock[]>(initial.blocks);
  const [error, setError] = useState<string | null>(initial.error);
  const db = initial.db;

  const run = useCallback(
    (change: (database: SqlDatabase, nowIso: string) => void): boolean => {
      if (!db) return false;
      try {
        change(db, new Date().toISOString());
        setFocusRows(listFocus(db));
        setBlocks(listBlocks(db));
        setError(null);
        return true;
      } catch {
        setError(SAVE_ERROR);
        return false;
      }
    },
    [db],
  );

  const setFocus = useCallback(
    (planDate: string, taskIds: string[]) =>
      run((database, now) => replaceFocus(database, planDate, taskIds.slice(0, MAX_FOCUS), now)),
    [run],
  );

  const addBlock = useCallback(
    (planDate: string, input: PlanBlockInput) => {
      const problem = validateBlock(input);
      if (problem) return problem;
      const clean = cleanBlockInput(input);
      return run((database, now) => createBlock(database, newId(), planDate, clean, now))
        ? null
        : SAVE_ERROR;
    },
    [run],
  );

  const editBlock = useCallback(
    (id: string, input: PlanBlockInput) => {
      const problem = validateBlock(input);
      if (problem) return problem;
      const clean = cleanBlockInput(input);
      return run((database, now) => updateBlock(database, id, clean, now)) ? null : SAVE_ERROR;
    },
    [run],
  );

  const removeBlock = useCallback(
    (id: string) => {
      run((database, now) => deleteBlock(database, id, now));
    },
    [run],
  );

  const reload = useCallback(() => {
    if (!db) return;
    setFocusRows(listFocus(db));
    setBlocks(listBlocks(db));
  }, [db]);

  const value = useMemo(
    () => ({ focus, blocks, error, setFocus, addBlock, editBlock, removeBlock, reload }),
    [focus, blocks, error, setFocus, addBlock, editBlock, removeBlock, reload],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerValue {
  return useContext(PlannerContext);
}
