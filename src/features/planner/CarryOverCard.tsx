import { StyleSheet, View } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { Button, Card, Text, spacing } from '../../ui';
import type { Task } from '../tasks/types';

type Props = {
  tasks: readonly Task[];
  onMove: (task: Task, to: 'today' | 'tomorrow') => void;
};

const MAX_SHOWN = 3;

/**
 * Open tasks from earlier days. They are shown calmly, as a question about what still matters,
 * never as overdue warnings.
 */
export function CarryOverCard({ tasks, onMove }: Props) {
  if (tasks.length === 0) return null;
  const shown = tasks.slice(0, MAX_SHOWN);
  const hidden = tasks.length - shown.length;

  return (
    <Card variant="inset">
      <Text variant="subheading">Still waiting from earlier</Text>
      <Text variant="secondary" muted>
        Move what still matters. The rest can stay in your list.
      </Text>
      {shown.map((task) => (
        <View key={task.id} style={styles.row}>
          <View style={styles.body}>
            <Text>{task.title}</Text>
            {task.dueDate ? (
              <Text variant="caption" muted>
                Was due {formatShortDate(task.dueDate)}
              </Text>
            ) : null}
          </View>
          <Button
            label="Today"
            accessibilityLabel={`Move "${task.title}" to today`}
            variant="secondary"
            size="compact"
            onPress={() => onMove(task, 'today')}
          />
          <Button
            label="Tomorrow"
            accessibilityLabel={`Move "${task.title}" to tomorrow`}
            variant="ghost"
            size="compact"
            onPress={() => onMove(task, 'tomorrow')}
          />
        </View>
      ))}
      {hidden > 0 ? (
        <Text variant="caption" muted>
          {hidden} more in the Tasks tab.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: spacing.xs },
  body: { flex: 1, gap: 2 },
});
