import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { REMINDER_BODY, REMINDER_TITLE, reminderTime, type ReminderChoice } from './logic';

const CHANNEL_ID = 'daily-reminder';

export type ReminderResult = 'ok' | 'denied' | 'error';

/**
 * Makes the phone's daily reminder match the choice: cancels the old one and, unless the choice
 * is "off", asks for permission (if needed) and schedules one repeating daily notification.
 * The notification text is fixed and never contains the user's data.
 */
export async function applyReminder(choice: ReminderChoice): Promise<ReminderResult> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
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
