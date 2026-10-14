import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { PREF_KEYS, readPreference, writePreference } from '../lib/preferences';
import { darkColors, lightColors } from '../ui/tokens';
import { ThemeContext, type ThemeValue } from './context';
import { parsePreference, resolveScheme, type ThemePreference } from './schemes';

/** Supplies colours to the whole app and remembers the user's light, dark or system choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    parsePreference(readPreference(PREF_KEYS.theme)),
  );

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writePreference(PREF_KEYS.theme, next);
  }, []);

  const scheme = resolveScheme(preference, systemScheme);

  const value = useMemo<ThemeValue>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      preference,
      setPreference,
    }),
    [scheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
