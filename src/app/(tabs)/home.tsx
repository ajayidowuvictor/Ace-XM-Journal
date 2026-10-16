import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackupNudgeCard } from '@/features/backup/BackupNudgeCard';
import { snoozeBackupNudge, useBackupSnooze, useLastBackup } from '@/features/backup/lastBackup';
import { shouldNudge, snoozeUntil } from '@/features/backup/status';
import { CheckInCard } from '@/features/home/CheckInCard';
import { checkInPrompt, verseOfTheDay } from '@/features/home/logic';
import { VerseCard } from '@/features/home/VerseCard';
import { useHabits } from '@/features/habits/HabitsContext';
import { HabitRow } from '@/features/habits/HabitRow';
import { todaySummary } from '@/features/habits/logic';
import { useJournal } from '@/features/journal/JournalContext';
import { useNotes } from '@/features/notes/NotesContext';
import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { CarryOverCard } from '@/features/planner/CarryOverCard';
import { FocusCard } from '@/features/planner/FocusCard';
import { FocusPicker } from '@/features/planner/FocusPicker';
import {
  WRAP_UP_TAG,
  buildTimeline,
  carryOverTasks,
  composeWrapUp,
  dayHeadline,
  dayProgress,
  findWrapUp,
  focusCandidates,
  focusTasks,
  minutesOfDay,
  tomorrowHeadline,
  withFocus,
  withoutFocus,
  wrapUpTitle,
} from '@/features/planner/logic';
import { usePlanner } from '@/features/planner/PlannerContext';
import { TimelineView } from '@/features/planner/TimelineView';
import { useBlockEditor } from '@/features/planner/useBlockEditor';
import { WrapUpCard } from '@/features/planner/WrapUpCard';
import { useTasks } from '@/features/tasks/TasksContext';
import { useTaskEditor } from '@/features/tasks/useTaskEditor';
import type { Task } from '@/features/tasks/types';
import { addDays, formatShortDate, parseLocalDate, toLocalDateString } from '@/lib/dates';
import { formatLongDate, greetingForHour } from '@/lib/greeting';
import { useNow } from '@/lib/useNow';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  Screen,
  SectionHeader,
  SegmentedControl,
  Text,
  spacing,
  type SegmentOption,
} from '@/ui';

type Day = 'today' | 'tomorrow';

const DAY_OPTIONS: readonly SegmentOption<Day>[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
];

/** From this hour on, the evening wrap-up card is shown. */
const WRAP_UP_HOUR = 17;

export default function HomeScreen() {
  const router = useRouter();
  const { displayName } = useOnboarding();
  const now = useNow();
  const today = toLocalDateString(now);
  const tomorrow = addDays(now, 1);
  const greeting = greetingForHour(now.getHours());

  const [day, setDay] = useState<Day>('today');
  const [picking, setPicking] = useState(false);
  const planDate = day === 'today' ? today : tomorrow;
  const nowMinutes = day === 'today' ? minutesOfDay(now) : null;

  const { tasks, setCompleted, edit, addTask } = useTasks();
  const taskEditor = useTaskEditor();
  const { habits, setDoneToday } = useHabits();
  const { focus, blocks, setFocus } = usePlanner();
  const { allEntries, create, save, status: journalStatus } = useJournal();
  const { notes } = useNotes();
  const lastBackup = useLastBackup();
  const backupSnooze = useBackupSnooze();

  const focusList = focusTasks(focus, tasks, planDate);
  const focusIds = focusList.map((task) => task.id);
  const dayBlocks = blocks.filter((block) => block.planDate === planDate);
  const timeline = buildTimeline(dayBlocks, nowMinutes);
  const completedTaskIds = new Set(
    tasks.filter((task) => task.completedAt !== null).map((task) => task.id),
  );

  const linkableTasks: Task[] = [];
  for (const task of [...focusList, ...tasks.filter((t) => t.dueDate === planDate)]) {
    if (!task.completedAt && !linkableTasks.some((other) => other.id === task.id)) {
      linkableTasks.push(task);
    }
  }
  const blockEditor = useBlockEditor({
    planDate,
    dayBlocks,
    nowMinutes,
    linkableTasks: linkableTasks.slice(0, 6),
  });

  const progress = dayProgress(tasks, planDate);
  const headline = day === 'today' ? dayHeadline(progress) : tomorrowHeadline(progress.total);
  const habitSummary = todaySummary(habits, today);
  const carryOver = day === 'today' ? carryOverTasks(tasks, today) : [];
  const wrapUp = findWrapUp(allEntries, today);
  const verse = verseOfTheDay(notes, today);
  const hasData =
    tasks.length > 0 || habits.length > 0 || allEntries.length > 0 || notes.length > 0;
  const showBackupNudge = day === 'today' && shouldNudge(lastBackup, backupSnooze, now, hasData);
  const showWrapUp = day === 'today' && (now.getHours() >= WRAP_UP_HOUR || wrapUp !== null);

  function chooseFocus(task: Task) {
    const next = withFocus(focusIds, task.id);
    if (next) setFocus(planDate, next);
    setPicking(false);
  }

  function createFocus(title: string): string | null {
    const { id, error } = addTask({ title, notes: '', dueDate: planDate, priority: 0 });
    if (error || !id) return error ?? 'Your change could not be saved. Please try again.';
    const next = withFocus(focusIds, id);
    if (next) setFocus(planDate, next);
    setPicking(false);
    return null;
  }

  function moveTask(task: Task, to: 'today' | 'tomorrow') {
    edit(task.id, {
      title: task.title,
      notes: task.notes,
      dueDate: to === 'today' ? today : tomorrow,
      priority: task.priority,
    });
  }

  function saveWrapUp(wentWell: string, next: string): boolean {
    const body = composeWrapUp({ wentWell, tomorrow: next });
    if (wrapUp) {
      return save(wrapUp.id, {
        title: wrapUp.title,
        body,
        mood: wrapUp.mood,
        tags: wrapUp.tags,
      });
    }
    return (
      create({
        title: wrapUpTitle(formatShortDate(today)),
        body,
        mood: null,
        tags: [WRAP_UP_TAG],
      }) !== null
    );
  }

  return (
    <Screen
      header={
        <AppHeader
          section="Home"
          right={
            <Button
              label="Search"
              variant="secondary"
              size="compact"
              onPress={() => router.push('/search')}
            />
          }
        />
      }
    >
      <View style={styles.header}>
        <Text variant="title">{displayName ? `${greeting}, ${displayName}` : greeting}</Text>
        <Text variant="secondary" muted>
          {formatLongDate(day === 'today' ? now : (parseLocalDate(tomorrow) ?? now))}
        </Text>
      </View>

      {showBackupNudge ? (
        <BackupNudgeCard
          lastBackup={lastBackup}
          now={now}
          onBackUp={() => router.push('/settings')}
          onLater={() => snoozeBackupNudge(snoozeUntil(now))}
        />
      ) : null}

      {day === 'today' ? (
        <VerseCard
          verse={verse}
          onOpen={(item) => router.push({ pathname: '/read', params: { id: item.id } })}
          onReflect={(item) =>
            router.push({
              pathname: '/entry',
              params: {
                title: item.reference.trim()
                  ? `Reflection: ${item.reference.trim()}`
                  : 'Reflection',
              },
            })
          }
          onAdd={() => router.push({ pathname: '/note', params: { kind: 'verse' } })}
        />
      ) : null}

      <SegmentedControl
        accessibilityLabel="Day to plan"
        options={DAY_OPTIONS}
        value={day}
        onChange={setDay}
      />

      <Card variant="hero">
        <Text variant="subheading">{headline}</Text>
        {day === 'today' && progress.total > 0 ? (
          <ProgressBar
            value={progress.progress}
            accessibilityLabel={`${progress.done} of ${progress.total} tasks done today`}
          />
        ) : null}
      </Card>

      <SectionHeader title="Your focus" />
      <FocusCard
        tasks={focusList}
        onToggle={(task, completed) => setCompleted(task.id, completed)}
        onOpen={(task) => taskEditor.open(task)}
        onRemove={(task) => setFocus(planDate, withoutFocus(focusIds, task.id))}
        onAdd={() => setPicking(true)}
      />

      <SectionHeader
        title={day === 'today' ? "Today's flow" : "Tomorrow's flow"}
        actionLabel="Add block"
        onAction={() => blockEditor.open(null)}
      />
      <Card>
        {timeline.length === 0 ? (
          <EmptyState
            title="Nothing scheduled"
            message="Give an important task its own time. A short block is enough."
            actionLabel="Add a block"
            onAction={() => blockEditor.open(null)}
          />
        ) : (
          <TimelineView
            entries={timeline}
            completedTaskIds={completedTaskIds}
            onOpenBlock={(block) => blockEditor.open(block)}
          />
        )}
      </Card>

      <CarryOverCard tasks={carryOver} onMove={moveTask} />

      {day === 'today' ? (
        <>
          <SectionHeader title="Habits" />
          <Card>
            {habits.length === 0 ? (
              <EmptyState
                title="No habits yet"
                message="Habits you track will show their progress here."
              />
            ) : (
              <>
                <Text variant="secondary" muted>
                  {habitSummary.done} of {habitSummary.total} done today
                </Text>
                <ProgressBar
                  value={habitSummary.progress}
                  accessibilityLabel={`${habitSummary.done} of ${habitSummary.total} habits done today`}
                />
                {habits.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    today={today}
                    showStreak={false}
                    onToggle={(done) => setDoneToday(habit.id, done)}
                  />
                ))}
              </>
            )}
          </Card>
        </>
      ) : null}

      {day === 'today' && !showWrapUp ? (
        <CheckInCard
          prompt={checkInPrompt(today)}
          onWrite={() =>
            router.push({ pathname: '/entry', params: { prompt: checkInPrompt(today) } })
          }
        />
      ) : null}

      {showWrapUp ? (
        <WrapUpCard
          key={wrapUp?.id ?? 'new'}
          existing={wrapUp}
          journalReady={journalStatus === 'ready'}
          onSave={saveWrapUp}
        />
      ) : null}

      <View style={styles.shortcuts}>
        <Button
          label="Calendar"
          variant="secondary"
          onPress={() => router.push('/calendar')}
          style={styles.shortcut}
        />
        <Button
          label="Insights"
          variant="secondary"
          onPress={() => router.push('/insights')}
          style={styles.shortcut}
        />
      </View>

      <Button label="Weekly review" variant="secondary" onPress={() => router.push('/review')} />

      {taskEditor.element}
      {blockEditor.element}
      <FocusPicker
        visible={picking}
        candidates={focusCandidates(tasks, today, focusIds)}
        spotsLeft={3 - focusIds.length}
        onPick={chooseFocus}
        onCreate={createFocus}
        onClose={() => setPicking(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, paddingTop: spacing.sm },
  shortcuts: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  shortcut: { flex: 1 },
});
