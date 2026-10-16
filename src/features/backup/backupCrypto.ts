import { scryptAsync } from '@noble/hashes/scrypt.js';
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
  getRandomBytes,
} from 'expo-crypto';

import type { BackupCrypto } from './backupFormat';

/**
 * The phone's real security functions for backups: scrypt (a deliberately slow password check, from
 * the audited noble library) and AES-256-GCM (from the phone's own crypto).
 */
export const phoneCrypto: BackupCrypto = {
  deriveKey: (password, salt, params) =>
    scryptAsync(password, salt, { N: params.N, r: params.r, p: params.p, dkLen: 32 }),

  async encrypt(key, plaintext, aad) {
    const aesKey = await AESEncryptionKey.import(key);
    const sealed = await aesEncryptAsync(plaintext, aesKey, { additionalData: aad });
    return (await sealed.combined()) as Uint8Array;
  },

  async decrypt(key, combined, aad) {
    const aesKey = await AESEncryptionKey.import(key);
    const sealed = AESSealedData.fromCombined(combined);
    const opened = await aesDecryptAsync(sealed, aesKey, { additionalData: aad, output: 'bytes' });
    return opened as Uint8Array;
  },

  randomBytes: (count) => getRandomBytes(count),
};
