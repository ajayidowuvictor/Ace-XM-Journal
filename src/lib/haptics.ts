/**
 * Small vibrations that confirm a touch. They never throw: if the phone cannot vibrate, or the
 * native module is missing (for example in tests), nothing happens.
 */

type HapticsModule = typeof import('expo-haptics');

function run(action: (haptics: HapticsModule) => Promise<void>): void {
  try {
    import('expo-haptics').then((haptics) => action(haptics)).catch(() => undefined);
  } catch {
    // Haptics are a nicety; ignore any failure.
  }
}

/** A light tap, for pressing a button. */
export function tapLight(): void {
  run((haptics) => haptics.impactAsync(haptics.ImpactFeedbackStyle.Light));
}

/** A tick, for choosing between options. */
export function selectionTick(): void {
  run((haptics) => haptics.selectionAsync());
}

/** A confirming buzz, for finishing something (ticking a task or a habit). */
export function success(): void {
  run((haptics) => haptics.notificationAsync(haptics.NotificationFeedbackType.Success));
}
