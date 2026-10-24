import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { formatFullDate, toLocalDateString } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import { DatePickerSheet } from '../calendar/DatePickerSheet';
import { ClockInput } from '../planner/ClockInput';
import {
  REMINDER_TIME_CHOICES,
  isPresetReminder,
  reminderChoiceFor,
  reminderFromMinutes,
  reminderMinutes,
} from '../reminders/taskReminders';
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  SegmentedControl,
  Text,
  TextField,
  layout,
  spacing,
  type SegmentOption,
} from '../../ui';
import { useGoals } from '../goals/GoalsContext';
import { choiceFor, dueDateFor, type DueChoice } from './logic';
import {
  CATEGORY_LABELS,
  REPEAT_LABELS,
  type Priority,
  type RepeatRule,
  type Task,
  type TaskCategory,
  type TaskInput,
} from './types';

type Props = {
  visible: boolean;
  /** The task being edited, or null when adding a new one. */
  task: Task | null;
  /** Returns an error message to show, or null when saved. */
  onSave: (input: TaskInput) => string | null;
  onDelete: () => void;
  onClose: () => void;
};

const REPEAT_RULES: readonly RepeatRule[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly'];

const CATEGORIES: readonly TaskCategory[] = ['none', 'deep', 'routine', 'personal', 'health'];

const PRIORITY_OPTIONS: readonly SegmentOption<`${Priority}`>[] = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
];

/** The form opens with a fresh state each time because the screen gives it a new `key`. */
export function TaskForm({ visible, task, onSave, onDelete, onClose }: Props) {
  const { colors } = useTheme();
  const { goals } = useGoals();
  const now = new Date();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [startingChoice] = useState<DueChoice>(() => choiceFor(task?.dueDate ?? null, now));
  const [dueChoice, setDueChoice] = useState<DueChoice>(startingChoice);
  const [priority, setPriority] = useState<`${Priority}`>(`${task?.priority ?? 0}`);
  const [repeat, setRepeat] = useState<RepeatRule>(task?.repeat ?? 'none');
  const [reminder, setReminder] = useState<string>(reminderChoiceFor(task?.reminderTime ?? null));
  const [category, setCategory] = useState<TaskCategory>(task?.category ?? 'none');
  const [goalId, setGoalId] = useState<string | null>(task?.goalId ?? null);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [pickingDate, setPickingDate] = useState(false);
  const [otherTime, setOtherTime] = useState(
    () => !!task?.reminderTime && !isPresetReminder(task.reminderTime),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dueOptions: SegmentOption<DueChoice>[] = [
    { value: 'none', label: 'No date' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'In a week' },
    ...(startingChoice === 'keep' ? [{ value: 'keep' as const, label: task?.dueDate ?? '' }] : []),
  ];

  // Repeating and reminders both need a date, so choosing one gives the task today's date.
  function chooseDue(choice: DueChoice) {
    setDueChoice(choice);
    if (choice === 'none') {
      setRepeat('none');
      setReminder('off');
    }
  }

  function chooseRepeat(rule: RepeatRule) {
    setRepeat(rule);
    if (rule !== 'none' && dueChoice === 'none') setDueChoice('today');
  }

  function chooseReminder(time: string) {
    setReminder(time);
    setOtherTime(false);
    if (time !== 'off' && dueChoice === 'none') setDueChoice('today');
  }

  function chooseOtherTime() {
    setOtherTime(true);
    // Starts from the time already chosen, or 9:00 AM, and can be typed over.
    if (reminderMinutes(reminder) === null) setReminder('09:00');
    if (dueChoice === 'none') setDueChoice('today');
  }

  const reminderChoices = REMINDER_TIME_CHOICES.map((choice) => ({
    value: choice.value as string,
    label: choice.label,
  }));

  function save() {
    const dueDate = dueDateFor(dueChoice, task?.dueDate ?? null, new Date(), customDate);
    const problem = onSave({
      title,
      notes,
      dueDate,
      priority: Number(priority) as Priority,
      repeat: dueDate ? repeat : 'none',
      reminderTime: dueDate && reminder !== 'off' ? reminder : null,
      category,
      goalId,
    });
    if (problem) setError(problem);
  }

  const saveLabel = task ? 'Save task' : dueChoice === 'today' ? 'Add to today' : 'Add task';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
          <Button label="Cancel" variant="ghost" size="compact" onPress={onClose} />
          <Text variant="subheading" accessibilityRole="header">
            {task ? 'Edit task' : 'New task'}
          </Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
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
          </Card>

          <Card style={styles.card}>
            <View style={styles.group}>
              <Text variant="caption" muted>
                Due
              </Text>
              <SegmentedControl
                accessibilityLabel="Due date"
                options={dueOptions}
                value={dueChoice}
                onChange={chooseDue}
              />
              <Button
                label={
                  dueChoice === 'custom' && customDate
                    ? `Due: ${formatFullDate(customDate)}`
                    : 'Pick a date on the calendar'
                }
                accessibilityLabel={
                  dueChoice === 'custom' && customDate
                    ? `Due date ${formatFullDate(customDate)}. Change it`
                    : 'Pick a due date on the calendar'
                }
                variant={dueChoice === 'custom' ? 'primary' : 'secondary'}
                onPress={() => setPickingDate(true)}
              />
            </View>

            <View style={styles.group}>
              <Text variant="caption" muted>
                Remind me on the due date at
              </Text>
              <View style={styles.chips}>
                {reminderChoices.map((choice) => (
                  <Chip
                    key={choice.value}
                    label={choice.label}
                    accessibilityLabel={
                      choice.value === 'off' ? 'No reminder' : `Remind me at ${choice.label}`
                    }
                    selected={!otherTime && reminder === choice.value}
                    onPress={() => chooseReminder(choice.value)}
                  />
                ))}
                <Chip
                  label="Other time"
                  accessibilityLabel="Choose another reminder time"
                  selected={otherTime}
                  onPress={chooseOtherTime}
                />
              </View>
              {otherTime ? (
                <ClockInput
                  label="Reminder time"
                  value={reminderMinutes(reminder) ?? 9 * 60}
                  onChange={(minutes) => setReminder(reminderFromMinutes(minutes))}
                />
              ) : null}
            </View>

            <View style={styles.group}>
              <Text variant="caption" muted>
                Repeat
              </Text>
              <View style={styles.chips}>
                {REPEAT_RULES.map((rule) => (
                  <Chip
                    key={rule}
                    label={rule === 'none' ? 'Never' : REPEAT_LABELS[rule].replace('Every ', '')}
                    accessibilityLabel={REPEAT_LABELS[rule]}
                    selected={repeat === rule}
                    onPress={() => chooseRepeat(rule)}
                  />
                ))}
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
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

            <View style={styles.group}>
              <Text variant="caption" muted>
                Category
              </Text>
              <View style={styles.chips}>
                {CATEGORIES.map((item) => (
                  <Chip
                    key={item}
                    label={CATEGORY_LABELS[item]}
                    accessibilityLabel={
                      item === 'none' ? 'No category' : `Category: ${CATEGORY_LABELS[item]}`
                    }
                    selected={category === item}
                    onPress={() => setCategory(item)}
                  />
                ))}
              </View>
            </View>

            {goals.some((goal) => !goal.completedAt || goal.id === goalId) ? (
              <View style={styles.group}>
                <Text variant="caption" muted>
                  Goal
                </Text>
                <View style={styles.chips}>
                  <Chip
                    label="No goal"
                    accessibilityLabel="Not part of a goal"
                    selected={goalId === null}
                    onPress={() => setGoalId(null)}
                  />
                  {goals
                    .filter((goal) => !goal.completedAt || goal.id === goalId)
                    .map((goal) => (
                      <Chip
                        key={goal.id}
                        label={goal.title}
                        accessibilityLabel={`Goal: ${goal.title}`}
                        selected={goalId === goal.id}
                        onPress={() => setGoalId(goal.id)}
                      />
                    ))}
                </View>
                {repeat !== 'none' ? (
                  <Text variant="caption" muted>
                    A repeating task counts towards the goal once. Its next copies are not linked.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>

          <Button label={saveLabel} onPress={save} />
          {task ? (
            <Button
              label="Delete task"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          ) : null}
        </ScrollView>

        {pickingDate ? (
          <DatePickerSheet
            title="Due date"
            value={customDate ?? task?.dueDate ?? null}
            minDate={toLocalDateString(new Date())}
            onPick={(date) => {
              setCustomDate(date);
              setDueChoice('custom');
              setPickingDate(false);
            }}
            onClose={() => setPickingDate(false)}
          />
        ) : null}

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topSpacer: { width: 72 },
  content: { padding: layout.gutter, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.md },
  group: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
