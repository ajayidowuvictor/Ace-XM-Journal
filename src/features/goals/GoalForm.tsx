import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { formatFullDate, formatShortDate, toLocalDateString } from '../../lib/dates';
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
import { DatePickerSheet } from '../calendar/DatePickerSheet';
import { useTasks } from '../tasks/TasksContext';
import { StepRow } from './StepRow';
import { useGoals } from './GoalsContext';
import {
  goalProgress,
  linkableTasks,
  targetChoiceFor,
  targetDateFor,
  tasksForGoal,
  type TargetChoice,
} from './logic';

/** How many open tasks are offered at once when linking one to a goal. */
const LINK_CHOICES = 6;

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

  const { tasks, setGoal, reload: reloadTasks } = useTasks();

  const [savedId, setSavedId] = useState<string | null>(goalId);
  const goal = goals.find((g) => g.id === savedId) ?? null;

  const [title, setTitle] = useState(goal?.title ?? '');
  const [notes, setNotes] = useState(goal?.notes ?? '');
  const [startingChoice] = useState<TargetChoice>(() => targetChoiceFor(goal?.targetDate ?? null));
  const [choice, setChoice] = useState<TargetChoice>(startingChoice);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [pickingDate, setPickingDate] = useState(false);
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
      targetDate: targetDateFor(choice, goal?.targetDate ?? null, new Date(), customDate),
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

  const linked = savedId ? tasksForGoal(tasks, savedId) : [];
  const offered = linkableTasks(tasks).slice(0, LINK_CHOICES);
  const progress = goal ? goalProgress(goal, linked) : 0;

  function linkTask(taskId: string) {
    const id = savedId ?? persist();
    if (id) setGoal(taskId, id);
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
            <Button
              label={
                choice === 'custom' && customDate
                  ? `Target: ${formatFullDate(customDate)}`
                  : 'Pick a date on the calendar'
              }
              accessibilityLabel={
                choice === 'custom' && customDate
                  ? `Target date ${formatFullDate(customDate)}. Change it`
                  : 'Pick a target date on the calendar'
              }
              variant={choice === 'custom' ? 'primary' : 'secondary'}
              onPress={() => setPickingDate(true)}
            />
          </View>

          <Text variant="heading">Steps</Text>
          {goal && (goal.milestones.length > 0 || linked.length > 0) ? (
            <ProgressBar
              value={progress}
              accessibilityLabel={`Goal progress ${Math.round(progress * 100)} percent`}
            />
          ) : null}
          {goal && goal.milestones.length > 0 ? (
            goal.milestones.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                onToggle={(done) => setStepDone(step.id, done)}
                onRemove={() => removeStep(step.id)}
              />
            ))
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

          <Text variant="heading">Tasks for this goal</Text>
          <Text muted>Finishing a task here moves the goal forward, together with its steps.</Text>
          {linked.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskTitle}>
                <Text muted={task.completedAt !== null}>{task.title}</Text>
                <Text variant="caption" muted>
                  {task.completedAt ? 'Done' : 'Not done yet'}
                </Text>
              </View>
              <Button
                label="Unlink"
                variant="ghost"
                accessibilityHint={`Stops "${task.title}" counting towards this goal`}
                onPress={() => setGoal(task.id, null)}
              />
            </View>
          ))}
          {offered.length > 0 ? (
            <>
              <Text variant="caption" muted>
                Add one of your open tasks
              </Text>
              {offered.map((task) => (
                <Button
                  key={task.id}
                  label={task.title}
                  accessibilityLabel={`Add the task ${task.title} to this goal`}
                  variant="secondary"
                  onPress={() => linkTask(task.id)}
                />
              ))}
            </>
          ) : linked.length === 0 ? (
            <Text muted>No open tasks to add yet. Add a task, then pick this goal on it.</Text>
          ) : null}

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

        {pickingDate ? (
          <DatePickerSheet
            title="Target date"
            value={customDate ?? goal?.targetDate ?? null}
            minDate={toLocalDateString(new Date())}
            onPick={(date) => {
              setCustomDate(date);
              setChoice('custom');
              setPickingDate(false);
            }}
            onClose={() => setPickingDate(false)}
          />
        ) : null}

        <ConfirmDialog
          visible={confirmingDelete}
          title="Delete this goal?"
          message="The goal and all its steps will be removed. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            if (savedId) {
              remove(savedId);
              // The goal's tasks are unlinked in the database; refresh the list the app shows.
              reloadTasks();
            }
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
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  taskTitle: { flex: 1 },
});
