import { useGoals } from '../goals/GoalsContext';
import { useHabits } from '../habits/HabitsContext';
import { useJournal } from '../journal/JournalContext';
import { useNotes } from '../notes/NotesContext';
import { usePlanner } from '../planner/PlannerContext';
import { useTasks } from '../tasks/TasksContext';
import type { ExportInputs } from './buildExport';

/** Everything the app holds right now, in the shape the export and the backup need. */
export function useExportInputs(): ExportInputs {
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { focus, blocks } = usePlanner();
  const { allEntries } = useJournal();
  const { notes, notebooks } = useNotes();

  return {
    tasks,
    habits,
    goals,
    entries: allEntries,
    plan: { focus, blocks },
    notes: { notebooks, notes },
  };
}
