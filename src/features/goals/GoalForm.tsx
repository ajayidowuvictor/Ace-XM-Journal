import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { formatShortDate } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import {
  Button,
  ConfirmDialog,
  ProgressBar,
  SegmentedControl,
  Text,
  TextField,
  spacing,
  type SegmentOption,
} from '../../ui';
import { StepRow } from './StepRow';
import { useGoals } from './GoalsContext';
import { goalProgress, targetChoiceFor, targetDateFor, type TargetChoice } from './logic';

type Props = {
  visible: boolean;
  /** The goal being edited, or null to add a new one. */
  goalId: string | null;
  onClose: () => void;
};

/** Opens with fresh state each time because the screen gives it a new `key`. */
export function GoalForm({ visible, goalId, onClose }: Props) {
  const { colors } = useTheme();
  const { goals, add, edit, setDone, remove, addStep, setStepDone, removeStep } = useGoals();

  const [savedId, setSavedId] = useState<string | null>(goalId);
  const goal = goals.find((g) => g.id === savedId) ?? null;

  const [title, setTitle] = useState(goal?.title ?? '');
  const [notes, setNotes] = useState(goal?.notes ?? '');
  const [startingChoice] = useState<TargetChoice>(() => targetChoiceFor(goal?.targetDate ?? null));
  const [choice, setChoice] = useState<TargetChoice>(startingChoice);
  const [stepText, setStepText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const options: SegmentOption<TargetChoice>[] = [
    { value: 'none', label: 'No date' },
    { value: 'month', label: '1 month' },
    { value: 'quarter', label: '3 months' },
    { value: 'half', label: '6 months' },
    ...(startingChoice === 'keep'
      ? [{ value: 'keep' as const, label: formatShortDate(goal?.targetDate ?? '') }]
      : []),
  ];

  function input() {
    return {
      title,
      notes,
      targetDate: targetDateFor(choice, goal?.targetDate ?? null, new Date()),
    };
  }

  /** Saves the goal. Returns its id, or null if there was a problem (shown on screen). */
  function persist(): string | null {
    if (savedId) {
      const problem = edit(savedId, input());
      if (problem) setError(problem);
      return problem ? null : savedId;
    }
    const result = add(input());
    if ('problem' in result) {
      setError(result.problem);
      return null;
    }
    setSavedId(result.id);
    return result.id;
  }

  function addStepNow() {
    const id = savedId ?? persist();
    if (!id) return;
    const problem = addStep(id, stepText);
    if (problem) setStepError(problem);
    else {
      setStepText('');
      setStepError(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="title">{goalId ? 'Edit goal' : 'New goal'}</Text>

          <TextField
            label="Goal"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError(null);
            }}
            error={error ?? undefined}
            placeholder="For example: Run a 10k"
            autoFocus={!goalId}
          />
          <TextField
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Why it matters, or how you will do it"
          />

          <View style={styles.group}>
            <Text variant="caption" muted>
              Target date
            </Text>
            <SegmentedControl
              accessibilityLabel="Target date"
              options={options}
              value={choice}
              onChange={setChoice}
            />
          </View>

          <Text variant="heading">Steps</Text>
          {goal && goal.milestones.length > 0 ? (
            <>
              <ProgressBar
                value={goalProgress(goal)}
                accessibilityLabel={`Goal progress ${Math.round(goalProgress(goal) * 100)} percent`}
              />
              {goal.milestones.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onToggle={(done) => setStepDone(step.id, done)}
                  onRemove={() => removeStep(step.id)}
                />
              ))}
            </>
          ) : (
            <Text muted>Break the goal into small steps and tick them off.</Text>
          )}
          <TextField
            label="Add a step"
            value={stepText}
            onChangeText={(text) => {
              setStepText(text);
              setStepError(null);
            }}
            error={stepError ?? undefined}
            placeholder="For example: Buy running shoes"
            returnKeyType="done"
            onSubmitEditing={addStepNow}
          />
          <Button label="Add step" variant="secondary" onPress={addStepNow} />

          <Button
            label="Save goal"
            onPress={() => {
              if (persist()) onClose();
            }}
          />
          {goal ? (
            <Button
              label={goal.completedAt ? 'Reopen goal' : 'Mark goal as achieved'}
              variant="secondary"
              onPress={() => {
                if (persist()) {
                  setDone(goal.id, !goal.completedAt);
                  onClose();
                }
              }}
            />
          ) : null}
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          {goal ? (
            <Button
              label="Delete goal"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          ) : null}
        </ScrollView>

        <ConfirmDialog
          visible={confirmingDelete}
          title="Delete this goal?"
          message="The goal and all its steps will be removed. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            if (savedId) remove(savedId);
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
  group: { gap: spacing.xs },
});
