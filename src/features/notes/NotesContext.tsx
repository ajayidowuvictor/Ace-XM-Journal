import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  createNote,
  createNotebook,
  deleteNote,
  deleteNotebook,
  listNotebooks,
  listNotes,
  renameNotebook,
  updateNote,
} from '../../db/notesRepo';
import type { SqlDatabase } from '../../db/types';
import { newId } from '../../lib/id';
import { useJournal } from '../journal/JournalContext';
import { cleanNotebookName } from './logic';
import type { Note, NoteInput, Notebook } from './types';

type NotesValue = {
  /** True once the encrypted database is open and the notes have been read. */
  ready: boolean;
  notes: Note[];
  notebooks: Notebook[];
  findNote: (id: string) => Note | null;
  /** Saves a new note. Returns its id, or null if it could not be saved. */
  create: (input: NoteInput) => string | null;
  /** Returns true when saved. */
  save: (id: string, input: NoteInput) => boolean;
  /** Erases the note's content for good. Returns true when done. */
  remove: (id: string) => boolean;
  /** Makes a notebook. Returns its id, or null if the name is empty or it could not be saved. */
  addNotebook: (name: string) => string | null;
  /** Returns true when saved. */
  renameNotebook: (id: string, name: string) => boolean;
  /** Deletes a notebook but keeps its notes. Returns true when done. */
  removeNotebook: (id: string) => boolean;
  /** Re-reads everything (used after all data is erased). */
  reload: () => void;
};

const NotesContext = createContext<NotesValue>({
  ready: false,
  notes: [],
  notebooks: [],
  findNote: () => null,
  create: () => null,
  save: () => false,
  remove: () => false,
  addNotebook: () => null,
  renameNotebook: () => false,
  removeNotebook: () => false,
  reload: () => {},
});

type Loaded = { source: SqlDatabase | null; notes: Note[]; notebooks: Notebook[] };

function readAll(source: SqlDatabase | null): Loaded {
  if (!source) return { source, notes: [], notebooks: [] };
  try {
    return { source, notes: listNotes(source), notebooks: listNotebooks(source) };
  } catch {
    // The reason is not logged: it could be tied to private data.
    return { source, notes: [], notebooks: [] };
  }
}

/** Notes live in the same encrypted database as the journal, so they open once it is unlocked. */
export function NotesProvider({ children }: { children: ReactNode }) {
  const { database } = useJournal();
  const [loaded, setLoaded] = useState<Loaded>(() => readAll(null));

  // When the database opens (or changes), read the notes straight away.
  if (loaded.source !== database) {
    setLoaded(readAll(database));
  }

  const run = useCallback(
    (change: (db: SqlDatabase, nowIso: string) => void): boolean => {
      if (!database) return false;
      try {
        change(database, new Date().toISOString());
        setLoaded(readAll(database));
        return true;
      } catch {
        return false;
      }
    },
    [database],
  );

  const findNote = useCallback(
    (id: string) => loaded.notes.find((note) => note.id === id) ?? null,
    [loaded.notes],
  );

  const create = useCallback(
    (input: NoteInput) => {
      const id = newId();
      return run((db, now) => createNote(db, id, input, now)) ? id : null;
    },
    [run],
  );

  const save = useCallback(
    (id: string, input: NoteInput) => run((db, now) => updateNote(db, id, input, now)),
    [run],
  );

  const remove = useCallback((id: string) => run((db, now) => deleteNote(db, id, now)), [run]);

  const addNotebook = useCallback(
    (name: string) => {
      const clean = cleanNotebookName(name);
      if (!clean) return null;
      const id = newId();
      return run((db, now) => createNotebook(db, id, clean, now)) ? id : null;
    },
    [run],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const clean = cleanNotebookName(name);
      if (!clean) return false;
      return run((db, now) => renameNotebook(db, id, clean, now));
    },
    [run],
  );

  const removeNotebook = useCallback(
    (id: string) => run((db, now) => deleteNotebook(db, id, now)),
    [run],
  );

  const reload = useCallback(() => setLoaded(readAll(database)), [database]);

  const value = useMemo(
    () => ({
      ready: database !== null,
      notes: loaded.notes,
      notebooks: loaded.notebooks,
      findNote,
      create,
      save,
      remove,
      addNotebook,
      renameNotebook: rename,
      removeNotebook,
      reload,
    }),
    [
      database,
      loaded.notes,
      loaded.notebooks,
      findNote,
      create,
      save,
      remove,
      addNotebook,
      rename,
      removeNotebook,
      reload,
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesValue {
  return useContext(NotesContext);
}
