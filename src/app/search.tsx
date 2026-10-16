import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGoalEditor } from '@/features/goals/useGoalEditor';
import { useGoals } from '@/features/goals/GoalsContext';
import { useHabitEditor } from '@/features/habits/useHabitEditor';
import { useHabits } from '@/features/habits/HabitsContext';
import { useJournal } from '@/features/journal/JournalContext';
import { useNotes } from '@/features/notes/NotesContext';
import {
  MIN_QUERY_LENGTH,
  searchAll,
  searchTerms,
  totalHits,
  type SearchHit,
} from '@/features/search/logic';
import { useTaskEditor } from '@/features/tasks/useTaskEditor';
import { useTasks } from '@/features/tasks/TasksContext';
import { Button, Card, PressableScale, Screen, Text, TextField, spacing } from '@/ui';

export default function SearchScreen() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { habits } = useHabits();
  const { allEntries, status: journalStatus } = useJournal();
  const { notes } = useNotes();
  const taskEditor = useTaskEditor();
  const goalEditor = useGoalEditor();
  const habitEditor = useHabitEditor();
  const [query, setQuery] = useState('');

  const groups = searchAll({ tasks, goals, habits, entries: allEntries, notes }, query);
  const searching = searchTerms(query).length > 0;
  const count = totalHits(groups);

  function open(hit: SearchHit) {
    switch (hit.kind) {
      case 'task': {
        const task = tasks.find((item) => item.id === hit.id);
        if (task) taskEditor.open(task);
        break;
      }
      case 'goal':
        goalEditor.open(hit.id);
        break;
      case 'habit': {
        const habit = habits.find((item) => item.id === hit.id);
        if (habit) habitEditor.open(habit);
        break;
      }
      case 'entry':
        router.push({ pathname: '/entry', params: { id: hit.id } });
        break;
      case 'note':
        router.push({ pathname: '/read', params: { id: hit.id } });
        break;
    }
  }

  return (
    <Screen>
      <Button label="Back" variant="ghost" onPress={() => router.back()} style={styles.back} />
      <Text variant="title">Search</Text>

      <TextField
        label="Search everything"
        value={query}
        onChangeText={setQuery}
        placeholder="Tasks, goals, habits, journal, notes"
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
      />

      {journalStatus !== 'ready' ? (
        <Text variant="caption" muted>
          {journalStatus === 'loading'
            ? 'Your journal and notes are still opening. Search again in a moment to include them.'
            : 'Your journal and notes could not be opened, so they are left out.'}
        </Text>
      ) : null}

      {!searching ? (
        <Text muted>
          {query.trim().length > 0
            ? `Type at least ${MIN_QUERY_LENGTH} letters.`
            : 'Type a word to look through everything at once. Searching stays on your phone.'}
        </Text>
      ) : count === 0 ? (
        <Text muted accessibilityLiveRegion="polite">
          Nothing found. Try a different word.
        </Text>
      ) : (
        <Text variant="caption" muted accessibilityLiveRegion="polite">
          {count === 1 ? '1 result' : `${count} results`}
        </Text>
      )}

      {groups.map((group) => (
        <View key={group.kind} style={styles.group}>
          <Text variant="subheading">{group.label}</Text>
          {group.hits.map((hit) => (
            <PressableScale
              key={`${hit.kind}-${hit.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.label.toLowerCase()} result: ${hit.title}`}
              onPress={() => open(hit)}
            >
              <Card>
                <Text numberOfLines={2}>{hit.title}</Text>
                {hit.detail ? (
                  <Text variant="secondary" muted numberOfLines={3}>
                    {hit.detail}
                  </Text>
                ) : null}
              </Card>
            </PressableScale>
          ))}
          {group.total > group.hits.length ? (
            <Text variant="caption" muted>
              {`Showing ${group.hits.length} of ${group.total}. Add a word to narrow it down.`}
            </Text>
          ) : null}
        </View>
      ))}

      {taskEditor.element}
      {goalEditor.element}
      {habitEditor.element}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start' },
  group: { gap: spacing.sm },
});
