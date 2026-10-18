import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const setNotificationChannelAsync = jest.fn(async () => null);
const deleteNotificationChannelAsync = jest.fn(async () => undefined);
const scheduleNotificationAsync = jest.fn(async () => 'id');
const setNotificationHandler = jest.fn();

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
  getAllScheduledNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async () => undefined,
  getPermissionsAsync: async () => ({ granted: true }),
  requestPermissionsAsync: async () => ({ granted: true }),
  setNotificationChannelAsync,
  deleteNotificationChannelAsync,
  scheduleNotificationAsync,
  setNotificationHandler,
}));

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../../../lib/preferences', () => ({
  PREF_KEYS: { reminder: 'daily-reminder', taskNames: 'task-names' },
  readPreference: () => null,
}));

import { applyReminder, installNotificationHandler, scheduleTestReminder } from '../service';

describe('reminder channels', () => {
  beforeEach(() => {
    setNotificationChannelAsync.mockClear();
    deleteNotificationChannelAsync.mockClear();
    scheduleNotificationAsync.mockClear();
    setNotificationHandler.mockClear();
  });

  it('makes a pop-up channel with the chime and removes the old quiet ones', async () => {
    expect(await applyReminder('evening')).toBe('ok');
    expect(deleteNotificationChannelAsync).toHaveBeenCalledWith('daily-reminder');
    expect(deleteNotificationChannelAsync).toHaveBeenCalledWith('task-reminders');
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'daily-reminder-v2',
      expect.objectContaining({ importance: 4, sound: 'chime.wav' }),
    );
  });

  it('schedules the daily reminder on the new channel', async () => {
    await applyReminder('evening');
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ channelId: 'daily-reminder-v2' }),
      }),
    );
  });

  it('sends the test reminder on the new channel too', async () => {
    expect(await scheduleTestReminder(new Date(2026, 9, 18, 9, 0))).toBe('ok');
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ channelId: 'daily-reminder-v2' }),
      }),
    );
  });

  it('shows and sounds reminders that arrive while the app is open', async () => {
    installNotificationHandler();
    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    const call = setNotificationHandler.mock.calls[0] as unknown as [
      { handleNotification: () => Promise<Record<string, boolean>> },
    ];
    expect(await call[0].handleNotification()).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });
});
