import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let current = false;
let started = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (value === current) return;
  current = value;
  listeners.forEach((listener) => listener());
}

function start() {
  if (started) return;
  started = true;
  try {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(set)
      .catch(() => undefined);
    AccessibilityInfo.addEventListener('reduceMotionChanged', set);
  } catch {
    // Without the setting we simply keep the normal animation.
  }
}

function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True when the person has asked the phone to cut back on animation. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => false,
  );
}
