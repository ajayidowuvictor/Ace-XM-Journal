import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { openJournalDatabase } from '../../db/journalDatabase';
import { createEntry, deleteEntry, listEntries, updateEntry } from '../../db/journalRepo';
import type { SqlDatabase } from '../../db/types';
import { toLocalDateString } from '../../lib/dates';
import { newId } from '../../lib/id';
import type { EntryInput, JournalEntry } from './types';

type Status = 'loading' | 'ready' | 'error';

type JournalValue = {
  status: Status;
  /** Entries matching the current search (all entries when the search is empty). */
  entries: JournalEntry[];
  query: string;
  setQuery: (query: string) => void;
  findEntry: (id: string) => JournalEntry | null;
  /** Saves a new entry for today. Returns its id, or null if it could not be saved. */
  create: (input: EntryInput) => string | null;
  /** Returns true when saved. */
  save: (id: string, input: EntryInput) => boolean;
  remove: (id: string) => boolean;
};

const JournalContext = createContext<JournalValue>({
  status: 'loading',
  entries: [],
  query: '',
  setQuery: () => {},
  findEntry: () => null,
  create: () => null,
  save: () => false,
  remove: () => false,
});

export function JournalProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SqlDatabase | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [query, setQueryState] = useState('');

  useEffect(() => {
    let cancelled = false;
    openJournalDatabase()
      .then((opened) => {
        if (cancelled) return;
        setDb(opened);
        setEntries(listEntries(opened));
        setStatus('ready');
      })
      .catch(() => {
        // The reason is not logged: it could be tied to private data. The screen explains it.
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setQuery = useCallback(
    (next: string) => {
      setQueryState(next);
      if (db) setEntries(listEntries(db, next));
    },
    [db],
  );

  const change = useCallback(
    (work: (database: SqlDatabase, nowIso: string) => void): boolean => {
      if (!db) return false;
      try {
        work(db, new Date().toISOString());
        setEntries(listEntries(db, query));
        return true;
      } catch {
        return false;
      }
    },
    [db, query],
  );

  const findEntry = useCallback(
    (id: string) => (db ? (listEntries(db).find((entry) => entry.id === id) ?? null) : null),
    [db],
  );

  const create = useCallback(
    (input: EntryInput) => {
      const id = newId();
      const date = toLocalDateString(new Date());
      return change((database, now) => createEntry(database, id, date, input, now)) ? id : null;
    },
    [change],
  );

  const save = useCallback(
    (id: string, input: EntryInput) =>
      change((database, now) => updateEntry(database, id, input, now)),
    [change],
  );

  const remove = useCallback(
    (id: string) => change((database, now) => deleteEntry(database, id, now)),
    [change],
  );

  const value = useMemo(
    () => ({ status, entries, query, setQuery, findEntry, create, save, remove }),
    [status, entries, query, setQuery, findEntry, create, save, remove],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal(): JournalValue {
  return useContext(JournalContext);
}
