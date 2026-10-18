import { useEffect } from 'react';

import { useTasks } from '../tasks/TasksContext';
import { installNotificationHandler, refreshTaskReminders, restoreDailyReminder } from './service';

/** Keeps the phone's reminders in step with the tasks and settings. Shows nothing. */
export function TaskRemindersSync() {
  const { tasks } = useTasks();

  useEffect(() => {
    installNotificationHandler();
    void restoreDailyReminder();
  }, []);

  useEffect(() => {
    void refreshTaskReminders(tasks);
  }, [tasks]);

  return null;
}
