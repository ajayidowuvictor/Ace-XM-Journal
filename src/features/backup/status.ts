import { addDays, toLocalDateString } from '../../lib/dates';

/** A backup older than this many days is "due". */
export const BACKUP_DUE_DAYS = 7;
/** "Not now" hides the reminder for this many days. */
export const SNOOZE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since the backup was made, or null when there is none (or the time is unreadable). */
export function daysSinceBackup(lastIso: string | null, now: Date): number | null {
  if (!lastIso) return null;
  const made = Date.parse(lastIso);
  if (!Number.isFinite(made)) return null;
  return Math.max(0, Math.floor((now.getTime() - made) / DAY_MS));
}

/** Such as "Last backup file made today" or "No backup made yet". */
export function describeLastBackup(lastIso: string | null, now: Date): string {
  const days = daysSinceBackup(lastIso, now);
  if (days === null) return 'No backup made yet.';
  if (days === 0) return 'Last backup file made today.';
  if (days === 1) return 'Last backup file made yesterday.';
  return `Last backup file made ${days} days ago.`;
}

/** The first day the reminder may show again after "Not now". */
export function snoozeUntil(now: Date): string {
  return addDays(now, SNOOZE_DAYS);
}

/**
 * True when the Home screen should ask for a backup: there is something to lose, the last backup
 * is missing or a week old, and the person has not just tapped "Not now".
 */
export function shouldNudge(
  lastIso: string | null,
  snoozedUntil: string | null,
  now: Date,
  hasData: boolean,
): boolean {
  if (!hasData) return false;
  const days = daysSinceBackup(lastIso, now);
  if (days !== null && days < BACKUP_DUE_DAYS) return false;
  if (snoozedUntil && toLocalDateString(now) < snoozedUntil) return false;
  return true;
}
