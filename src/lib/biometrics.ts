import * as LocalAuthentication from 'expo-local-authentication';

/** True when the phone has a fingerprint (or similar) sensor with at least one saved finger. */
export async function biometricsReady(): Promise<boolean> {
  try {
    return (
      (await LocalAuthentication.hasHardwareAsync()) &&
      (await LocalAuthentication.isEnrolledAsync())
    );
  } catch {
    return false;
  }
}

/** Asks for a fingerprint only (no phone passcode). Returns true when it matched. */
export async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'strong',
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Asks the person to prove it is them with the phone's own screen lock (fingerprint, pattern, PIN
 * or password). Returns true when they did.
 */
export async function authenticateWithPhoneLock(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
