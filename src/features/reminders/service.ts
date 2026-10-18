import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PREF_KEYS, readPreference } from '../../lib/preferences';
import type { Task } from '../tasks/types';
import {
  REMINDER_BODY,
  REMINDER_TITLE,
  TEST_BODY,
  describeImportance,
  describeScheduled,
  parseReminderChoice,
  reminderTime,
  type ReminderChoice,
} from './logic';
import {
  TASK_REMINDER_PREFIX,
  parseTaskNameChoice,
  planTaskReminders,
  taskReminderContent,
} from './taskReminders';

// Android fixes a channel's importance and sound when it is first made, so the earlier channels
// ("daily-reminder", "task-reminders", which only made a quiet entry in the list) are replaced by
// new ones that pop up on screen and use the soft chime.
const CHANNEL_ID = 'daily-reminder-v2';
const TASK_CHANNEL_ID = 'task-reminders-v2';
const OLD_CHANNEL_IDS = ['daily-reminder', 'task-reminders'];
const CHIME = 'chime.wav';
const DAILY_ID = 'daily-reminder';
const TEST_ID = 'test-reminder';

/** Makes (or updates the name of) a reminder channel and removes the old quiet ones. */
async function prepareChannel(id: string, name: string): Promise<void> {
  await Promise.all(
    OLD_CHANNEL_IDS.map((old) => Notifications.deleteNotificationChannelAsync(old)),
  );
  await Notifications.setNotificationChannelAsync(id, {
    name,
    importance: Notifications.AndroidImportance.HIGH,
    sound: CHIME,
    enableVibrate: true,
    vibrationPattern: [0, 180, 120, 180],
  });
}

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
      await prepareChannel(CHANNEL_ID, 'Daily reminder');
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
      await prepareChannel(TASK_CHANNEL_ID, 'Task reminders');
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

/** Sends one test notification to this phone, by default about a minute from now. */
export async function scheduleTestReminder(
  now: Date = new Date(),
  delaySeconds = 60,
): Promise<ReminderResult> {
  try {
    if (Platform.OS === 'android') {
      await prepareChannel(CHANNEL_ID, 'Daily reminder');
    }
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return 'denied';

    await Notifications.scheduleNotificationAsync({
      identifier: TEST_ID,
      content: { title: REMINDER_TITLE, body: TEST_BODY },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(now.getTime() + delaySeconds * 1000),
        channelId: CHANNEL_ID,
      },
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** What the phone currently allows for reminders: permission and the pop-up setting. */
export async function reminderDiagnosis(): Promise<string | null> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    const parts = [
      permission.granted
        ? 'Notifications are allowed for this app.'
        : 'Notifications are NOT allowed for this app.',
    ];
    if (Platform.OS === 'android') {
      const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
      parts.push(
        channel
          ? `Your phone has set reminders to: ${describeImportance(channel.importance)}.`
          : 'The reminder channel has not been made yet; send a test first.',
      );
    }
    return parts.join(' ');
  } catch {
    return null;
  }
}

/** A plain sentence about which reminders the phone is holding, or null if it cannot tell. */
export async function scheduledSummary(): Promise<string | null> {
  try {
    const items = await Notifications.getAllScheduledNotificationsAsync();
    return describeScheduled(
      items.some((item) => item.identifier === DAILY_ID),
      items.filter((item) => item.identifier.startsWith(TASK_REMINDER_PREFIX)).length,
      items.some((item) => item.identifier === TEST_ID),
    );
  } catch {
    return null;
  }
}

let restored = false;

/**
 * Once per start: makes the daily reminder use the current (pop-up, chime) channel. Reminders
 * scheduled by an earlier version still point at the old quiet channel until they are set again.
 */
export async function restoreDailyReminder(): Promise<void> {
  if (restored) return;
  restored = true;
  const choice = parseReminderChoice(readPreference(PREF_KEYS.reminder));
  if (choice !== 'off') await applyReminder(choice);
}

/** Lets a reminder that arrives while the app is open still show on screen and chime. */
export function installNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Without it the phone's own behaviour applies.
  }
}
