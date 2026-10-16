import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createPinStore } from '../features/lock/pinStore';

const KEY = 'app-lock-pin';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The app lock's PIN, kept in the phone's secure storage as a salted fingerprint. */
export const appPin = createPinStore({
  read: () => SecureStore.getItemAsync(KEY),
  write: (value) => SecureStore.setItemAsync(KEY, value),
  remove: () => SecureStore.deleteItemAsync(KEY),
  randomHex: (bytes) => toHex(Crypto.getRandomBytes(bytes)),
  sha256Hex: (text) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text),
});
