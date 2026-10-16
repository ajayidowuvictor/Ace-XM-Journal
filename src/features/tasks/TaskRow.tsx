import { Pressable, StyleSheet, View } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import { Checkbox, Text, minTouchTarget, radius, spacing } from '../../ui';
import { CATEGORY_LABELS, PRIORITY_LABELS, REPEAT_LABELS, type Task } from './types';

type Props = {
  task: Task;
  overdue?: boolean;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
};

export function TaskRow({ task, overdue = false, onToggle, onOpen }: Props) {
  const { colors } = useTheme();
  const done = task.completedAt !== null;
  const details = [
    task.dueDate ? `${overdue ? 'From ' : ''}${formatShortDate(task.dueDate)}` : null,
    task.reminderTime && task.dueDate ? `Reminder ${task.reminderTime}` : null,
    task.repeat !== 'none' ? REPEAT_LABELS[task.repeat].replace('Every ', 'Repeats ') : null,
    task.priority > 0 ? `${PRIORITY_LABELS[task.priority]} priority` : null,
  ].filter((part): part is string => part !== null);

  return (
    <View style={styles.row}>
      <Checkbox
        checked={done}
        accessibilityLabel={`Mark "${task.title}" as ${done ? 'not done' : 'done'}`}
        onChange={onToggle}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit "${task.title}"`}
        onPress={onOpen}
        style={styles.body}
      >
        <Text style={done ? styles.doneTitle : undefined} muted={done}>
          {task.title}
        </Text>
        {task.category !== 'none' ? (
          <View
            style={[
              styles.category,
              {
                backgroundColor:
                  task.category === 'health'
                    ? colors.successTint
                    : task.category === 'deep'
                      ? colors.primaryTint
                      : colors.surfaceMuted,
              },
            ]}
          >
            <Text
              variant="caption"
              tone={
                task.category === 'health'
                  ? 'success'
                  : task.category === 'deep'
                    ? 'primary'
                    : undefined
              }
              muted={task.category === 'routine' || task.category === 'personal'}
            >
              {CATEGORY_LABELS[task.category]}
            </Text>
          </View>
        ) : null}
        {details.length > 0 ? (
          <Text variant="caption" tone={overdue && !done ? 'primary' : undefined} muted={!overdue}>
            {details.join('  ·  ')}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  body: {
    flex: 1,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  category: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  doneTitle: { textDecorationLine: 'line-through' },
});
