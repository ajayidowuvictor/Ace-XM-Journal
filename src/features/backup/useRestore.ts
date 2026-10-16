import { openAppDatabase } from '../../db/expoDatabase';
import { restoreAppData, restoreJournalData } from '../../db/restoreRepo';
import { useGoals } from '../goals/GoalsContext';
import { useHabits } from '../habits/HabitsContext';
import { useJournal } from '../journal/JournalContext';
import { useNotes } from '../notes/NotesContext';
import { usePlanner } from '../planner/PlannerContext';
import { useTasks } from '../tasks/TasksContext';
import type { BackupData } from './types';

export type RestoreResult = { ok: boolean; message: string };

/** Returns a function that replaces everything on the phone with a backup's contents. */
export function useRestore(): (data: BackupData) => RestoreResult {
  const { reload: reloadTasks } = useTasks();
  const { reload: reloadHabits } = useHabits();
  const { reload: reloadGoals } = useGoals();
  const { reload: reloadPlanner } = usePlanner();
  const { database, reload: reloadJournal } = useJournal();
  const { reload: reloadNotes } = useNotes();

  return (data) => {
    if (!database) {
      return {
        ok: false,
        message: 'Your journal is not available right now, so nothing was changed.',
      };
    }
    const now = new Date().toISOString();
    try {
      restoreAppData(openAppDatabase(), data, now);
    } catch {
      return { ok: false, message: 'The backup could not be restored. Nothing was changed.' };
    }
    try {
      restoreJournalData(database, data);
    } catch {
      reloadTasks();
      reloadHabits();
      reloadGoals();
      reloadPlanner();
      return {
        ok: false,
        message:
          'Your tasks, habits and goals were restored, but the journal and notes could not be. They were left as they were. Please try again.',
      };
    }
    reloadTasks();
    reloadHabits();
    reloadGoals();
    reloadPlanner();
    reloadJournal();
    reloadNotes();
    return { ok: true, message: 'Your backup has been restored.' };
  };
}
