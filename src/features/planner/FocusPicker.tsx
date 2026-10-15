import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import { Button, EmptyState, PressableScale, Text, TextField, radius, spacing } from '../../ui';
import type { Task } from '../tasks/types';

type Props = {
  visible: boolean;
  /** Tasks to choose from, best first. */
  candidates: readonly Task[];
  /** How many more focus tasks can still be added. */
  spotsLeft: number;
  onPick: (task: Task) => void;
  /** Creates a new task for the day and focuses it. Returns an error message, or null when done. */
  onCreate: (title: string) => string | null;
  onClose: () => void;
};

const MAX_SHOWN = 30;

/** A sheet for choosing what to focus on: pick an existing task, or write something new. */
export function FocusPicker({ visible, candidates, spotsLeft, onPick, onCreate, onClose }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  function create() {
    const problem = onCreate(title);
    if (problem) {
      setError(problem);
    } else {
      setTitle('');
      setError(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="title">Choose your focus</Text>
          <Text muted>
            {spotsLeft > 0
              ? `Pick up to ${spotsLeft} more. Fewer is better.`
              : 'You have chosen three. Remove one to choose another.'}
          </Text>

          {spotsLeft > 0 ? (
            <>
              <View style={styles.group}>
                <TextField
                  label="Something new"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setError(null);
                  }}
                  error={error ?? undefined}
                  placeholder="What matters most today?"
                  returnKeyType="done"
                />
                <Button label="Add and focus" onPress={create} />
              </View>

              <Text variant="heading">Or choose a task</Text>
              {candidates.length === 0 ? (
                <EmptyState
                  title="No open tasks"
                  message="Write something above, or add tasks in the Tasks tab."
                />
              ) : (
                candidates.slice(0, MAX_SHOWN).map((task) => (
                  <PressableScale
                    key={task.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Focus on "${task.title}"`}
                    scaleTo={0.98}
                    onPress={() => onPick(task)}
                    style={[styles.task, { backgroundColor: colors.surface }]}
                  >
                    <Text variant="subheading">{task.title}</Text>
                    <Text variant="caption" muted>
                      {task.dueDate ? `Due ${formatShortDate(task.dueDate)}` : 'No date'}
                    </Text>
                  </PressableScale>
                ))
              )}
            </>
          ) : null}

          <Button label="Done" variant="secondary" onPress={onClose} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md },
  group: { gap: spacing.sm },
  task: { borderRadius: radius.lg, padding: spacing.md, gap: 2 },
});
