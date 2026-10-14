import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { PREF_KEYS, readPreference, writePreference } from '../../lib/preferences';

type OnboardingValue = {
  completed: boolean;
  displayName: string;
  /** Marks first-run setup as done and optionally saves the name to greet the user with. */
  complete: (name?: string) => void;
};

const OnboardingContext = createContext<OnboardingValue>({
  completed: false,
  displayName: '',
  complete: () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState(
    () => readPreference(PREF_KEYS.onboardingComplete) === 'true',
  );
  const [displayName, setDisplayName] = useState(() => readPreference(PREF_KEYS.displayName) ?? '');

  const complete = useCallback((name?: string) => {
    const trimmed = (name ?? '').trim();
    if (trimmed) {
      writePreference(PREF_KEYS.displayName, trimmed);
      setDisplayName(trimmed);
    }
    writePreference(PREF_KEYS.onboardingComplete, 'true');
    setCompleted(true);
  }, []);

  const value = useMemo(
    () => ({ completed, displayName, complete }),
    [completed, displayName, complete],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingValue {
  return useContext(OnboardingContext);
}
