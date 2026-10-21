import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import {
  Button,
  Chip,
  ConfirmDialog,
  SegmentedControl,
  Text,
  TextField,
  spacing,
} from '../../ui';
import type { Task } from '../tasks/types';
import {
  DURATION_CHOICES,
  MAX_DURATION,
  MIN_DURATION,
  START_STEP,
  formatDuration,
  formatTime,
  overlappingBlocks,
  parseTypedDuration,
  parseTypedStart,
  shiftStart,
  suggestStart,
  to12Hour,
  withMeridiem,
} from './logic';
import type { PlanBlock, PlanBlockInput } from './types';

type Props = {
  visible: boolean;
  /** The block being edited, or null when adding a new one. */
  block: PlanBlock | null;
  /** The other blocks of the same day, used to suggest a free time and to point out overlaps. */
  dayBlocks: readonly PlanBlock[];
  /** Minutes after midnight when planning today, or null for another day. */
  nowMinutes: number | null;
  /** Tasks the block can be linked to. */
  linkableTasks: readonly Task[];
  /** Returns an error message to show, or null when saved. */
  onSave: (input: PlanBlockInput) => string | null;
  onDelete: () => void;
  onClose: () => void;
};

const DEFAULT_DURATION = 60;

const digits = (text: string) => text.replace(/\D/g, '');
const twoDigits = (value: number) => String(value).padStart(2, '0');

function startTexts(minutes: number) {
  const { hour12, minute } = to12Hour(minutes);
  return { hour: String(hour12), minute: twoDigits(minute) };
}

function durationTexts(minutes: number) {
  return { hours: String(Math.floor(minutes / 60)), minutes: String(minutes % 60) };
}

/** The form opens with a fresh state each time because the screen gives it a new `key`. */
export function BlockForm({
  visible,
  block,
  dayBlocks,
  nowMinutes,
  linkableTasks,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(block?.title ?? '');
  const [taskId, setTaskId] = useState<string | null>(block?.taskId ?? null);
  const [duration, setDuration] = useState(block?.durationMinutes ?? DEFAULT_DURATION);
  const [start, setStart] = useState(
    () => block?.startMinutes ?? suggestStart(dayBlocks, DEFAULT_DURATION, nowMinutes),
  );
  const [hourText, setHourText] = useState(() => startTexts(start).hour);
  const [minuteText, setMinuteText] = useState(() => startTexts(start).minute);
  const [lengthHours, setLengthHours] = useState(() => durationTexts(duration).hours);
  const [lengthMinutes, setLengthMinutes] = useState(() => durationTexts(duration).minutes);
  const [lengthHint, setLengthHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const pm = start >= 720;

  const durations = DURATION_CHOICES.includes(duration as (typeof DURATION_CHOICES)[number])
    ? [...DURATION_CHOICES]
    : [...DURATION_CHOICES, duration].sort((a, b) => a - b);
  const clashes = overlappingBlocks(
    dayBlocks,
    { startMinutes: start, durationMinutes: duration },
    block?.id,
  );

  /** Sets the start time and rewrites the hour and minute boxes to match. */
  function applyStart(next: number) {
    setStart(next);
    const texts = startTexts(next);
    setHourText(texts.hour);
    setMinuteText(texts.minute);
  }

  function chooseDuration(next: number) {
    setDuration(next);
    const texts = durationTexts(next);
    setLengthHours(texts.hours);
    setLengthMinutes(texts.minutes);
    setLengthHint(null);
    applyStart(shiftStart(start, 0, next));
    setError(null);
  }

  function typeStart(nextHour: string, nextMinute: string, nextPm: boolean) {
    const parsed = parseTypedStart(nextHour, nextMinute, nextPm);
    if (parsed !== null) setStart(shiftStart(parsed, 0, duration));
  }

  function typeLength(nextHours: string, nextMinutes: string) {
    const total = parseTypedDuration(nextHours, nextMinutes);
    if (total === null) {
      setLengthHint(null);
    } else if (total < MIN_DURATION || total > MAX_DURATION) {
      setLengthHint(
        `Choose a length from ${formatDuration(MIN_DURATION)} to ${formatDuration(MAX_DURATION)}.`,
      );
    } else {
      setLengthHint(null);
      setDuration(total);
      setStart(shiftStart(start, 0, total));
      setError(null);
    }
  }

  function chooseTask(task: Task) {
    if (taskId === task.id) {
      setTaskId(null);
      return;
    }
    setTaskId(task.id);
    if (!title.trim()) setTitle(task.title);
  }

  function save() {
    const problem = onSave({ title, taskId, startMinutes: start, durationMinutes: duration });
    if (problem) setError(problem);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="title">{block ? 'Edit block' : 'New block'}</Text>

          <TextField
            label="Name"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError(null);
            }}
            error={error ?? undefined}
            placeholder="What will you do?"
            autoFocus={!block}
            returnKeyType="done"
          />

          <View style={styles.group}>
            <Text variant="caption" muted>
              Starts at
            </Text>
            <Text variant="largeTitle" accessibilityLabel={`Starts at ${formatTime(start)}`}>
              {formatTime(start)}
            </Text>
            <SegmentedControl<'am' | 'pm'>
              accessibilityLabel="Morning or afternoon"
              options={[
                { value: 'am', label: 'AM' },
                { value: 'pm', label: 'PM' },
              ]}
              value={pm ? 'pm' : 'am'}
              onChange={(choice) =>
                applyStart(shiftStart(withMeridiem(start, choice === 'pm'), 0, duration))
              }
            />
            <View style={styles.row}>
              <View style={styles.field}>
                <TextField
                  label="Hour (1 to 12)"
                  value={hourText}
                  onChangeText={(text) => {
                    const clean = digits(text).slice(0, 2);
                    setHourText(clean);
                    typeStart(clean, minuteText, pm);
                  }}
                  onBlur={() => applyStart(start)}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.field}>
                <TextField
                  label="Minute (0 to 59)"
                  value={minuteText}
                  onChangeText={(text) => {
                    const clean = digits(text).slice(0, 2);
                    setMinuteText(clean);
                    typeStart(hourText, clean, pm);
                  }}
                  onBlur={() => applyStart(start)}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
            <View style={styles.row}>
              {[
                { label: '−1 h', spoken: 'One hour earlier', delta: -60 },
                {
                  label: `−${START_STEP} m`,
                  spoken: `${START_STEP} minutes earlier`,
                  delta: -START_STEP,
                },
                {
                  label: `+${START_STEP} m`,
                  spoken: `${START_STEP} minutes later`,
                  delta: START_STEP,
                },
                { label: '+1 h', spoken: 'One hour later', delta: 60 },
              ].map((step) => (
                <Button
                  key={step.label}
                  label={step.label}
                  accessibilityLabel={step.spoken}
                  variant="secondary"
                  size="compact"
                  onPress={() => applyStart(shiftStart(start, step.delta, duration))}
                  style={styles.step}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              Length
            </Text>
            <View style={[styles.row, styles.wrap]}>
              {durations.map((minutes) => (
                <Chip
                  key={minutes}
                  label={formatDuration(minutes)}
                  selected={minutes === duration}
                  onPress={() => chooseDuration(minutes)}
                />
              ))}
            </View>
            <Text variant="caption" muted>
              Or type your own length
            </Text>
            <View style={styles.row}>
              <View style={styles.field}>
                <TextField
                  label="Hours"
                  value={lengthHours}
                  onChangeText={(text) => {
                    const clean = digits(text).slice(0, 2);
                    setLengthHours(clean);
                    typeLength(clean, lengthMinutes);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.field}>
                <TextField
                  label="Minutes"
                  value={lengthMinutes}
                  onChangeText={(text) => {
                    const clean = digits(text).slice(0, 3);
                    setLengthMinutes(clean);
                    typeLength(lengthHours, clean);
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            {lengthHint ? (
              <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
                {lengthHint}
              </Text>
            ) : null}
            <Text variant="caption" muted>
              Ends at {formatTime(start + duration)}
            </Text>
            {clashes.length > 0 ? (
              <Text variant="caption" tone="primary" accessibilityLiveRegion="polite">
                Shares time with “{clashes[0].title}”. You can still save it.
              </Text>
            ) : null}
          </View>

          {linkableTasks.length > 0 ? (
            <View style={styles.group}>
              <Text variant="caption" muted>
                For a task (optional)
              </Text>
              <View style={[styles.row, styles.wrap]}>
                {linkableTasks.map((task) => (
                  <Chip
                    key={task.id}
                    label={task.title.length > 24 ? `${task.title.slice(0, 23)}…` : task.title}
                    accessibilityLabel={`Link the task "${task.title}"`}
                    selected={task.id === taskId}
                    onPress={() => chooseTask(task)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <Button label="Save block" onPress={save} />
          <Button label="Cancel" variant="ghost" onPress={onClose} />
          {block ? (
            <Button
              label="Delete block"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          ) : null}
        </ScrollView>

        <ConfirmDialog
          visible={confirmingDelete}
          title="Delete this block?"
          message="The block will be removed from your day. The task, if any, stays on your list."
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
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexWrap: 'wrap' },
  step: { flex: 1 },
  field: { flex: 1 },
});
