import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useGoals } from '@/features/goals/GoalsContext';
import { useHabits } from '@/features/habits/HabitsContext';
import {
  habitRates,
  moodWords,
  scaleMax,
  weeklyTrends,
  writingDays,
  writingStreak,
} from '@/features/insights/logic';
import { useJournal } from '@/features/journal/JournalContext';
import { useTasks } from '@/features/tasks/TasksContext';
import { formatShortDate, toLocalDateString } from '@/lib/dates';
import { useTheme } from '@/theme/context';
import { Button, Card, ProgressBar, Screen, Text, radius, spacing } from '@/ui';

const BAR_HEIGHT = 10;

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { allEntries, status } = useJournal();

  const today = toLocalDateString(new Date());
  const trends = weeklyTrends({ tasks, habits, goals, entries: allEntries }, today);
  const taskMax = scaleMax(trends.map((week) => week.tasksCompleted));
  const rates = habitRates(habits, today);
  const moods = trends.filter((week) => week.averageMood !== null);
  const totalDone = tasks.filter((task) => task.completedAt).length;
  const goalsAchieved = goals.filter((goal) => goal.completedAt).length;

  return (
    <Screen>
      <Button label="Back" variant="ghost" onPress={() => router.back()} style={styles.back} />
      <Text variant="title">Insights</Text>
      <Text muted>How the last eight weeks have gone. This is worked out on your phone only.</Text>

      <Card>
        <Text variant="heading">Tasks finished each week</Text>
        {trends.map((week) => (
          <View
            key={week.end}
            accessible
            accessibilityLabel={`Week ending ${formatShortDate(week.end)}: ${week.tasksCompleted} tasks finished`}
            style={styles.barRow}
          >
            <Text variant="caption" muted style={styles.barLabel}>
              {formatShortDate(week.end)}
            </Text>
            <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${(week.tasksCompleted / taskMax) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text variant="caption" style={styles.barValue}>
              {week.tasksCompleted}
            </Text>
          </View>
        ))}
        <Text variant="caption" muted>
          Each row is the 7 days ending on that date.
        </Text>
      </Card>

      <Card>
        <Text variant="heading">Habits, last 30 days</Text>
        {rates.length === 0 ? (
          <Text muted>Add a habit and its progress will show here.</Text>
        ) : (
          rates.map((habit) => (
            <View key={habit.id} style={styles.habit}>
              <Text>{habit.name}</Text>
              <ProgressBar
                value={habit.rate}
                accessibilityLabel={`${habit.name}: done ${habit.done} of the last ${habit.days} days`}
              />
              <Text variant="caption" muted>
                {`${habit.done} of ${habit.days} days  ·  streak ${habit.streak}`}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text variant="heading">Journal</Text>
        {status !== 'ready' ? (
          <Text muted>Your journal is not open, so it is left out.</Text>
        ) : (
          <>
            <Text>{`Wrote on ${writingDays(allEntries, today)} of the last 30 days`}</Text>
            <Text>{`Writing streak: ${writingStreak(allEntries, today)} ${writingStreak(allEntries, today) === 1 ? 'day' : 'days'}`}</Text>
            <Text variant="subheading">Average mood by week</Text>
            {moods.length === 0 ? (
              <Text muted>Pick a mood on your entries and it will show here.</Text>
            ) : (
              moods.map((week) => (
                <View key={week.end} style={styles.moodRow}>
                  <Text variant="caption" muted style={styles.barLabel}>
                    {formatShortDate(week.end)}
                  </Text>
                  <Text>{moodWords(week.averageMood)}</Text>
                </View>
              ))
            )}
          </>
        )}
      </Card>

      <Card>
        <Text variant="heading">So far</Text>
        <Text>{`Tasks finished: ${totalDone}`}</Text>
        <Text>{`Goals achieved: ${goalsAchieved}`}</Text>
        <Text>{`Journal entries: ${allEntries.length}`}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 52 },
  barValue: { width: 28, textAlign: 'right' },
  track: { flex: 1, height: BAR_HEIGHT, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: BAR_HEIGHT, borderRadius: radius.pill },
  habit: { gap: spacing.xs },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
