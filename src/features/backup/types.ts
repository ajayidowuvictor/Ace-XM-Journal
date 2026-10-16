import type { Goal } from '../goals/types';
import type { Habit } from '../habits/types';
import type { JournalEntry } from '../journal/types';
import type { Note, Notebook } from '../notes/types';
import type { FocusRow, PlanBlock } from '../planner/types';
import type { Task } from '../tasks/types';

/** Everything a backup holds, ready to be put back. */
export type BackupData = {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  entries: JournalEntry[];
  focus: FocusRow[];
  blocks: PlanBlock[];
  notebooks: Notebook[];
  notes: Note[];
};

export const EMPTY_BACKUP: BackupData = {
  tasks: [],
  habits: [],
  goals: [],
  entries: [],
  focus: [],
  blocks: [],
  notebooks: [],
  notes: [],
};
