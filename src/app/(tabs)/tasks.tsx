import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { dayHeadline, dayProgress } from '@/features/planner/logic';
import { TaskRow } from '@/features/tasks/TaskRow';
import { useTasks } from '@/features/tasks/TasksContext';
import { useTaskEditor } from '@/features/tasks/useTaskEditor';
import { groupTasks } from '@/features/tasks/logic';
import type { Task } from '@/features/tasks/types';
import { toLocalDateString } from '@/lib/dates';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  Screen,
  SegmentedControl,
  Text,
  TextField,
  spacing,
  type SegmentOption,
} from '@/ui';

type TaskView = 'today' | 'upcoming' | 'done';

export default function TasksScreen() {
  const { tasks, error, setCompleted, add } = useTasks();
  const editor = useTaskEditor();
  const today = toLocalDateString(new Date());
  const groups = groupTasks(tasks, today);
  const progress = dayProgress(tasks, today);

  const [view, setView] = useState<TaskView>('today');
  const [quick, setQuick] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);

  const todayCount = groups.overdue.length + groups.today.length;
  const upcomingCount = groups.upcoming.length + groups.noDate.length;
  const options: readonly SegmentOption<TaskView>[] = [
    { value: 'today', label: `Today (${todayCount})` },
    { value: 'upcoming', label: `Upcoming (${upcomingCount})` },
    { value: 'done', label: `Done (${groups.done.length})` },
  ];

  function addQuick() {
    const problem = add({ title: quick, notes: '', dueDate: today, priority: 0 });
    if (problem) {
      setQuickError(problem);
      return;
    }
    setQuick('');
    setQuickError(null);
    setView('today');
  }

  function section(title: string, list: Task[], overdue = false): ReactNode {
    if (list.length === 0) return null;
    return (
      <Card>
        <Text variant="heading">{title}</Text>
        {list.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            overdue={overdue}
            onToggle={(completed) => setCompleted(task.id, completed)}
            onOpen={() => editor.open(task)}
          />
        ))}
      </Card>
    );
  }

  const nothingHere =
    (view === 'today' && todayCount === 0) ||
    (view === 'upcoming' && upcomingCount === 0) ||
    (view === 'done' && groups.done.length === 0);

  return (
    <Screen
      title="Tasks"
      header={
        <AppHeader
          section="Tasks"
          right={<Button label="New task" size="compact" onPress={() => editor.open(null)} />}
        />
      }
    >
      {error ? <ErrorState message={error} /> : null}

      <Card variant="hero">
        <View style={styles.pulseRow}>
          <Text variant="subheading">Today&apos;s focus</Text>
          {progress.total > 0 ? (
            <Text variant="caption" muted>
              {`${progress.done} of ${progress.total} done`}
            </Text>
          ) : null}
        </View>
        {progress.total > 0 ? (
          <ProgressBar
            value={progress.progress}
            accessibilityLabel={`${progress.done} of ${progress.total} tasks done today`}
          />
        ) : null}
        <Text variant="secondary" muted>
          {dayHeadline(progress)}
        </Text>
      </Card>

      <Card>
        <TextField
          label="Quick add"
          value={quick}
          onChangeText={(text) => {
            setQuick(text);
            setQuickError(null);
          }}
          error={quickError ?? undefined}
          placeholder="Add a task for today..."
          returnKeyType="done"
          onSubmitEditing={addQuick}
        />
        <Button label="Add to today" variant="secondary" onPress={addQuick} />
      </Card>

      <SegmentedControl<TaskView>
        accessibilityLabel="Which tasks to show"
        options={options}
        value={view}
        onChange={setView}
      />

      {tasks.length === 0 && !error ? (
        <EmptyState
          title="No tasks yet"
          message="Add your first task and it will be saved on this device."
          actionLabel="Add a task"
          onAction={() => editor.open(null)}
        />
      ) : null}

      {tasks.length > 0 && nothingHere ? (
        <EmptyState
          title={view === 'done' ? 'Nothing finished yet' : 'Nothing here'}
          message={
            view === 'today'
              ? 'You have nothing due today. Add something above, or enjoy the space.'
              : view === 'upcoming'
                ? 'No upcoming or undated tasks.'
                : 'Tasks you tick off will appear here.'
          }
        />
      ) : null}

      {view === 'today' ? (
        <>
          {section('From earlier', groups.overdue, true)}
          {section('Today', groups.today)}
        </>
      ) : null}
      {view === 'upcoming' ? (
        <>
          {section('Upcoming', groups.upcoming)}
          {section('No date', groups.noDate)}
        </>
      ) : null}
      {view === 'done' ? section('Done', groups.done) : null}

      {editor.element}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
