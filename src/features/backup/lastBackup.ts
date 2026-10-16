import { useSyncExternalStore } from 'react';

import { PREF_KEYS, readPreference, writePreference } from '../../lib/preferences';

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** When the last backup file was made (UTC time), or null. Updates screens when it changes. */
export function useLastBackup(): string | null {
  return useSyncExternalStore(subscribe, () => readPreference(PREF_KEYS.lastBackup));
}

/** The day ("YYYY-MM-DD") until which the Home reminder is hidden, or null. */
export function useBackupSnooze(): string | null {
  return useSyncExternalStore(subscribe, () => readPreference(PREF_KEYS.backupSnooze));
}

export function recordBackup(nowIso: string): void {
  writePreference(PREF_KEYS.lastBackup, nowIso);
  notify();
}

export function snoozeBackupNudge(untilDate: string): void {
  writePreference(PREF_KEYS.backupSnooze, untilDate);
  notify();
}
