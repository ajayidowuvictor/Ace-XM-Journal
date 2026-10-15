import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Text, minTouchTarget, radius, spacing } from '../../ui';
import { currentStreak, longestStreak } from './logic';
import type { Habit } from './types';

type Props = {
  habit: Habit;
  today: string;
  onToggle: (done: boolean) => void;
  /** When given, tapping the name opens the editor. */
  onOpen?: () => void;
  showStreak?: boolean;
};

export function HabitRow({ habit, today, onToggle, onOpen, showStreak = true }: Props) {
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
    </View>
  );

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Mark "${habit.name}" as ${done ? 'not done' : 'done'} today`}
        accessibilityState={{ checked: done }}
        onPress={() => onToggle(!done)}
        style={styles.checkArea}
      >
        <View
          style={[
            styles.box,
            { borderColor: colors.primary, backgroundColor: done ? colors.primary : 'transparent' },
          ]}
        >
          {done ? <Text style={{ color: colors.onPrimary }}>✓</Text> : null}
        </View>
      </Pressable>
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
  checkArea: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { minHeight: minTouchTarget, justifyContent: 'center', paddingVertical: spacing.xs },
});
