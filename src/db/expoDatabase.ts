import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseSync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { getOrCreateAppKey, type SyncKeyStore } from '../lib/appKey';
import { PREF_KEYS, readPreference, writePreference } from '../lib/preferences';
import { migrate } from './migrations';
import { copyAppData } from './moveAppData';
import type { SqlDatabase, SqlValue } from './types';

/** The old, unencrypted file that earlier versions used. */
const PLAIN_NAME = 'acexm.db';
/** The encrypted file (SQLCipher) that holds tasks, habits, goals and day plans. */
const ENCRYPTED_NAME = 'appdata.db';
const KEY_NAME = 'app-encryption-key';

const keyStore: SyncKeyStore = {
  get: () => SecureStore.getItem(KEY_NAME),
  set: (value) => SecureStore.setItem(KEY_NAME, value),
};

function wrap(native: SQLiteDatabase): SqlDatabase {
  return {
    exec: (sql) => native.execSync(sql),
    run: (sql, params: SqlValue[] = []) => {
      native.runSync(sql, params);
    },
    all: <T>(sql: string, params: SqlValue[] = []) => native.getAllSync<T>(sql, params),
    first: <T>(sql: string, params: SqlValue[] = []) => native.getFirstSync<T>(sql, params),
    transaction: (work) => native.withTransactionSync(work),
  };
}

/** Opens the encrypted file. Fails here, before anything else runs, if the key does not match. */
function openEncrypted(): SqlDatabase {
  const key = getOrCreateAppKey(keyStore, getRandomBytes);
  const native = openDatabaseSync(ENCRYPTED_NAME);
  // A raw 256-bit key written as x'<hex>' (the key is hex only, so it is safe in this statement).
  native.execSync(`PRAGMA key = "x'${key}'"`);
  native.getFirstSync('SELECT count(*) FROM sqlite_master');
  const db = wrap(native);
  migrate(db);
  return db;
}

/** Removes the old unencrypted file. Best effort: a leftover is tried again at the next start. */
function removePlainFile(): void {
  try {
    deleteDatabaseSync(PLAIN_NAME);
  } catch {
    // Nothing to remove, or it could not be removed now.
  }
}

/**
 * Moves everything from the old unencrypted file into the encrypted one, once. The old file is
 * removed only after the copy has been checked, so a failure leaves the data where it was.
 */
function moveOldData(encrypted: SqlDatabase): void {
  if (readPreference(PREF_KEYS.appDataMoved) === '1') {
    removePlainFile();
    return;
  }
  const plainNative = openDatabaseSync(PLAIN_NAME);
  const plain = wrap(plainNative);
  migrate(plain);
  copyAppData(plain, encrypted);
  if (!writePreference(PREF_KEYS.appDataMoved, '1')) {
    throw new Error('The move could not be recorded.');
  }
  plainNative.closeSync();
  removePlainFile();
}

/** Opens the old unencrypted file. Only used if the encrypted file cannot be opened. */
function openPlain(): SqlDatabase {
  const db = wrap(openDatabaseSync(PLAIN_NAME));
  migrate(db);
  return db;
}

let cached: { db: SqlDatabase; encrypted: boolean } | null = null;

/**
 * Opens the app's on-device database for tasks, habits, goals and day plans, and brings it up to
 * date. The same connection is shared by everything. Data is encrypted with a key kept in the
 * phone's secure storage. If the encrypted file cannot be opened, the app keeps working on the old
 * unencrypted file instead of losing anything, and tries again at the next start. Never logs
 * stored values.
 */
export function openAppDatabase(): SqlDatabase {
  if (cached) return cached.db;
  try {
    const encrypted = openEncrypted();
    moveOldData(encrypted);
    cached = { db: encrypted, encrypted: true };
  } catch (error) {
    // Once the data has moved, the old file is gone, so a fallback would only show an empty app
    // and anything saved there would be lost. Report the problem instead.
    if (readPreference(PREF_KEYS.appDataMoved) === '1') throw error;
    cached = { db: openPlain(), encrypted: false };
  }
  return cached.db;
}

/** True when tasks, habits and goals are stored in the encrypted file. */
export function isAppDataEncrypted(): boolean {
  try {
    openAppDatabase();
    return cached?.encrypted ?? false;
  } catch {
    return false;
  }
}
