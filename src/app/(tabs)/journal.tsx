import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { EntryCard } from '@/features/journal/EntryCard';
import { useJournal } from '@/features/journal/JournalContext';
import { entriesOnDay, recentDays } from '@/features/journal/logic';
import { NotesView } from '@/features/notes/NotesView';
import { parseLocalDate, toLocalDateString } from '@/lib/dates';
import { useTheme } from '@/theme/context';
import {
  AppHeader,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SegmentedControl,
  StatusPill,
  Text,
  TextField,
  minTouchTarget,
  radius,
  spacing,
  type SegmentOption,
} from '@/ui';

type Section = 'journal' | 'notes';

const SECTIONS: readonly SegmentOption<Section>[] = [
  { value: 'journal', label: 'Journal' },
  { value: 'notes', label: 'Notes' },
];

export default function JournalScreen() {
  const router = useRouter();
  const { status, entries, allEntries, query, setQuery } = useJournal();
  const [section, setSection] = useState<Section>('journal');
  const [day, setDay] = useState<string | null>(null);
  const searching = query.trim().length > 0;
  const today = toLocalDateString(new Date());
  const shown = entriesOnDay(entries, day);
  const showNewEntry = status === 'ready' && section === 'journal';

  return (
    <Screen
      title={section === 'journal' ? 'Journal' : 'Notes'}
      header={
        <AppHeader
          section={section === 'journal' ? 'Journal' : 'Notes'}
          right={
            status === 'ready' ? (
              <StatusPill
                label="Encrypted"
                accessibilityLabel="Your journal and notes are encrypted on this device"
              />
            ) : undefined
          }
        />
      }
      floating={
        showNewEntry ? (
          <Button label="+  New entry" onPress={() => router.push('/entry')} />
        ) : undefined
      }
    >
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
              <Text variant="secondary" muted>
                {`${allEntries.length} ${allEntries.length === 1 ? 'entry' : 'entries'}, encrypted on this device`}
              </Text>

              <TextField
                label="Search"
                value={query}
                onChangeText={setQuery}
                placeholder="Words, titles or tags"
                autoCapitalize="none"
                returnKeyType="search"
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.days}
                accessibilityLabel="Filter by day"
              >
                <DayChip
                  label="All"
                  sub=""
                  selected={day === null}
                  onPress={() => setDay(null)}
                  accessibilityLabel="Show every day"
                />
                {recentDays(today)
                  .reverse()
                  .map((date) => {
                    const parsed = parseLocalDate(date);
                    const weekday = parsed
                      ? parsed.toLocaleDateString(undefined, { weekday: 'short' })
                      : date;
                    return (
                      <DayChip
                        key={date}
                        label={weekday}
                        sub={parsed ? String(parsed.getDate()) : ''}
                        selected={day === date}
                        onPress={() => setDay(day === date ? null : date)}
                        accessibilityLabel={`Show entries from ${date}`}
                      />
                    );
                  })}
              </ScrollView>

              {shown.length === 0 ? (
                <EmptyState
                  title={searching || day ? 'No matches' : 'Your journal is empty'}
                  message={
                    searching || day
                      ? 'Try different words or another day, or clear the filters.'
                      : 'Write your first entry. It is encrypted and stays on this device.'
                  }
                />
              ) : (
                shown.map((entry) => (
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

function DayChip({
  label,
  sub,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.day, { backgroundColor: selected ? colors.primary : colors.surface }]}
    >
      <Text variant="caption" style={{ color: selected ? colors.onPrimary : colors.textMuted }}>
        {label}
      </Text>
      {sub ? (
        <Text variant="subheading" style={{ color: selected ? colors.onPrimary : colors.text }}>
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  days: { gap: spacing.sm, paddingVertical: spacing.xs },
  day: {
    minWidth: 56,
    minHeight: minTouchTarget + spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
