import { useEffect } from 'react';

import { useTasks } from '../tasks/TasksContext';
import { refreshTaskReminders } from './service';

/** Keeps the phone's task reminders in step with the tasks. Shows nothing. */
export function TaskRemindersSync() {
  const { tasks } = useTasks();

  useEffect(() => {
    void refreshTaskReminders(tasks);
  }, [tasks]);

  return null;
}
