import Database from 'better-sqlite3';

import type { SqlDatabase, SqlValue } from '../types';

/** A real, in-memory SQLite database (via better-sqlite3) for tests. Not used by the app. */
export function createTestDatabase(): SqlDatabase {
  const native = new Database(':memory:');

  return {
    exec: (sql) => {
      native.exec(sql);
    },
    run: (sql, params: SqlValue[] = []) => {
      native.prepare(sql).run(...params);
    },
    all: <T>(sql: string, params: SqlValue[] = []) => native.prepare(sql).all(...params) as T[],
    first: <T>(sql: string, params: SqlValue[] = []) =>
      (native.prepare(sql).get(...params) as T | undefined) ?? null,
    transaction: (work) => {
      native.transaction(work)();
    },
  };
}
