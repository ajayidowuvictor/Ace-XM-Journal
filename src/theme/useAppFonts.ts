import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';

/** How long to wait for the fonts before showing the app with the phone's own font instead. */
const FONT_WAIT_MS = 4000;

/**
 * Loads the app's font (Inter). Returns true once the fonts are ready, or once loading has failed
 * or taken too long, so a font problem can never keep the app stuck on the splash screen.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  return loaded || error !== null || timedOut;
}
