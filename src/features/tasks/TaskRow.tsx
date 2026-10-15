import { Pressable, StyleSheet, View } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { Checkbox, Text, minTouchTarget, spacing } from '../../ui';
import { PRIORITY_LABELS, type Task } from './types';

type Props = {
  task: Task;
  overdue?: boolean;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
};

export function TaskRow({ task, overdue = false, onToggle, onOpen }: Props) {
  const done = task.completedAt !== null;
  const details = [
    task.dueDate ? `${overdue ? 'From ' : ''}${formatShortDate(task.dueDate)}` : null,
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
  doneTitle: { textDecorationLine: 'line-through' },
});
