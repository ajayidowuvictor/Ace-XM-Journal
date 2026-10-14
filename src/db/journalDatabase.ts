import { getRandomBytes } from 'expo-crypto';
import { openDatabaseSync } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

import { getOrCreateJournalKey, type KeyStore } from '../lib/journalKey';
import { journalMigrations } from './journalMigrations';
import { migrate } from './migrations';
import type { SqlDatabase, SqlValue } from './types';

const DATABASE_NAME = 'journal.db';
const KEY_NAME = 'journal-encryption-key';

const keyStore: KeyStore = {
  get: () => SecureStore.getItemAsync(KEY_NAME),
  set: (value) => SecureStore.setItemAsync(KEY_NAME, value),
};

/**
 * Opens the encrypted journal database (SQLCipher). The key is random, created on first use and
 * kept in the phone's secure storage. Throws if the journal cannot be unlocked. It never deletes
 * or recreates an existing journal, and never logs journal text.
 */
export async function openJournalDatabase(): Promise<SqlDatabase> {
  const key = await getOrCreateJournalKey(keyStore, getRandomBytes);
  const native = openDatabaseSync(DATABASE_NAME);

  // A raw 256-bit key written as x'<hex>' (the key is hex only, so it is safe in this statement).
  native.execSync(`PRAGMA key = "x'${key}'"`);
  // Fails here, before anything else runs, if the key does not match the file.
  native.getFirstSync('SELECT count(*) FROM sqlite_master');

  const db: SqlDatabase = {
    exec: (sql) => native.execSync(sql),
    run: (sql, params: SqlValue[] = []) => {
      native.runSync(sql, params);
    },
    all: <T>(sql: string, params: SqlValue[] = []) => native.getAllSync<T>(sql, params),
    first: <T>(sql: string, params: SqlValue[] = []) => native.getFirstSync<T>(sql, params),
    transaction: (work) => native.withTransactionSync(work),
  };

  migrate(db, journalMigrations);
  return db;
}
