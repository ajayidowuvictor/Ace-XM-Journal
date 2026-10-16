import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EntryEditor } from '@/features/journal/EntryEditor';
import { useJournal } from '@/features/journal/JournalContext';
import { ErrorState, LoadingState, Screen } from '@/ui';

export default function EntryScreen() {
  const { id, title, prompt } = useLocalSearchParams<{
    id?: string;
    title?: string;
    prompt?: string;
  }>();
  const { status, findEntry } = useJournal();

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState label="Unlocking your journal" />
      </Screen>
    );
  }

  return status === 'ready' ? (
    <Loaded id={id ?? null} findEntry={findEntry} title={title} prompt={prompt} />
  ) : (
    <Screen>
      <ErrorState message="Your journal could not be unlocked on this device." />
    </Screen>
  );
}

function Loaded({
  id,
  findEntry,
  title,
  prompt,
}: {
  id: string | null;
  findEntry: ReturnType<typeof useJournal>['findEntry'];
  title?: string;
  prompt?: string;
}) {
  // Read once so the editor keeps its own text while the user types.
  const [entry] = useState(() => (id ? findEntry(id) : null));

  if (id && !entry) {
    return (
      <Screen>
        <ErrorState message="This entry could not be found." />
      </Screen>
    );
  }
  return <EntryEditor entry={entry} initialTitle={title} bodyPrompt={prompt} />;
}
