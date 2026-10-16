import { openAppDatabase } from '../../db/expoDatabase';
import { wipeAppData } from '../../db/wipeRepo';
import { useGoals } from '../goals/GoalsContext';
import { useHabits } from '../habits/HabitsContext';
import { useJournal } from '../journal/JournalContext';
import { useNotes } from '../notes/NotesContext';
import { usePlanner } from '../planner/PlannerContext';
import { useTasks } from '../tasks/TasksContext';

export type EraseResult = { ok: boolean; message: string };

/** Returns a function that permanently erases everything the app holds and refreshes the screens. */
export function useEraseAll(): () => EraseResult {
  const { reload: reloadTasks } = useTasks();
  const { reload: reloadHabits } = useHabits();
  const { reload: reloadGoals } = useGoals();
  const { reload: reloadPlanner } = usePlanner();
  const { wipe: wipeJournal } = useJournal();
  const { reload: reloadNotes } = useNotes();

  return () => {
    try {
      wipeAppData(openAppDatabase());
      reloadTasks();
      reloadHabits();
      reloadGoals();
      reloadPlanner();
      const journalWiped = wipeJournal();
      reloadNotes();
      return journalWiped
        ? { ok: true, message: 'Everything has been erased.' }
        : {
            ok: false,
            message:
              'Your tasks, habits and goals were erased, but the journal and notes could not be erased. Please try again.',
          };
    } catch {
      return {
        ok: false,
        message: 'Nothing was erased because something went wrong. Please try again.',
      };
    }
  };
}
