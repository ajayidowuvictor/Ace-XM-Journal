import type { PlanBlock, FocusRow } from '../planner/types';
import { blockEnd, dayProgress, focusTasks, formatTime } from '../planner/logic';
import type { Task } from '../tasks/types';

/** What the home-screen widget shows. The phone's widget only draws this text. */
export type WidgetPayload = {
  /** The local date (`YYYY-MM-DD`) this was made for. The widget ignores older ones. */
  date: string;
  headline: string;
  /** Whole number from 0 to 100. */
  progress: number;
  /** Up to three short lines under the progress bar. */
  lines: string[];
  /** Small grey text at the bottom, such as "Updated 2:15 PM". */
  footer: string;
};

export type WidgetNames = 'hidden' | 'shown';

export const WIDGET_NAME_OPTIONS: readonly { value: WidgetNames; label: string }[] = [
  { value: 'hidden', label: 'Hide names' },
  { value: 'shown', label: 'Show names' },
];

/** Names stay hidden unless the person chose to show them. */
export function parseWidgetNames(value: string | null): WidgetNames {
  return value === 'shown' ? 'shown' : 'hidden';
}

const MAX_NAME = 32;

function short(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > MAX_NAME ? `${clean.slice(0, MAX_NAME - 1)}…` : clean;
}

export type WidgetInputs = {
  /** Today's local date. */
  today: string;
  /** Minutes after midnight now. */
  nowMinutes: number;
  tasks: readonly Task[];
  focus: readonly FocusRow[];
  blocks: readonly PlanBlock[];
  names: WidgetNames;
};

/**
 * The widget's content for today: how many tasks are done, the focus tasks and the next time
 * block. Without the person's say-so it holds counts and times only, never task or block names.
 */
export function buildWidgetPayload({
  today,
  nowMinutes,
  tasks,
  focus,
  blocks,
  names,
}: WidgetInputs): WidgetPayload {
  const progress = dayProgress(tasks, today);
  const headline =
    progress.total === 0 ? 'Nothing planned yet' : `${progress.done} of ${progress.total} tasks done`;

  const lines: string[] = [];

  const open = focusTasks(focus, tasks, today).filter((task) => task.completedAt === null);
  if (names === 'shown') {
    for (const task of open.slice(0, 2)) lines.push(`• ${short(task.title)}`);
  } else if (open.length > 0) {
    lines.push(`${open.length} focus ${open.length === 1 ? 'task' : 'tasks'} to do`);
  }

  const next = blocks
    .filter((block) => block.planDate === today && blockEnd(block) > nowMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes)[0];
  if (next) {
    const started = next.startMinutes <= nowMinutes;
    const when = started
      ? `Until ${formatTime(blockEnd(next))}`
      : `Next at ${formatTime(next.startMinutes)}`;
    lines.push(names === 'shown' ? `${when}: ${short(next.title)}` : when);
  }

  return {
    date: today,
    headline,
    progress: Math.round(progress.progress * 100),
    lines: lines.slice(0, 3),
    footer: `Updated ${formatTime(nowMinutes)}`,
  };
}
