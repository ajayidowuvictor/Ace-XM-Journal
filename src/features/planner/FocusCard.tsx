import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Checkbox, EmptyState, Text, spacing } from '../../ui';
import { MAX_FOCUS } from './types';
import type { Task } from '../tasks/types';

type Props = {
  tasks: readonly Task[];
  onToggle: (task: Task, completed: boolean) => void;
  onOpen: (task: Task) => void;
  onRemove: (task: Task) => void;
  onAdd: () => void;
};

/** The few things that matter most for the day (up to three). */
export function FocusCard({ tasks, onToggle, onOpen, onRemove, onAdd }: Props) {
  return (
    <Card>
      {tasks.length === 0 ? (
        <EmptyState
          title="What matters most?"
          message="Choose up to three things. Everything else can wait."
          actionLabel="Choose your focus"
          onAction={onAdd}
        />
      ) : (
        <>
          {tasks.map((task) => {
            const done = task.completedAt !== null;
            return (
              <View key={task.id} style={styles.row}>
                <Checkbox
                  checked={done}
                  accessibilityLabel={`Mark "${task.title}" as ${done ? 'not done' : 'done'}`}
                  onChange={(completed) => onToggle(task, completed)}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit "${task.title}"`}
                  onPress={() => onOpen(task)}
                  style={styles.body}
                >
                  <Text variant="subheading" muted={done} style={done ? styles.done : undefined}>
                    {task.title}
                  </Text>
                </Pressable>
                <Button
                  label="Remove"
                  variant="ghost"
                  size="compact"
                  accessibilityHint={`Takes "${task.title}" off today's focus`}
                  onPress={() => onRemove(task)}
                />
              </View>
            );
          })}
          {tasks.length < MAX_FOCUS ? (
            <Button label="Add another" variant="secondary" size="compact" onPress={onAdd} />
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  body: { flex: 1, minHeight: 44, justifyContent: 'center' },
  done: { textDecorationLine: 'line-through' },
});
