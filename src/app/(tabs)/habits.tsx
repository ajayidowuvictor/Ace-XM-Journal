import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GoalsPanel } from '@/features/goals/GoalsPanel';
import { HabitRow } from '@/features/habits/HabitRow';
import { useHabits } from '@/features/habits/HabitsContext';
import { useHabitEditor } from '@/features/habits/useHabitEditor';
import { todaySummary, weekConsistency } from '@/features/habits/logic';
import { toLocalDateString } from '@/lib/dates';
import { useTheme } from '@/theme/context';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  maxFontScale,
  radius,
  spacing,
  type SegmentOption,
} from '@/ui';

type Section = 'habits' | 'goals';

const SECTIONS: readonly SegmentOption<Section>[] = [
  { value: 'habits', label: 'Daily habits' },
  { value: 'goals', label: 'Goals' },
];

export default function HabitsScreen() {
  const [section, setSection] = useState<Section>('habits');

  return (
    <Screen title="Habits and goals" header={<AppHeader section="Habits and goals" />}>
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
  const week = weekConsistency(habits, today);
  const { colors } = useTheme();

  return (
    <>
      <Button label="New habit" onPress={() => editor.open(null)} />

      {error ? <ErrorState message={error} /> : null}

      {habits.length === 0 && !error ? (
        <EmptyState
          title="No habits yet"
          message="Add a habit and choose the days it repeats on, then tick it off as you go."
          actionLabel="Add a habit"
          onAction={() => editor.open(null)}
        />
      ) : null}

      {habits.length > 0 ? (
        <Card>
          <View style={styles.weekHead}>
            <View>
              <Text variant="caption" muted>
                THIS WEEK
              </Text>
              <Text variant="heading">Weekly consistency</Text>
            </View>
            <Text
              variant="title"
              tone="success"
              accessibilityLabel={`${Math.round(week.rate * 100)} percent`}
            >
              {`${Math.round(week.rate * 100)}%`}
            </Text>
          </View>
          <ProgressBar
            value={week.rate}
            accessibilityLabel={`${week.done} of ${week.possible} habit check-ins this week`}
          />
          <View style={styles.weekDays}>
            {week.days.map((day) => (
              <View
                key={day.date}
                accessible
                accessibilityLabel={`${day.date}: ${
                  day.status === 'all'
                    ? 'all habits done'
                    : day.status === 'some'
                      ? 'some habits done'
                      : day.status === 'none'
                        ? 'no habits done'
                        : day.status === 'rest'
                          ? 'no habits planned'
                          : 'not yet'
                }`}
                style={styles.weekDay}
              >
                <Text variant="caption" muted>
                  {day.label}
                </Text>
                <View
                  style={[
                    styles.weekCircle,
                    {
                      backgroundColor:
                        day.status === 'all'
                          ? colors.success
                          : day.status === 'some'
                            ? colors.successTint
                            : colors.surfaceMuted,
                      borderColor: day.isToday ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    maxFontSizeMultiplier={maxFontScale.glyph}
                    style={{ color: day.status === 'all' ? colors.onPrimary : colors.textMuted }}
                  >
                    {day.status === 'all' ? '✓' : day.status === 'some' ? '•' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
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
              showWeek
            />
          ))}
        </Card>
      ) : null}

      {editor.element}
    </>
  );
}

const styles = StyleSheet.create({
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.xs },
  weekDay: { alignItems: 'center', gap: spacing.xs },
  weekCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
