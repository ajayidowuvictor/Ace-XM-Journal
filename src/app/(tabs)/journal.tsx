import { useRouter } from 'expo-router';
import { useState } from 'react';

import { EntryCard } from '@/features/journal/EntryCard';
import { useJournal } from '@/features/journal/JournalContext';
import { NotesView } from '@/features/notes/NotesView';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SegmentedControl,
  TextField,
  type SegmentOption,
} from '@/ui';

type Section = 'journal' | 'notes';

const SECTIONS: readonly SegmentOption<Section>[] = [
  { value: 'journal', label: 'Journal' },
  { value: 'notes', label: 'Notes' },
];

export default function JournalScreen() {
  const router = useRouter();
  const { status, entries, query, setQuery } = useJournal();
  const [section, setSection] = useState<Section>('journal');
  const searching = query.trim().length > 0;

  return (
    <Screen title={section === 'journal' ? 'Journal' : 'Notes'}>
      {status === 'loading' ? <LoadingState label="Unlocking your journal" /> : null}
      {status === 'error' ? (
        <ErrorState message="Your journal could not be unlocked on this device. Nothing has been deleted. Close the app and open it again; if this keeps happening, do not reinstall the app, because that would erase the journal and your notes." />
      ) : null}

      {status === 'ready' ? (
        <>
          <SegmentedControl<Section>
            accessibilityLabel="Journal or notes"
            options={SECTIONS}
            value={section}
            onChange={setSection}
          />

          {section === 'notes' ? (
            <NotesView />
          ) : (
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
          )}
        </>
      ) : null}
    </Screen>
  );
}
