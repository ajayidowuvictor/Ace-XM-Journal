import { useCallback, useState } from 'react';

import { TaskForm } from './TaskForm';
import { useTasks } from './TasksContext';
import type { Task, TaskInput } from './types';

type EditorState = { key: number; task: Task | null; visible: boolean };

/** Lets a screen open the task form to add a task (`open(null)`) or edit one (`open(task)`). */
export function useTaskEditor() {
  const { add, edit, remove } = useTasks();
  const [state, setState] = useState<EditorState>({ key: 0, task: null, visible: false });

  const open = useCallback((task: Task | null) => {
    setState((previous) => ({ key: previous.key + 1, task, visible: true }));
  }, []);

  const close = useCallback(() => {
    setState((previous) => ({ ...previous, visible: false }));
  }, []);

  const element = (
    <TaskForm
      key={state.key}
      visible={state.visible}
      task={state.task}
      onSave={(input: TaskInput) => {
        const problem = state.task ? edit(state.task.id, input) : add(input);
        if (!problem) close();
        return problem;
      }}
      onDelete={() => {
        if (state.task) remove(state.task.id);
        close();
      }}
      onClose={close}
    />
  );

  return { open, element };
}
