export type SqlValue = string | number | null;

/** The small set of database operations the app needs. Lets tests use a different SQLite. */
export interface SqlDatabase {
  exec(sql: string): void;
  run(sql: string, params?: SqlValue[]): void;
  all<T>(sql: string, params?: SqlValue[]): T[];
  first<T>(sql: string, params?: SqlValue[]): T | null;
  /** Runs the steps as one unit: all of them are saved, or none are. */
  transaction(work: () => void): void;
}
