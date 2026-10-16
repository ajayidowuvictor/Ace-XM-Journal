import { fromBase64, toBase64, utf8Decode, utf8Encode } from './bytes';

export const BACKUP_FORMAT = 'ACEXM-BACKUP';
export const BACKUP_VERSION = 1;
export const MIN_PASSWORD_LENGTH = 10;

/** scrypt work settings. They are written into every backup file, so they can be raised later. */
export type KdfParams = { N: number; r: number; p: number };

export const DEFAULT_KDF: KdfParams = { N: 2 ** 14, r: 8, p: 1 };

const SALT_BYTES = 16;
const MIN_N = 2 ** 10;
const MAX_N = 2 ** 17;

/** What the backup needs from the phone's security functions. Tests pass in plain stand-ins. */
export type BackupCrypto = {
  /** scrypt: turns the password and a salt into a 32-byte key. */
  deriveKey: (password: Uint8Array, salt: Uint8Array, params: KdfParams) => Promise<Uint8Array>;
  /** AES-256-GCM. Returns nonce + ciphertext + tag as one block. */
  encrypt: (key: Uint8Array, plaintext: Uint8Array, aad: Uint8Array) => Promise<Uint8Array>;
  /** Reverse of `encrypt`. Throws if the key is wrong or the data was changed. */
  decrypt: (key: Uint8Array, combined: Uint8Array, aad: Uint8Array) => Promise<Uint8Array>;
  randomBytes: (count: number) => Uint8Array;
};

type Envelope = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  kdf: { name: 'scrypt'; N: number; r: number; p: number; salt: string };
  cipher: 'AES-256-GCM';
  data: string;
};

/** A short reason the password cannot be used, or null if it is fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/^(.)\1+$/.test(password)) return 'Use more than one repeated character.';
  return null;
}

/** The password as bytes. Accented letters are normalised so the same password always matches. */
export function passwordBytes(password: string): Uint8Array {
  return utf8Encode(password.normalize('NFKC'));
}

function headerBytes(kdf: KdfParams, saltBase64: string): Uint8Array {
  return utf8Encode(
    [BACKUP_FORMAT, BACKUP_VERSION, 'scrypt', kdf.N, kdf.r, kdf.p, saltBase64, 'AES-256-GCM'].join(
      '|',
    ),
  );
}

/** Makes the text of a backup file: your data, sealed with a key made from your password. */
export async function createBackupFile(
  crypto: BackupCrypto,
  password: string,
  plaintext: string,
  kdf: KdfParams = DEFAULT_KDF,
): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const saltBase64 = toBase64(salt);
  const key = await crypto.deriveKey(passwordBytes(password), salt, kdf);
  const sealed = await crypto.encrypt(key, utf8Encode(plaintext), headerBytes(kdf, saltBase64));

  const envelope: Envelope = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    kdf: { name: 'scrypt', ...kdf, salt: saltBase64 },
    cipher: 'AES-256-GCM',
    data: toBase64(sealed),
  };
  return JSON.stringify(envelope);
}

export type ParsedEnvelope = {
  kdf: KdfParams;
  salt: Uint8Array;
  saltBase64: string;
  data: Uint8Array;
};

export type EnvelopeResult =
  { ok: true; envelope: ParsedEnvelope } | { ok: false; reason: 'not-backup' | 'unsupported' };

function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

/** Checks the outside of a backup file without needing the password. */
export function readEnvelope(fileText: string): EnvelopeResult {
  let value: unknown;
  try {
    value = JSON.parse(fileText);
  } catch {
    return { ok: false, reason: 'not-backup' };
  }
  const file = value as Partial<Envelope> | null;
  if (!file || typeof file !== 'object' || file.format !== BACKUP_FORMAT) {
    return { ok: false, reason: 'not-backup' };
  }
  if (file.version !== BACKUP_VERSION || file.cipher !== 'AES-256-GCM') {
    return { ok: false, reason: 'unsupported' };
  }
  const kdf = file.kdf;
  if (
    !kdf ||
    kdf.name !== 'scrypt' ||
    typeof kdf.salt !== 'string' ||
    typeof file.data !== 'string'
  ) {
    return { ok: false, reason: 'not-backup' };
  }
  if (!isPowerOfTwo(kdf.N) || kdf.N < MIN_N || kdf.N > MAX_N || kdf.r !== 8 || kdf.p !== 1) {
    return { ok: false, reason: 'unsupported' };
  }
  const salt = fromBase64(kdf.salt);
  const data = fromBase64(file.data);
  if (!salt || salt.length !== SALT_BYTES || !data) return { ok: false, reason: 'not-backup' };
  return {
    ok: true,
    envelope: { kdf: { N: kdf.N, r: kdf.r, p: kdf.p }, salt, saltBase64: kdf.salt, data },
  };
}

export type OpenResult =
  | { ok: true; plaintext: string }
  | { ok: false; reason: 'not-backup' | 'unsupported' | 'wrong-password' };

/** Opens a backup file with the password. A wrong password and a damaged file look the same. */
export async function openBackupFile(
  crypto: BackupCrypto,
  password: string,
  fileText: string,
): Promise<OpenResult> {
  const read = readEnvelope(fileText);
  if (!read.ok) return read;
  const { kdf, salt, saltBase64, data } = read.envelope;

  try {
    const key = await crypto.deriveKey(passwordBytes(password), salt, kdf);
    const opened = await crypto.decrypt(key, data, headerBytes(kdf, saltBase64));
    const plaintext = utf8Decode(opened);
    return plaintext === null ? { ok: false, reason: 'wrong-password' } : { ok: true, plaintext };
  } catch {
    return { ok: false, reason: 'wrong-password' };
  }
}
