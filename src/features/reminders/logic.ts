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
export const REMINDER_TITLE = 'ACE XM JOURNAL';
export const REMINDER_BODY = 'Take a minute to plan your day and check in with yourself.';
