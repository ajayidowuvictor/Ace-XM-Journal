import type { SqlDatabase, SqlValue } from './types';

/** Every table of the tasks, habits and goals database, in the order they are copied. */
export const APP_TABLES = [
  'tasks',
  'habits',
  'habit_completions',
  'goals',
  'milestones',
  'plan_focus',
  'plan_blocks',
] as const;

/**
 * Copies every row of the tasks, habits and goals tables from one database to another with the
 * same layout. All or nothing: the number of rows in each table is checked inside the same
 * transaction, and any difference undoes the whole copy. Copying twice is safe (rows with the same
 * id are replaced). Nothing is read from or written to the source except by reading.
 */
export function copyAppData(from: SqlDatabase, to: SqlDatabase): void {
  to.transaction(() => {
    for (const table of APP_TABLES) {
      const rows = from.all<Record<string, SqlValue>>(`SELECT * FROM ${table}`);
      for (const row of rows) {
        const columns = Object.keys(row);
        to.run(
          `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
          columns.map((column) => row[column]),
        );
      }
      const copied = to.first<{ n: number }>(`SELECT count(*) AS n FROM ${table}`)?.n;
      if (copied !== rows.length) {
        throw new Error(`The copy of ${table} did not match.`);
      }
    }
  });
}
