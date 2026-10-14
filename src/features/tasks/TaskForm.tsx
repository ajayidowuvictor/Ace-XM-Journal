import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import {
  Button,
  ConfirmDialog,
  SegmentedControl,
  Text,
  TextField,
  spacing,
  type SegmentOption,
} from '../../ui';
import { choiceFor, dueDateFor, type DueChoice } from './logic';
import type { Priority, Task, TaskInput } from './types';

type Props = {
  visible: boolean;
  /** The task being edited, or null when adding a new one. */
  task: Task | null;
  /** Returns an error message to show, or null when saved. */
  onSave: (input: TaskInput) => string | null;
  onDelete: () => void;
  onClose: () => void;
};

const PRIORITY_OPTIONS: readonly SegmentOption<`${Priority}`>[] = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
];

/** The form opens with a fresh state each time because the screen gives it a new `key`. */
export function TaskForm({ visible, task, onSave, onDelete, onClose }: Props) {
  const { colors } = useTheme();
  const now = new Date();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [startingChoice] = useState<DueChoice>(() => choiceFor(task?.dueDate ?? null, now));
  const [dueChoice, setDueChoice] = useState<DueChoice>(startingChoice);
  const [priority, setPriority] = useState<`${Priority}`>(`${task?.priority ?? 0}`);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dueOptions: SegmentOption<DueChoice>[] = [
    { value: 'none', label: 'No date' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'In a week' },
    ...(startingChoice === 'keep' ? [{ value: 'keep' as const, label: task?.dueDate ?? '' }] : []),
  ];

  function save() {
    const problem = onSave({
      title,
      notes,
      dueDate: dueDateFor(dueChoice, task?.dueDate ?? null, new Date()),
      priority: Number(priority) as Priority,
    });
    if (problem) setError(problem);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="title">{task ? 'Edit task' : 'New task'}</Text>

          <TextField
            label="Task"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError(null);
            }}
            error={error ?? undefined}
            placeholder="What needs doing?"
            autoFocus={!task}
            returnKeyType="done"
          />
          <TextField
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Anything to remember"
          />

          <View style={styles.group}>
            <Text variant="caption" muted>
              Due
            </Text>
            <SegmentedControl
              accessibilityLabel="Due date"
              options={dueOptions}
              value={dueChoice}
              onChange={setDueChoice}
            />
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              Priority
            </Text>
            <SegmentedControl
              accessibilityLabel="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={setPriority}
            />
          </View>

          <Button label="Save task" onPress={save} />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          {task ? (
            <Button label="Delete task" variant="danger" onPress={() => setConfirmingDelete(true)} />
          ) : null}
        </ScrollView>

        <ConfirmDialog
          visible={confirmingDelete}
          title="Delete this task?"
          message="This task will be removed from your list."
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md },
  group: { gap: spacing.xs },
});
