import { useLocalSearchParams } from 'expo-router';

import { useJournal } from '@/features/journal/JournalContext';
import { ReadingView } from '@/features/notes/ReadingView';
import { useNotes } from '@/features/notes/NotesContext';
import { ErrorState, LoadingState, Screen } from '@/ui';

export default function ReadScreen() {
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  const { status } = useJournal();
  const { ready, findNote } = useNotes();

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

  // Read on every render, so the view always shows the latest saved text.
  const note = id ? findNote(id) : null;
  if (!note) {
    return (
      <Screen>
        <ErrorState message="This note could not be found." />
      </Screen>
    );
  }
  return <ReadingView note={note} fromEditor={from === 'editor'} />;
}
