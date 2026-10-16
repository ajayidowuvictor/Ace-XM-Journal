import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PREF_KEYS, readPreference } from '../../lib/preferences';
import type { Task } from '../tasks/types';
import { REMINDER_BODY, REMINDER_TITLE, reminderTime, type ReminderChoice } from './logic';
import {
  TASK_REMINDER_PREFIX,
  parseTaskNameChoice,
  planTaskReminders,
  taskReminderContent,
} from './taskReminders';

const CHANNEL_ID = 'daily-reminder';
const TASK_CHANNEL_ID = 'task-reminders';
const DAILY_ID = 'daily-reminder';

export type ReminderResult = 'ok' | 'denied' | 'error';

/**
 * Makes the phone's daily reminder match the choice: cancels the old one and, unless the choice
 * is "off", asks for permission (if needed) and schedules one repeating daily notification.
 * The notification text is fixed and never contains the user's data.
 */
export async function applyReminder(choice: ReminderChoice): Promise<ReminderResult> {
  try {
    // Only the daily reminder is replaced. Task reminders (ids starting "task-") are left alone.
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      existing
        .filter((item) => !item.identifier.startsWith(TASK_REMINDER_PREFIX))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
    );
    const time = reminderTime(choice);
    if (!time) return 'ok';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Daily reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return 'denied';

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: { title: REMINDER_TITLE, body: REMINDER_BODY },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: CHANNEL_ID,
      },
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

/**
 * Makes the phone's task reminders match the tasks: removes reminders for tasks that are done,
 * changed or deleted, and schedules one for each open task that has a due date and reminder
 * time in the future. Whether the notification shows the task's name is the person's choice.
 */
export async function refreshTaskReminders(
  tasks: readonly Task[],
  now: Date = new Date(),
): Promise<ReminderResult> {
  try {
    const planned = planTaskReminders(tasks, now);
    const wanted = new Set(planned.map((item) => `${TASK_REMINDER_PREFIX}${item.taskId}`));

    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      existing
        .filter(
          (item) =>
            item.identifier.startsWith(TASK_REMINDER_PREFIX) && !wanted.has(item.identifier),
        )
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
    );
    if (planned.length === 0) return 'ok';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(TASK_CHANNEL_ID, {
        name: 'Task reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return 'denied';

    const choice = parseTaskNameChoice(readPreference(PREF_KEYS.taskNames));
    for (const item of planned) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${TASK_REMINDER_PREFIX}${item.taskId}`,
        content: taskReminderContent(item.title, choice),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.at,
          channelId: TASK_CHANNEL_ID,
        },
      });
    }
    return 'ok';
  } catch {
    return 'error';
  }
}
