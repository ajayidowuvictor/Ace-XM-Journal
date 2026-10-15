import { useCallback, useState } from 'react';

import { HabitForm } from './HabitForm';
import type { Habit } from './types';

type EditorState = { key: number; habit: Habit | null; visible: boolean };

/** Lets a screen open the habit form to add a habit (`open(null)`) or edit one (`open(habit)`). */
export function useHabitEditor() {
  const [state, setState] = useState<EditorState>({ key: 0, habit: null, visible: false });

  const open = useCallback((habit: Habit | null) => {
    setState((previous) => ({ key: previous.key + 1, habit, visible: true }));
  }, []);

  const close = useCallback(() => {
    setState((previous) => ({ ...previous, visible: false }));
  }, []);

  const element = (
    <HabitForm key={state.key} visible={state.visible} habit={state.habit} onClose={close} />
  );

  return { open, element };
}
