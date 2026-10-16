export const PIN_LENGTH = 6;

/** A PIN is exactly six digits. */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export type LockDelay = 'now' | '1m' | '5m';

export const LOCK_DELAY_OPTIONS: readonly { value: LockDelay; label: string; seconds: number }[] = [
  { value: 'now', label: 'Right away', seconds: 0 },
  { value: '1m', label: '1 minute', seconds: 60 },
  { value: '5m', label: '5 minutes', seconds: 300 },
];

/** Reads a saved choice. Anything unknown gives the safest choice, "Right away". */
export function parseLockDelay(raw: string | null): LockDelay {
  return LOCK_DELAY_OPTIONS.some((option) => option.value === raw) ? (raw as LockDelay) : 'now';
}

export function delaySeconds(delay: LockDelay): number {
  return LOCK_DELAY_OPTIONS.find((option) => option.value === delay)?.seconds ?? 0;
}

/**
 * Should the app lock when the user comes back? `leftAt` is when the app went out of sight
 * (milliseconds), or null if it never did. If the clock went backwards, it locks to be safe.
 */
export function shouldLock(leftAt: number | null, now: number, delay: LockDelay): boolean {
  if (leftAt === null) return false;
  const away = now - leftAt;
  if (away < 0) return true;
  return away >= delaySeconds(delay) * 1000;
}

export type AttemptState = { failed: number; lockedUntil: number };

export const NO_ATTEMPTS: AttemptState = { failed: 0, lockedUntil: 0 };

const MAX_WAIT_SECONDS = 900;

/** How long to wait after this many wrong PINs in a row. The first four are free. */
export function waitAfterFailures(failed: number): number {
  if (failed < 5) return 0;
  if (failed === 5) return 30;
  if (failed === 6) return 60;
  if (failed === 7) return 300;
  return MAX_WAIT_SECONDS;
}

export function recordFailure(state: AttemptState, now: number): AttemptState {
  const failed = state.failed + 1;
  const wait = waitAfterFailures(failed);
  return { failed, lockedUntil: wait > 0 ? now + wait * 1000 : state.lockedUntil };
}

/** Whole seconds still to wait, never more than the longest wait (protects against a changed clock). */
export function remainingWaitSeconds(state: AttemptState, now: number): number {
  const ms = state.lockedUntil - now;
  if (ms <= 0) return 0;
  return Math.min(MAX_WAIT_SECONDS, Math.ceil(ms / 1000));
}

export function parseAttemptState(raw: string | null): AttemptState {
  if (!raw) return NO_ATTEMPTS;
  try {
    const value = JSON.parse(raw) as Partial<AttemptState>;
    const failed = Number(value.failed);
    const lockedUntil = Number(value.lockedUntil);
    if (!Number.isInteger(failed) || failed < 0 || !Number.isFinite(lockedUntil)) {
      return NO_ATTEMPTS;
    }
    return { failed, lockedUntil: Math.max(0, lockedUntil) };
  } catch {
    return NO_ATTEMPTS;
  }
}

/** Such as "30 seconds" or "2 minutes". */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

/** Compares two strings without stopping at the first difference. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}
