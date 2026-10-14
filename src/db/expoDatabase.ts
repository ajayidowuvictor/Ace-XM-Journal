import { openDatabaseSync } from 'expo-sqlite';

import { migrate } from './migrations';
import type { SqlDatabase, SqlValue } from './types';

const DATABASE_NAME = 'acexm.db';

/** Opens the app's on-device database and brings it up to date. Never logs stored values. */
export function openAppDatabase(): SqlDatabase {
  const native = openDatabaseSync(DATABASE_NAME);

  const db: SqlDatabase = {
    exec: (sql) => native.execSync(sql),
    run: (sql, params: SqlValue[] = []) => {
      native.runSync(sql, params);
    },
    all: <T>(sql: string, params: SqlValue[] = []) => native.getAllSync<T>(sql, params),
    first: <T>(sql: string, params: SqlValue[] = []) => native.getFirstSync<T>(sql, params),
    transaction: (work) => native.withTransactionSync(work),
  };

  migrate(db);
  return db;
}
