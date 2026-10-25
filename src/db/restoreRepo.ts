import { daysToText } from '../features/habits/logic';
import type { BackupData } from '../features/backup/types';
import type { SqlDatabase } from './types';
import { clearAppTables, clearJournalTables } from './wipeRepo';

/** A time `index` milliseconds after `iso`, so steps keep the order they had in the backup. */
function offsetIso(iso: string, index: number, fallback: string): string {
  const base = Date.parse(iso);
  return Number.isFinite(base) ? new Date(base + index).toISOString() : fallback;
}

/**
 * Replaces every task, habit, goal and day plan with the backup's. All or nothing: if anything
 * fails, the current data is left as it was.
 */
export function restoreAppData(db: SqlDatabase, data: BackupData, nowIso: string): void {
  db.transaction(() => {
    clearAppTables(db);

    for (const t of data.tasks) {
      db.run(
        `INSERT INTO tasks (id, title, notes, due_date, priority, repeat, reminder_time, category, goal_id, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.title,
          t.notes,
          t.dueDate,
          t.priority,
          t.repeat,
          t.reminderTime,
          t.category,
          t.goalId,
          t.completedAt,
          t.createdAt,
          t.updatedAt,
        ],
      );
    }

    for (const h of data.habits) {
      db.run('INSERT INTO habits (id, name, days, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
        h.id,
        h.name,
        daysToText(h.days),
        h.createdAt,
        h.createdAt,
      ]);
      for (const date of h.completedDates) {
        db.run(
          `INSERT OR IGNORE INTO habit_completions (habit_id, completed_date, created_at)
           VALUES (?, ?, ?)`,
          [h.id, date, h.createdAt],
        );
      }
    }

    for (const g of data.goals) {
      db.run(
        `INSERT INTO goals (id, title, notes, target_date, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [g.id, g.title, g.notes, g.targetDate, g.completedAt, g.createdAt, g.createdAt],
      );
      g.milestones.forEach((m, index) => {
        const stamp = offsetIso(g.createdAt, index, nowIso);
        db.run(
          `INSERT INTO milestones (id, goal_id, title, completed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [m.id, g.id, m.title, m.completedAt, stamp, stamp],
        );
      });
    }

    for (const f of data.focus) {
      db.run(
        `INSERT OR IGNORE INTO plan_focus (plan_date, task_id, position, created_at)
         VALUES (?, ?, ?, ?)`,
        [f.planDate, f.taskId, f.position, nowIso],
      );
    }

    for (const b of data.blocks) {
      db.run(
        `INSERT INTO plan_blocks
           (id, plan_date, title, task_id, start_minutes, duration_minutes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.planDate,
          b.title,
          b.taskId,
          b.startMinutes,
          b.durationMinutes,
          b.createdAt,
          b.updatedAt,
        ],
      );
    }
  });
}

/** Replaces every journal entry, note and notebook with the backup's (all or nothing). */
export function restoreJournalData(db: SqlDatabase, data: BackupData): void {
  db.transaction(() => {
    clearJournalTables(db);

    for (const e of data.entries) {
      db.run(
        `INSERT INTO journal_entries (id, entry_date, title, body, mood, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [e.id, e.entryDate, e.title, e.body, e.mood, e.createdAt, e.updatedAt],
      );
      for (const tag of e.tags) {
        db.run('INSERT OR IGNORE INTO entry_tags (entry_id, tag) VALUES (?, ?)', [e.id, tag]);
      }
    }

    for (const n of data.notebooks) {
      db.run('INSERT INTO notebooks (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)', [
        n.id,
        n.name,
        n.createdAt,
        n.updatedAt,
      ]);
    }

    for (const n of data.notes) {
      db.run(
        `INSERT INTO notes
           (id, notebook_id, kind, title, body, reference, pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.id,
          n.notebookId,
          n.kind,
          n.title,
          n.body,
          n.reference,
          n.pinned ? 1 : 0,
          n.createdAt,
          n.updatedAt,
        ],
      );
    }
  });
}
