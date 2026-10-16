import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Checkbox, Text, minTouchTarget, radius, spacing } from '../../ui';
import { currentStreak, lastDaysDone, longestStreak } from './logic';
import type { Habit } from './types';

type Props = {
  habit: Habit;
  today: string;
  onToggle: (done: boolean) => void;
  /** When given, tapping the name opens the editor. */
  onOpen?: () => void;
  showStreak?: boolean;
  /** Shows a small dot for each of the last 7 days, filled when the habit was done. */
  showWeek?: boolean;
};

export function HabitRow({
  habit,
  today,
  onToggle,
  onOpen,
  showStreak = true,
  showWeek = false,
}: Props) {
  const { colors } = useTheme();
  const done = habit.completedDates.includes(today);
  const streak = currentStreak(habit.completedDates, today);
  const best = longestStreak(habit.completedDates);

  const detail = showStreak
    ? streak > 0
      ? `${streak} day${streak === 1 ? '' : 's'} in a row  ·  best ${best}`
      : best > 0
        ? `No streak right now  ·  best ${best}`
        : 'Not started yet'
    : null;

  const body = (
    <View style={styles.body}>
      <Text>{habit.name}</Text>
      {detail ? (
        <Text variant="caption" muted>
          {detail}
        </Text>
      ) : null}
      {showWeek ? (
        <View
          accessible
          accessibilityLabel={`${habit.name}: done on ${lastDaysDone(habit.completedDates, today).filter(Boolean).length} of the last 7 days`}
          style={styles.week}
        >
          {lastDaysDone(habit.completedDates, today).map((done, index) => (
            <View
              key={index}
              style={[styles.dot, { backgroundColor: done ? colors.success : colors.surfaceMuted }]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.row}>
      <Checkbox
        checked={done}
        accessibilityLabel={`Mark "${habit.name}" as ${done ? 'not done' : 'done'} today`}
        onChange={onToggle}
      />
      {onOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit "${habit.name}"`}
          onPress={onOpen}
          style={styles.flex}
        >
          {body}
        </Pressable>
      ) : (
        <View style={styles.flex}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
  week: { flexDirection: 'row', gap: spacing.xs + 2, paddingTop: spacing.xs },
  dot: { width: 12, height: 12, borderRadius: radius.pill },
  body: { minHeight: minTouchTarget, justifyContent: 'center', paddingVertical: spacing.xs },
});
