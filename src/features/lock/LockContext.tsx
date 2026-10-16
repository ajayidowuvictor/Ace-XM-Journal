import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { appPin } from '../../lib/appPin';
import {
  authenticateBiometric,
  authenticateWithPhoneLock,
  biometricsReady,
} from '../../lib/biometrics';
import { PREF_KEYS, readPreference, writePreference } from '../../lib/preferences';
import {
  NO_ATTEMPTS,
  parseAttemptState,
  parseLockDelay,
  recordFailure,
  remainingWaitSeconds,
  shouldLock,
  type AttemptState,
  type LockDelay,
} from './logic';

export type PinCheck = 'ok' | 'wrong' | 'wait';

type LockValue = {
  /** Is the app lock turned on? */
  enabled: boolean;
  /** Is the app locked right now? */
  locked: boolean;
  delay: LockDelay;
  /** Fingerprint unlock is switched on (and the phone has a sensor with a saved finger). */
  biometric: boolean;
  /** The phone has a fingerprint sensor with a saved finger, so it can be switched on. */
  biometricAvailable: boolean;
  /** Seconds the person must still wait after too many wrong PINs. */
  waitSeconds: number;
  /** Checks a PIN. On success the app unlocks. */
  checkPin: (pin: string) => Promise<PinCheck>;
  /** Checks a PIN without unlocking (for changing settings). */
  confirmPin: (pin: string) => Promise<boolean>;
  /** Asks for the fingerprint. On success the app unlocks. */
  unlockWithFingerprint: () => Promise<boolean>;
  /** Turns the lock on with a new PIN, or changes the PIN. Returns true when saved. */
  savePin: (pin: string) => Promise<boolean>;
  /** Turns the lock off and forgets the PIN. */
  turnOff: () => Promise<void>;
  /** Uses the phone's own screen lock to prove it is the owner, then turns the app lock off. */
  resetWithPhoneLock: () => Promise<boolean>;
  setDelay: (delay: LockDelay) => void;
  /** Switches fingerprint unlock on (after one successful fingerprint) or off. */
  setBiometric: (on: boolean) => Promise<boolean>;
  /** Runs work (such as opening the share sheet) without locking the app when it comes back. */
  withoutLock: <T>(work: () => Promise<T>) => Promise<T>;
};

const LockContext = createContext<LockValue>({
  enabled: false,
  locked: false,
  delay: 'now',
  biometric: false,
  biometricAvailable: false,
  waitSeconds: 0,
  checkPin: async () => 'wrong',
  confirmPin: async () => false,
  unlockWithFingerprint: async () => false,
  savePin: async () => false,
  turnOff: async () => {},
  resetWithPhoneLock: async () => false,
  setDelay: () => {},
  setBiometric: async () => false,
  withoutLock: (work) => work(),
});

/** How long after shared work ends the app still ignores "came back from another app". */
const GRACE_MS = 1500;

export function LockProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => readPreference(PREF_KEYS.lockEnabled) === '1');
  const [locked, setLocked] = useState(enabled);
  const [delay, setDelayState] = useState<LockDelay>(() =>
    parseLockDelay(readPreference(PREF_KEYS.lockDelay)),
  );
  const [biometric, setBiometricState] = useState(
    () => readPreference(PREF_KEYS.lockBiometric) === '1',
  );
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [attempts, setAttempts] = useState<AttemptState>(() =>
    parseAttemptState(readPreference(PREF_KEYS.lockAttempts)),
  );
  const [now, setNow] = useState(() => Date.now());

  const leftAt = useRef<number | null>(null);
  const busyWork = useRef(0);
  const graceUntil = useRef(0);

  useEffect(() => {
    let alive = true;
    biometricsReady().then((ready) => {
      if (alive) setBiometricAvailable(ready);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Lock when the person comes back after being away for the chosen time.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        leftAt.current = Date.now();
        return;
      }
      if (state !== 'active') return;
      const when = Date.now();
      const ignore = busyWork.current > 0 || when < graceUntil.current;
      if (enabled && !ignore && shouldLock(leftAt.current, when, delay)) setLocked(true);
      leftAt.current = null;
      setNow(when);
    });
    return () => subscription.remove();
  }, [enabled, delay]);

  // While waiting after wrong PINs, tick once a second so the countdown moves.
  const waiting = remainingWaitSeconds(attempts, now) > 0;
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  const saveAttempts = useCallback((next: AttemptState) => {
    setAttempts(next);
    writePreference(PREF_KEYS.lockAttempts, JSON.stringify(next));
  }, []);

  const checkPin = useCallback(
    async (pin: string): Promise<PinCheck> => {
      const when = Date.now();
      setNow(when);
      if (remainingWaitSeconds(attempts, when) > 0) return 'wait';
      if (await appPin.checkPin(pin)) {
        saveAttempts(NO_ATTEMPTS);
        setLocked(false);
        return 'ok';
      }
      const next = recordFailure(attempts, when);
      saveAttempts(next);
      return remainingWaitSeconds(next, when) > 0 ? 'wait' : 'wrong';
    },
    [attempts, saveAttempts],
  );

  const confirmPin = useCallback(
    async (pin: string) => {
      const when = Date.now();
      setNow(when);
      if (remainingWaitSeconds(attempts, when) > 0) return false;
      if (await appPin.checkPin(pin)) {
        saveAttempts(NO_ATTEMPTS);
        return true;
      }
      saveAttempts(recordFailure(attempts, when));
      return false;
    },
    [attempts, saveAttempts],
  );

  const unlockWithFingerprint = useCallback(async () => {
    if (!biometric) return false;
    const ok = await authenticateBiometric('Unlock ACE XM JOURNAL');
    if (ok) setLocked(false);
    return ok;
  }, [biometric]);

  const savePin = useCallback(
    async (pin: string) => {
      try {
        await appPin.setPin(pin);
      } catch {
        return false;
      }
      writePreference(PREF_KEYS.lockEnabled, '1');
      setEnabled(true);
      saveAttempts(NO_ATTEMPTS);
      return true;
    },
    [saveAttempts],
  );

  const turnOff = useCallback(async () => {
    await appPin.clear().catch(() => undefined);
    writePreference(PREF_KEYS.lockEnabled, '0');
    writePreference(PREF_KEYS.lockBiometric, '0');
    setEnabled(false);
    setBiometricState(false);
    setLocked(false);
    saveAttempts(NO_ATTEMPTS);
  }, [saveAttempts]);

  const resetWithPhoneLock = useCallback(async () => {
    busyWork.current += 1;
    try {
      const ok = await authenticateWithPhoneLock('Confirm it is you to reset the app PIN');
      if (ok) await turnOff();
      return ok;
    } finally {
      busyWork.current -= 1;
      graceUntil.current = Date.now() + GRACE_MS;
    }
  }, [turnOff]);

  const setDelay = useCallback((next: LockDelay) => {
    setDelayState(next);
    writePreference(PREF_KEYS.lockDelay, next);
  }, []);

  const setBiometric = useCallback(
    async (on: boolean) => {
      if (!on) {
        writePreference(PREF_KEYS.lockBiometric, '0');
        setBiometricState(false);
        return true;
      }
      if (!biometricAvailable) return false;
      busyWork.current += 1;
      try {
        // One successful fingerprint proves it works before it is switched on.
        const ok = await authenticateBiometric('Touch the sensor to turn on fingerprint unlock');
        if (ok) {
          writePreference(PREF_KEYS.lockBiometric, '1');
          setBiometricState(true);
        }
        return ok;
      } finally {
        busyWork.current -= 1;
        graceUntil.current = Date.now() + GRACE_MS;
      }
    },
    [biometricAvailable],
  );

  const withoutLock = useCallback(async <T,>(work: () => Promise<T>): Promise<T> => {
    busyWork.current += 1;
    try {
      return await work();
    } finally {
      busyWork.current -= 1;
      graceUntil.current = Date.now() + GRACE_MS;
    }
  }, []);

  const value = useMemo<LockValue>(
    () => ({
      enabled,
      locked: enabled && locked,
      delay,
      biometric: biometric && biometricAvailable,
      biometricAvailable,
      waitSeconds: remainingWaitSeconds(attempts, now),
      checkPin,
      confirmPin,
      unlockWithFingerprint,
      savePin,
      turnOff,
      resetWithPhoneLock,
      setDelay,
      setBiometric,
      withoutLock,
    }),
    [
      enabled,
      locked,
      delay,
      biometric,
      biometricAvailable,
      attempts,
      now,
      checkPin,
      confirmPin,
      unlockWithFingerprint,
      savePin,
      turnOff,
      resetWithPhoneLock,
      setDelay,
      setBiometric,
      withoutLock,
    ],
  );

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
}

export function useLock(): LockValue {
  return useContext(LockContext);
}
