import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useJournal } from '@/features/journal/JournalContext';
import { toNoteKind } from '@/features/notes/logic';
import { NoteEditor } from '@/features/notes/NoteEditor';
import { useNotes } from '@/features/notes/NotesContext';
import { ErrorState, LoadingState, Screen } from '@/ui';

export default function NoteScreen() {
  const { id, kind, notebook } = useLocalSearchParams<{
    id?: string;
    kind?: string;
    notebook?: string;
  }>();
  const { status } = useJournal();
  const { ready } = useNotes();

  if (status === 'error') {
    return (
      <Screen>
        <ErrorState message="Your notes could not be unlocked on this device." />
      </Screen>
    );
  }
  if (status === 'loading' || !ready) {
    return (
      <Screen>
        <LoadingState label="Unlocking your notes" />
      </Screen>
    );
  }
  return <Loaded id={id ?? null} kind={kind} notebook={notebook ?? null} />;
}

function Loaded({ id, kind, notebook }: { id: string | null; kind?: string; notebook: string | null }) {
  const { findNote, notebooks } = useNotes();
  // Read once so the editor keeps its own text while the user types.
  const [note] = useState(() => (id ? findNote(id) : null));

  if (id && !note) {
    return (
      <Screen>
        <ErrorState message="This note could not be found." />
      </Screen>
    );
  }
  const startBook = notebook && notebooks.some((book) => book.id === notebook) ? notebook : null;
  return <NoteEditor note={note} initialKind={toNoteKind(kind)} initialNotebookId={startBook} />;
}
