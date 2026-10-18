export type ReminderChoice = 'off' | 'morning' | 'afternoon' | 'evening';

export const REMINDER_OPTIONS: readonly { value: ReminderChoice; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'morning', label: '8:00' },
  { value: 'afternoon', label: '13:00' },
  { value: 'evening', label: '20:00' },
];

const TIMES: Record<Exclude<ReminderChoice, 'off'>, { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 0 },
  afternoon: { hour: 13, minute: 0 },
  evening: { hour: 20, minute: 0 },
};

export function parseReminderChoice(value: string | null): ReminderChoice {
  return value === 'morning' || value === 'afternoon' || value === 'evening' ? value : 'off';
}

/** The daily time for a choice, or null when reminders are off. */
export function reminderTime(choice: ReminderChoice): { hour: number; minute: number } | null {
  return choice === 'off' ? null : TIMES[choice];
}

/** The fixed text of the reminder. It never contains anything from the user's data. */
export const REMINDER_TITLE = 'Ace Notes';
export const REMINDER_BODY = 'Take a minute to plan your day and check in with yourself.';

/** The fixed text of the test reminder. */
export const TEST_BODY = 'This is a test. Reminders can reach you on this phone.';

/** What is waiting on the phone, in plain words. */
export function describeScheduled(daily: boolean, taskReminders: number, test: boolean): string {
  const parts = [
    daily ? 'The daily reminder is set.' : 'No daily reminder is set.',
    taskReminders === 0
      ? 'No task reminders are waiting.'
      : `${taskReminders} task ${taskReminders === 1 ? 'reminder is' : 'reminders are'} waiting.`,
  ];
  if (test) parts.push('A test reminder is on its way.');
  return parts.join(' ');
}

/** What an Android channel importance number means for the person, in plain words. */
export function describeImportance(importance: number): string {
  if (importance === 0) return 'turned off (it will never show)';
  if (importance <= 2) return 'quiet (no pop-up and no sound)';
  if (importance === 3) return 'sound only (no pop-up)';
  if (importance >= 4) return 'pop-up with sound';
  return 'unknown';
}
