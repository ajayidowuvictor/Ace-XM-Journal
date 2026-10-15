import { useCallback, useState } from 'react';

import { GoalForm } from './GoalForm';

type EditorState = { key: number; goalId: string | null; visible: boolean };

/** Lets a screen open the goal form to add (`open(null)`) or edit (`open(goalId)`) a goal. */
export function useGoalEditor() {
  const [state, setState] = useState<EditorState>({ key: 0, goalId: null, visible: false });

  const open = useCallback((goalId: string | null) => {
    setState((previous) => ({ key: previous.key + 1, goalId, visible: true }));
  }, []);

  const close = useCallback(() => {
    setState((previous) => ({ ...previous, visible: false }));
  }, []);

  const element = (
    <GoalForm key={state.key} visible={state.visible} goalId={state.goalId} onClose={close} />
  );

  return { open, element };
}
