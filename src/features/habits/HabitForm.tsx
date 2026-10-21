import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useTheme } from '../../theme/context';
import { Button, Chip, ConfirmDialog, Text, TextField, spacing } from '../../ui';
import { useHabits } from './HabitsContext';
import { ALL_DAYS, DAY_NAMES, WEEKDAYS_ONLY, cleanDays, scheduleLabel } from './logic';
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
  const { add, edit, remove } = useHabits();
  const [name, setName] = useState(habit?.name ?? '');
  const [days, setDays] = useState<number[]>(habit?.days ?? [...ALL_DAYS]);
  const [error, setError] = useState<string | null>(null);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function save() {
    if (days.length === 0) {
      setDaysError('Choose at least one day.');
      return;
    }
    const problem = habit ? edit(habit.id, name, days) : add(name, days);
    if (problem) setError(problem);
    else onClose();
  }

  function chooseDays(next: readonly number[]) {
    setDays(cleanDays(next));
    setDaysError(null);
  }

  function toggleDay(day: number) {
    chooseDays(days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);
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
          <View style={styles.group}>
            <Text variant="caption" muted>
              Repeats on
            </Text>
            <View style={styles.chips}>
              {DAY_NAMES.map((label, day) => (
                <Chip
                  key={label}
                  label={label}
                  accessibilityLabel={`${label}${days.includes(day) ? ', on' : ', off'}`}
                  selected={days.includes(day)}
                  onPress={() => toggleDay(day)}
                />
              ))}
            </View>
            <View style={styles.chips}>
              <Chip
                label="Every day"
                selected={scheduleLabel(days) === 'Every day'}
                onPress={() => chooseDays(ALL_DAYS)}
              />
              <Chip
                label="Weekdays"
                selected={scheduleLabel(days) === 'Weekdays'}
                onPress={() => chooseDays(WEEKDAYS_ONLY)}
              />
            </View>
            {daysError ? (
              <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
                {daysError}
              </Text>
            ) : null}
          </View>
          <Text variant="caption" muted>
            You can tick a habit once a day. Streaks count the days it repeats on, so rest days never
            break them.
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
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
