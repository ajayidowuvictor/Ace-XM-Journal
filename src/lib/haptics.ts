import * as Haptics from 'expo-haptics';

/**
 * Small vibrations that confirm a touch. They never throw: if the phone cannot vibrate, nothing
 * happens.
 */

function run(action: () => Promise<void>): void {
  try {
    action().catch(() => undefined);
  } catch {
    // Haptics are a nicety; ignore any failure.
  }
}

/** A light tap, for pressing a button. */
export function tapLight(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A tick, for choosing between options. */
export function selectionTick(): void {
  run(() => Haptics.selectionAsync());
}

/** A confirming buzz, for finishing something (ticking a task or a habit). */
export function success(): void {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
