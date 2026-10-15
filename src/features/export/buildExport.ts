import type { Goal } from '../goals/types';
import type { Habit } from '../habits/types';
import type { JournalEntry } from '../journal/types';
import type { FocusRow, PlanBlock } from '../planner/types';
import type { Task } from '../tasks/types';

export type ExportInputs = {
  tasks: readonly Task[];
  habits: readonly Habit[];
  goals: readonly Goal[];
  entries: readonly JournalEntry[];
  /** Day plans: the focus tasks and time blocks. Optional so older callers keep working. */
  plan?: { focus: readonly FocusRow[]; blocks: readonly PlanBlock[] };
};

/** Everything the app holds for the user, in a plain readable format (JSON text). */
export function buildExport(inputs: ExportInputs, nowIso: string): string {
  return JSON.stringify(
    {
      app: 'ACE XM JOURNAL',
      exportVersion: 1,
      exportedAt: nowIso,
      note: 'This file is NOT encrypted. Keep it somewhere private.',
      tasks: inputs.tasks,
      habits: inputs.habits,
      goals: inputs.goals,
      journalEntries: inputs.entries,
      dayPlans: { focus: inputs.plan?.focus ?? [], blocks: inputs.plan?.blocks ?? [] },
    },
    null,
    2,
  );
}

/** A file name such as `acexm-export-2026-10-14.json`. */
export function exportFileName(localDate: string): string {
  return `acexm-export-${localDate}.json`;
}
