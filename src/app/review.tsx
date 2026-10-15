import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useGoals } from '@/features/goals/GoalsContext';
import { useHabits } from '@/features/habits/HabitsContext';
import { useJournal } from '@/features/journal/JournalContext';
import { reviewEntryBody, summaryLines, weeklySummary } from '@/features/review/logic';
import { useTasks } from '@/features/tasks/TasksContext';
import { formatShortDate, toLocalDateString } from '@/lib/dates';
import { Button, Card, Screen, Text, TextField } from '@/ui';

export default function ReviewScreen() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { allEntries, create, status } = useJournal();
  const [reflection, setReflection] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const summary = weeklySummary(
    { tasks, habits, goals, entries: allEntries },
    toLocalDateString(new Date()),
  );

  function saveToJournal() {
    const id = create({
      title: `Weekly review: ${formatShortDate(summary.start)} to ${formatShortDate(summary.end)}`,
      body: reviewEntryBody(summary, reflection),
      mood: null,
      tags: ['weekly review'],
    });
    if (id) {
      setSaved(true);
      setNote('Saved to your journal.');
    } else {
      setNote('Could not save to your journal. Please try again.');
    }
  }

  return (
    <Screen>
      <Button label="Back" variant="ghost" onPress={() => router.back()} />
      <Text variant="title">Weekly review</Text>
      <Text muted>
        {formatShortDate(summary.start)} to {formatShortDate(summary.end)}
      </Text>

      <Card>
        {summaryLines(summary).map((line) => (
          <Text key={line}>{line}</Text>
        ))}
      </Card>

      <TextField
        label="What went well, and what will you change next week?"
        value={reflection}
        onChangeText={setReflection}
        multiline
        textAlignVertical="top"
        placeholder="Write a few lines"
      />

      <Button
        label={saved ? 'Saved' : 'Save to my journal'}
        disabled={saved || status !== 'ready'}
        onPress={saveToJournal}
      />
      {note ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}
      {status !== 'ready' ? (
        <Text variant="caption" muted>
          Your journal is not available right now, so the review cannot be saved.
        </Text>
      ) : null}
    </Screen>
  );
}
