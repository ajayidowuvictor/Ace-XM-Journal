import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/context';
import { Button, ConfirmDialog, Text, TextField, spacing } from '../../ui';
import { useHabits } from './HabitsContext';
import type { Habit } from './types';

type Props = {
  visible: boolean;
  /** The habit being edited, or null when adding a new one. */
  habit: Habit | null;
  onClose: () => void;
};

/** The form opens with fresh state each time because the screen gives it a new `key`. */
export function HabitForm({ visible, habit, onClose }: Props) {
  const { colors } = useTheme();
  const { add, rename, remove } = useHabits();
  const [name, setName] = useState(habit?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save() {
    const problem = habit ? rename(habit.id, name) : add(name);
    if (problem) setError(problem);
    else onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="title">{habit ? 'Edit habit' : 'New habit'}</Text>
          <TextField
            label="Habit"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            error={error ?? undefined}
            placeholder="For example: Read 10 pages"
            autoFocus={!habit}
            returnKeyType="done"
          />
          <Text variant="caption" muted>
            You can tick a habit once a day. Streaks count days in a row.
          </Text>
          <Button label="Save habit" onPress={save} />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          {habit ? (
            <Button
              label="Delete habit"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          ) : null}
        </ScrollView>

        <ConfirmDialog
          visible={confirmingDelete}
          title="Delete this habit?"
          message="The habit and its history will be removed. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            if (habit) remove(habit.id);
            onClose();
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, gap: spacing.md },
});
