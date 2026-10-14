import { useRouter } from 'expo-router';

import { EntryCard } from '@/features/journal/EntryCard';
import { useJournal } from '@/features/journal/JournalContext';
import { Button, EmptyState, ErrorState, LoadingState, Screen, TextField } from '@/ui';

export default function JournalScreen() {
  const router = useRouter();
  const { status, entries, query, setQuery } = useJournal();
  const searching = query.trim().length > 0;

  return (
    <Screen title="Journal">
      {status === 'loading' ? <LoadingState label="Unlocking your journal" /> : null}
      {status === 'error' ? (
        <ErrorState message="Your journal could not be unlocked on this device. Nothing has been deleted. Close the app and open it again; if this keeps happening, do not reinstall the app, because that would erase the journal." />
      ) : null}

      {status === 'ready' ? (
        <>
          <Button label="New entry" onPress={() => router.push('/entry')} />
          <TextField
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Words, titles or tags"
            autoCapitalize="none"
            returnKeyType="search"
          />

          {entries.length === 0 ? (
            <EmptyState
              title={searching ? 'No matches' : 'Your journal is empty'}
              message={
                searching
                  ? 'Try different words, or clear the search.'
                  : 'Write your first entry. It is encrypted and stays on this device.'
              }
            />
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onOpen={() => router.push({ pathname: '/entry', params: { id: entry.id } })}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}
