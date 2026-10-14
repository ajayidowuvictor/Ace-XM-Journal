import { Pressable, StyleSheet, View } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import { Text, minTouchTarget, radius, spacing } from '../../ui';
import { PRIORITY_LABELS, type Task } from './types';

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
    task.dueDate ? `${overdue ? 'Overdue, ' : ''}${formatShortDate(task.dueDate)}` : null,
    task.priority > 0 ? `${PRIORITY_LABELS[task.priority]} priority` : null,
  ].filter((part): part is string => part !== null);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Mark "${task.title}" as ${done ? 'not done' : 'done'}`}
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
          <Text variant="caption" tone={overdue && !done ? 'danger' : undefined} muted={!overdue}>
            {details.join('  ·  ')}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
  body: { flex: 1, minHeight: minTouchTarget, justifyContent: 'center', paddingVertical: spacing.xs },
  doneTitle: { textDecorationLine: 'line-through' },
});
