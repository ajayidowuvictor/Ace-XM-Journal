import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { applyReminder, installNotificationHandler, scheduleTestReminder } from '../service';

type Args = unknown[];
const mockSetChannel = jest.fn((..._args: Args) => Promise.resolve(null));
const mockDeleteChannel = jest.fn((..._args: Args) => Promise.resolve(undefined));
const mockSchedule = jest.fn((..._args: Args) => Promise.resolve('id'));
const mockSetHandler = jest.fn((..._args: Args) => undefined);

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
  getAllScheduledNotificationsAsync: async () => [],
  cancelScheduledNotificationAsync: async () => undefined,
  getPermissionsAsync: async () => ({ granted: true }),
  requestPermissionsAsync: async () => ({ granted: true }),
  setNotificationChannelAsync: (...args: Args) => mockSetChannel(...args),
  deleteNotificationChannelAsync: (...args: Args) => mockDeleteChannel(...args),
  scheduleNotificationAsync: (...args: Args) => mockSchedule(...args),
  setNotificationHandler: (...args: Args) => mockSetHandler(...args),
}));

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../../../lib/preferences', () => ({
  PREF_KEYS: { reminder: 'daily-reminder', taskNames: 'task-names' },
  readPreference: () => null,
}));

describe('reminder channels', () => {
  beforeEach(() => {
    mockSetChannel.mockClear();
    mockDeleteChannel.mockClear();
    mockSchedule.mockClear();
    mockSetHandler.mockClear();
  });

  it('makes a pop-up channel with the chime and removes the old quiet ones', async () => {
    expect(await applyReminder('evening')).toBe('ok');
    expect(mockDeleteChannel).toHaveBeenCalledWith('daily-reminder');
    expect(mockDeleteChannel).toHaveBeenCalledWith('task-reminders');
    expect(mockSetChannel).toHaveBeenCalledWith(
      'daily-reminder-v2',
      expect.objectContaining({ importance: 4, sound: 'chime.wav' }),
    );
  });

  it('schedules the daily reminder on the new channel', async () => {
    await applyReminder('evening');
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ channelId: 'daily-reminder-v2' }),
      }),
    );
  });

  it('sends the test reminder on the new channel too', async () => {
    expect(await scheduleTestReminder(new Date(2026, 9, 18, 9, 0))).toBe('ok');
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ channelId: 'daily-reminder-v2' }),
      }),
    );
  });

  it('shows and sounds reminders that arrive while the app is open', async () => {
    installNotificationHandler();
    expect(mockSetHandler).toHaveBeenCalledTimes(1);
    const call = mockSetHandler.mock.calls[0] as unknown as [
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
