import { createContext, useContext } from 'react';

import { lightColors, type ColorTokens } from '../ui/tokens';
import type { ColorScheme, ThemePreference } from './schemes';

export type ThemeValue = {
  colors: ColorTokens;
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

/** Defaults to the light theme so components also work without a provider (for example in tests). */
export const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  scheme: 'light',
  preference: 'system',
  setPreference: () => {},
});

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
