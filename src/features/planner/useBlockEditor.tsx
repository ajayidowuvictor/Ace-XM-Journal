import { useCallback, useState } from 'react';

import type { Task } from '../tasks/types';
import { BlockForm } from './BlockForm';
import { usePlanner } from './PlannerContext';
import type { PlanBlock, PlanBlockInput } from './types';

type EditorState = { key: number; block: PlanBlock | null; visible: boolean };

type Options = {
  planDate: string;
  /** The blocks of the day being planned. */
  dayBlocks: readonly PlanBlock[];
  nowMinutes: number | null;
  linkableTasks: readonly Task[];
};

/** Lets a screen open the block form to add a block (`open(null)`) or edit one (`open(block)`). */
export function useBlockEditor({ planDate, dayBlocks, nowMinutes, linkableTasks }: Options) {
  const { addBlock, editBlock, removeBlock } = usePlanner();
  const [state, setState] = useState<EditorState>({ key: 0, block: null, visible: false });

  const open = useCallback((block: PlanBlock | null) => {
    setState((previous) => ({ key: previous.key + 1, block, visible: true }));
  }, []);

  const close = useCallback(() => {
    setState((previous) => ({ ...previous, visible: false }));
  }, []);

  const element = (
    <BlockForm
      key={state.key}
      visible={state.visible}
      block={state.block}
      dayBlocks={dayBlocks}
      nowMinutes={nowMinutes}
      linkableTasks={linkableTasks}
      onSave={(input: PlanBlockInput) => {
        const problem = state.block ? editBlock(state.block.id, input) : addBlock(planDate, input);
        if (!problem) close();
        return problem;
      }}
      onDelete={() => {
        if (state.block) removeBlock(state.block.id);
        close();
      }}
      onClose={close}
    />
  );

  return { open, element };
}
