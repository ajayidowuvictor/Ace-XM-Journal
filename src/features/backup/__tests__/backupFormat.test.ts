import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

import { describe, expect, it } from '@jest/globals';

import {
  BACKUP_FORMAT,
  createBackupFile,
  openBackupFile,
  passwordProblem,
  readEnvelope,
  type BackupCrypto,
  type KdfParams,
} from '../backupFormat';

/** Real scrypt and AES-256-GCM from Node, standing in for the phone's own functions. */
const nodeCrypto: BackupCrypto = {
  deriveKey: async (password, salt, params: KdfParams) =>
    new Uint8Array(
      scryptSync(password, salt, 32, {
        N: params.N,
        r: params.r,
        p: params.p,
        maxmem: 128 * params.N * params.r * 2,
      }),
    ),
  encrypt: async (key, plaintext, aad) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(aad);
    const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return new Uint8Array(Buffer.concat([iv, body, cipher.getAuthTag()]));
  },
  decrypt: async (key, combined, aad) => {
    const buffer = Buffer.from(combined);
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(buffer.length - 16);
    const body = buffer.subarray(12, buffer.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    return new Uint8Array(Buffer.concat([decipher.update(body), decipher.final()]));
  },
  randomBytes: (count) => new Uint8Array(randomBytes(count)),
};

// A small work factor keeps the tests fast; the real one is much larger.
const FAST: KdfParams = { N: 2 ** 10, r: 8, p: 1 };
const PASSWORD = 'correct horse battery';
const DATA = JSON.stringify({ journal: 'Dear diary, “it works” 🙏', n: [1, 2, 3] });

describe('backup file', () => {
  it('opens with the right password and returns the data exactly', async () => {
    const file = await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST);
    const result = await openBackupFile(nodeCrypto, PASSWORD, file);
    expect(result).toEqual({ ok: true, plaintext: DATA });
  });

  it('does not contain the data or the password in readable form', async () => {
    const file = await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST);
    expect(file).not.toContain('Dear diary');
    expect(file).not.toContain(PASSWORD);
    expect(JSON.parse(file).format).toBe(BACKUP_FORMAT);
  });

  it('refuses a wrong password', async () => {
    const file = await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST);
    expect(await openBackupFile(nodeCrypto, 'correct horse battery!', file)).toEqual({
      ok: false,
      reason: 'wrong-password',
    });
  });

  it('refuses a file whose data was changed', async () => {
    const file = JSON.parse(await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST));
    const bytes = Buffer.from(file.data, 'base64');
    bytes[20] ^= 1;
    file.data = bytes.toString('base64');
    expect(await openBackupFile(nodeCrypto, PASSWORD, JSON.stringify(file))).toEqual({
      ok: false,
      reason: 'wrong-password',
    });
  });

  it('refuses a file whose settings were changed', async () => {
    const file = JSON.parse(await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST));
    file.kdf.N = 2 ** 11;
    expect((await openBackupFile(nodeCrypto, PASSWORD, JSON.stringify(file))).ok).toBe(false);
    const other = JSON.parse(await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST));
    other.kdf.salt = Buffer.from(randomBytes(16)).toString('base64');
    expect((await openBackupFile(nodeCrypto, PASSWORD, JSON.stringify(other))).ok).toBe(false);
  });

  it('gives a different file every time, even for the same data and password', async () => {
    const a = await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST);
    const b = await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST);
    expect(a).not.toBe(b);
  });

  it('treats the same password typed with different accent forms as equal', async () => {
    const composed = 'café café café';
    const decomposed = 'café café café';
    const file = await createBackupFile(nodeCrypto, composed, DATA, FAST);
    expect((await openBackupFile(nodeCrypto, decomposed, file)).ok).toBe(true);
  });

  it('handles a large backup', async () => {
    const big = JSON.stringify({ text: 'Long paragraph. '.repeat(100000) });
    const file = await createBackupFile(nodeCrypto, PASSWORD, big, FAST);
    expect(await openBackupFile(nodeCrypto, PASSWORD, file)).toEqual({ ok: true, plaintext: big });
  });
});

describe('readEnvelope', () => {
  it('recognises something that is not a backup', () => {
    expect(readEnvelope('hello')).toEqual({ ok: false, reason: 'not-backup' });
    expect(readEnvelope('{"format":"OTHER"}')).toEqual({ ok: false, reason: 'not-backup' });
    expect(readEnvelope('null')).toEqual({ ok: false, reason: 'not-backup' });
    expect(readEnvelope('[]')).toEqual({ ok: false, reason: 'not-backup' });
  });

  it('flags a newer version or odd settings as unsupported', async () => {
    const file = JSON.parse(await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST));
    expect(readEnvelope(JSON.stringify({ ...file, version: 2 }))).toEqual({
      ok: false,
      reason: 'unsupported',
    });
    for (const N of [3, 2 ** 9, 2 ** 20]) {
      expect(readEnvelope(JSON.stringify({ ...file, kdf: { ...file.kdf, N } }))).toEqual({
        ok: false,
        reason: 'unsupported',
      });
    }
  });

  it('reads a good file without a password', async () => {
    const file = await createBackupFile(nodeCrypto, PASSWORD, DATA, FAST);
    const result = readEnvelope(file);
    expect(result.ok).toBe(true);
  });
});

describe('passwordProblem', () => {
  it('asks for a long enough password that is not one repeated character', () => {
    expect(passwordProblem('short')).toMatch(/at least 10/);
    expect(passwordProblem('aaaaaaaaaaaa')).not.toBeNull();
    expect(passwordProblem('correct horse')).toBeNull();
  });
});
