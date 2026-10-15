import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useGoals } from '@/features/goals/GoalsContext';
import { useHabits } from '@/features/habits/HabitsContext';
import { useJournal } from '@/features/journal/JournalContext';
import {
  REVIEW_TAG,
  findExistingReview,
  reflectionFrom,
  reviewEntryBody,
  summaryLines,
  weeklySummary,
} from '@/features/review/logic';
import { useTasks } from '@/features/tasks/TasksContext';
import { formatShortDate, toLocalDateString } from '@/lib/dates';
import { Button, Card, Screen, Text, TextField } from '@/ui';

export default function ReviewScreen() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { allEntries, create, save, status } = useJournal();
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const summary = weeklySummary(
    { tasks, habits, goals, entries: allEntries },
    toLocalDateString(new Date()),
  );
  const title = `Weekly review: ${formatShortDate(summary.start)} to ${formatShortDate(summary.end)}`;
  const existing = findExistingReview(allEntries, title);
  const [reflection, setReflection] = useState(() => (existing ? reflectionFrom(existing.body) : ''));

  function saveToJournal() {
    const body = reviewEntryBody(summary, reflection);
    const done = existing
      ? save(existing.id, { title, body, mood: existing.mood, tags: existing.tags })
      : create({ title, body, mood: null, tags: [REVIEW_TAG] }) !== null;
    if (done) {
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
        onChangeText={(text) => {
          setReflection(text);
          setSaved(false);
          setNote(null);
        }}
        multiline
        textAlignVertical="top"
        placeholder="Write a few lines"
      />

      <Button
        label={saved ? 'Saved' : existing ? 'Update my review' : 'Save to my journal'}
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
