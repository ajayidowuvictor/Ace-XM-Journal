import Storage from 'expo-sqlite/kv-store';

/** Keys for small app preferences stored on the device. */
export const PREF_KEYS = {
  theme: 'theme-preference',
  onboardingComplete: 'onboarding-complete',
  displayName: 'display-name',
  reminder: 'daily-reminder',
  taskNames: 'task-reminder-names',
  readerSize: 'reader-text-size',
  lockEnabled: 'app-lock-enabled',
  lockDelay: 'app-lock-delay',
  lockBiometric: 'app-lock-biometric',
  lockAttempts: 'app-lock-attempts',
  lastBackup: 'last-backup-at',
  backupSnooze: 'backup-nudge-snooze',
  appDataMoved: 'app-data-encrypted',
  sounds: 'ui-sounds',
  widgetNames: 'widget-names',
} as const;

/** Reads a stored preference. Returns null if nothing is stored or storage is unavailable. */
export function readPreference(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

/** Saves a preference. Returns false if it could not be saved. Values are never logged. */
export function writePreference(key: string, value: string): boolean {
  try {
    Storage.setItemSync(key, value);
    return true;
  } catch {
    return false;
  }
}
