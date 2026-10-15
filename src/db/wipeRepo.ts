import type { SqlDatabase } from './types';

/** Permanently removes every task, habit and goal (and their history and steps). */
export function wipeAppData(db: SqlDatabase): void {
  db.transaction(() => {
    db.run('DELETE FROM tasks');
    db.run('DELETE FROM habit_completions');
    db.run('DELETE FROM habits');
    db.run('DELETE FROM milestones');
    db.run('DELETE FROM goals');
  });
}

/** Permanently removes every journal entry and tag. */
export function wipeJournalData(db: SqlDatabase): void {
  db.transaction(() => {
    db.run('DELETE FROM entry_tags');
    db.run('DELETE FROM journal_entries');
  });
}
