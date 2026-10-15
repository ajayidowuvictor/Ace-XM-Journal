import { useState } from 'react';

import { GoalsPanel } from '@/features/goals/GoalsPanel';
import { HabitRow } from '@/features/habits/HabitRow';
import { useHabits } from '@/features/habits/HabitsContext';
import { useHabitEditor } from '@/features/habits/useHabitEditor';
import { todaySummary } from '@/features/habits/logic';
import { toLocalDateString } from '@/lib/dates';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  type SegmentOption,
} from '@/ui';

type Section = 'habits' | 'goals';

const SECTIONS: readonly SegmentOption<Section>[] = [
  { value: 'habits', label: 'Habits' },
  { value: 'goals', label: 'Goals' },
];

export default function HabitsScreen() {
  const [section, setSection] = useState<Section>('habits');

  return (
    <Screen title="Habits and goals">
      <SegmentedControl
        accessibilityLabel="Show habits or goals"
        options={SECTIONS}
        value={section}
        onChange={setSection}
      />
      {section === 'habits' ? <HabitsPanel /> : <GoalsPanel />}
    </Screen>
  );
}

function HabitsPanel() {
  const { habits, error, setDoneToday } = useHabits();
  const editor = useHabitEditor();
  const today = toLocalDateString(new Date());
  const summary = todaySummary(habits, today);

  return (
    <>
      <Button label="New habit" onPress={() => editor.open(null)} />

      {error ? <ErrorState message={error} /> : null}

      {habits.length === 0 && !error ? (
        <EmptyState
          title="No habits yet"
          message="Add a habit you want to repeat every day, then tick it off as you go."
          actionLabel="Add a habit"
          onAction={() => editor.open(null)}
        />
      ) : null}

      {habits.length > 0 ? (
        <Card>
          <Text variant="heading">Today</Text>
          <Text muted>
            {summary.done} of {summary.total} done
          </Text>
          <ProgressBar
            value={summary.progress}
            accessibilityLabel={`${summary.done} of ${summary.total} habits done today`}
          />
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              today={today}
              onToggle={(done) => setDoneToday(habit.id, done)}
              onOpen={() => editor.open(habit)}
            />
          ))}
        </Card>
      ) : null}

      {editor.element}
    </>
  );
}
