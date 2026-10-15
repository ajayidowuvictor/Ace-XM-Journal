import type { Goal } from '../goals/types';
import type { Habit } from '../habits/types';
import type { JournalEntry } from '../journal/types';
import type { Task } from '../tasks/types';

export type ExportInputs = {
  tasks: readonly Task[];
  habits: readonly Habit[];
  goals: readonly Goal[];
  entries: readonly JournalEntry[];
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
    },
    null,
    2,
  );
}

/** A file name such as `acexm-export-2026-10-14.json`. */
export function exportFileName(localDate: string): string {
  return `acexm-export-${localDate}.json`;
}
