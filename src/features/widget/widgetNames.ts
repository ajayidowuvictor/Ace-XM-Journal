import { useSyncExternalStore } from 'react';

import { PREF_KEYS, readPreference, writePreference } from '../../lib/preferences';
import { parseWidgetNames, type WidgetNames } from './logic';

let current: WidgetNames | null = null;
const listeners = new Set<() => void>();

function read(): WidgetNames {
  if (current === null) {
    try {
      current = parseWidgetNames(readPreference(PREF_KEYS.widgetNames));
    } catch {
      current = 'hidden';
    }
  }
  return current;
}

/** Whether the home-screen widget may show task and block names. Hidden by default. */
export function setWidgetNames(value: WidgetNames): void {
  current = value;
  try {
    writePreference(PREF_KEYS.widgetNames, value);
  } catch {
    // The choice still applies until the app closes.
  }
  listeners.forEach((listener) => listener());
}

export function useWidgetNames(): WidgetNames {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read,
    () => 'hidden',
  );
}
