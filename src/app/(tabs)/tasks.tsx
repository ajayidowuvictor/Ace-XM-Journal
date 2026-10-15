import type { ReactNode } from 'react';

import { TaskRow } from '@/features/tasks/TaskRow';
import { useTasks } from '@/features/tasks/TasksContext';
import { useTaskEditor } from '@/features/tasks/useTaskEditor';
import { groupTasks } from '@/features/tasks/logic';
import type { Task } from '@/features/tasks/types';
import { toLocalDateString } from '@/lib/dates';
import { Button, Card, EmptyState, ErrorState, Screen, Text } from '@/ui';

export default function TasksScreen() {
  const { tasks, error, setCompleted } = useTasks();
  const editor = useTaskEditor();
  const groups = groupTasks(tasks, toLocalDateString(new Date()));

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

  return (
    <Screen title="Tasks">
      <Button label="New task" onPress={() => editor.open(null)} />

      {error ? <ErrorState message={error} /> : null}

      {tasks.length === 0 && !error ? (
        <EmptyState
          title="No tasks yet"
          message="Add your first task and it will be saved on this device."
          actionLabel="Add a task"
          onAction={() => editor.open(null)}
        />
      ) : null}

      {section('From earlier', groups.overdue, true)}
      {section('Today', groups.today)}
      {section('Upcoming', groups.upcoming)}
      {section('No date', groups.noDate)}
      {section('Done', groups.done)}

      {editor.element}
    </Screen>
  );
}
