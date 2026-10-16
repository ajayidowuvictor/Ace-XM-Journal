import type { SqlDatabase } from './types';

/** Empties the app tables. Must be called inside a transaction (see `wipeAppData`). */
export function clearAppTables(db: SqlDatabase): void {
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM habit_completions');
  db.run('DELETE FROM habits');
  db.run('DELETE FROM milestones');
  db.run('DELETE FROM goals');
  db.run('DELETE FROM plan_blocks');
  db.run('DELETE FROM plan_focus');
}

/** Permanently removes every task, habit and goal (and their history and steps) and the day plans. */
export function wipeAppData(db: SqlDatabase): void {
  db.transaction(() => clearAppTables(db));
}

/** Empties the journal tables. Must be called inside a transaction (see `wipeJournalData`). */
export function clearJournalTables(db: SqlDatabase): void {
  db.run('DELETE FROM entry_tags');
  db.run('DELETE FROM journal_entries');
  db.run('DELETE FROM notes');
  db.run('DELETE FROM notebooks');
}

/** Permanently removes every journal entry and tag, and every note and notebook. */
export function wipeJournalData(db: SqlDatabase): void {
  db.transaction(() => clearJournalTables(db));
}
