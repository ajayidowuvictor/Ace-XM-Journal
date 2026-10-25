import { MAX_TITLE_LENGTH as MAX_TASK_TITLE_LENGTH, groupTasks } from '../tasks/logic';
import type { Task } from '../tasks/types';
import type { JournalEntry } from '../journal/types';
import { MAX_FOCUS, type FocusRow, type PlanBlock, type PlanBlockInput } from './types';

export const MINUTES_PER_DAY = 1440;
export const MIN_DURATION = 5;
export const MAX_DURATION = 720;
export const MAX_TITLE_LENGTH = 200;
/** Lengths offered as quick choices when planning a block. */
export const DURATION_CHOICES = [15, 30, 45, 60, 90, 120] as const;
/** Start times move in steps of this many minutes. */
export const START_STEP = 15;

/** A clock time on a 12-hour clock: hour 1 to 12, minute 0 to 59, and whether it is PM. */
export type ClockParts = { hour12: number; minute: number; pm: boolean };

/** Minutes after midnight as 12-hour clock parts: 0 is 12:00 AM, 780 is 1:00 PM. */
export function to12Hour(minutes: number): ClockParts {
  const day = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour24 = Math.floor(day / 60);
  return { hour12: hour24 % 12 === 0 ? 12 : hour24 % 12, minute: day % 60, pm: hour24 >= 12 };
}

/** The other way round: 12 AM is 0 and 12 PM is 720. */
export function from12Hour(hour12: number, minute: number, pm: boolean): number {
  return ((hour12 % 12) + (pm ? 12 : 0)) * 60 + minute;
}

/** Minutes after midnight shown as a 12-hour clock time, such as 9:05 AM or 1:30 PM. */
export function formatTime(minutes: number): string {
  const { hour12, minute, pm } = to12Hour(minutes);
  return `${hour12}:${String(minute).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
}

/** The same clock time moved into the morning or the afternoon. */
export function withMeridiem(minutes: number, pm: boolean): number {
  const { hour12, minute } = to12Hour(minutes);
  return from12Hour(hour12, minute, pm);
}

function wholeNumber(text: string): number | null {
  return /^\d{1,4}$/.test(text.trim()) ? Number(text) : null;
}

/** A typed start time (hour 1 to 12, minute 0 to 59) as minutes after midnight, or null. */
export function parseTypedStart(hourText: string, minuteText: string, pm: boolean): number | null {
  const hour = wholeNumber(hourText);
  const minute = minuteText.trim() === '' ? 0 : wholeNumber(minuteText);
  if (hour === null || minute === null) return null;
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return from12Hour(hour, minute, pm);
}

/** A typed length (hours and minutes, either may be empty) in minutes, or null if not a number. */
export function parseTypedDuration(hoursText: string, minutesText: string): number | null {
  if (hoursText.trim() === '' && minutesText.trim() === '') return null;
  const hours = hoursText.trim() === '' ? 0 : wholeNumber(hoursText);
  const minutes = minutesText.trim() === '' ? 0 : wholeNumber(minutesText);
  if (hours === null || minutes === null) return null;
  return hours * 60 + minutes;
}

/** A length of time in plain words: "45 min", "1 h", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function blockEnd(block: Pick<PlanBlock, 'startMinutes' | 'durationMinutes'>): number {
  return block.startMinutes + block.durationMinutes;
}

/** "9:00 to 10:30" */
export function timeRange(block: Pick<PlanBlock, 'startMinutes' | 'durationMinutes'>): string {
  return `${formatTime(block.startMinutes)} to ${formatTime(blockEnd(block))}`;
}

/** Minutes after local midnight for a moment in time. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Returns an error message for a block that cannot be saved, or null when it is fine. */
export function validateBlock(input: PlanBlockInput): string | null {
  const title = input.title.trim();
  if (!title) return 'Enter a name for this block.';
  if (title.length > MAX_TITLE_LENGTH) return `Keep the name under ${MAX_TITLE_LENGTH} letters.`;
  if (
    !Number.isInteger(input.startMinutes) ||
    input.startMinutes < 0 ||
    input.startMinutes >= MINUTES_PER_DAY
  ) {
    return 'Choose a start time during the day.';
  }
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < MIN_DURATION ||
    input.durationMinutes > MAX_DURATION
  ) {
    return 'Choose a length between 5 minutes and 12 hours.';
  }
  if (input.startMinutes + input.durationMinutes > MINUTES_PER_DAY) {
    return 'This block would run past midnight. Choose an earlier start or a shorter length.';
  }
  return null;
}

export function cleanBlockInput(input: PlanBlockInput): PlanBlockInput {
  return { ...input, title: input.title.trim() };
}

/** Blocks in the order they happen: earliest start first, shorter first when they start together. */
export function sortBlocks<T extends Pick<PlanBlock, 'id' | 'startMinutes' | 'durationMinutes'>>(
  blocks: readonly T[],
): T[] {
  return [...blocks].sort(
    (a, b) =>
      a.startMinutes - b.startMinutes ||
      a.durationMinutes - b.durationMinutes ||
      a.id.localeCompare(b.id),
  );
}

/** Blocks that share some time with the candidate. Blocks that only touch do not overlap. */
export function overlappingBlocks(
  blocks: readonly PlanBlock[],
  candidate: Pick<PlanBlockInput, 'startMinutes' | 'durationMinutes'>,
  ignoreId?: string,
): PlanBlock[] {
  const end = blockEnd(candidate);
  return blocks.filter(
    (block) =>
      block.id !== ignoreId && candidate.startMinutes < blockEnd(block) && block.startMinutes < end,
  );
}

/** Moves a start time by `delta` minutes, keeping the whole block inside the day. */
export function shiftStart(start: number, delta: number, durationMinutes: number): number {
  const latest = Math.max(0, MINUTES_PER_DAY - durationMinutes);
  return Math.min(latest, Math.max(0, start + delta));
}

function roundUp(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/**
 * A sensible start time for a new block: the next quarter hour when planning today (never before
 * 6:00), 9:00 for another day, moved past any block already in the way.
 */
export function suggestStart(
  blocks: readonly PlanBlock[],
  durationMinutes: number,
  nowMinutes: number | null,
): number {
  let start = nowMinutes === null ? 9 * 60 : Math.max(roundUp(nowMinutes, START_STEP), 6 * 60);

  for (const block of sortBlocks(blocks)) {
    if (start < blockEnd(block) && block.startMinutes < start + durationMinutes) {
      start = blockEnd(block);
    }
  }

  return Math.min(start, Math.max(0, MINUTES_PER_DAY - durationMinutes));
}

export type TimelineEntry =
  | { kind: 'block'; block: PlanBlock; state: 'past' | 'current' | 'upcoming' }
  | { kind: 'now'; minutes: number }
  | { kind: 'gap'; minutes: number };

/** Free time between two blocks is only mentioned when it is at least this long. */
export const MIN_GAP_TO_SHOW = 30;

/**
 * The blocks of one day in order, with a "now" marker and free-time gaps between them.
 * Pass `nowMinutes` as null when the day is not today: nothing is then marked as past or current.
 */
export function buildTimeline(
  blocks: readonly PlanBlock[],
  nowMinutes: number | null,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const sorted = sortBlocks(blocks);
  let markerHandled = false;
  let previousEnd: number | null = null;

  for (const block of sorted) {
    const end = blockEnd(block);
    const state: 'past' | 'current' | 'upcoming' =
      nowMinutes === null
        ? 'upcoming'
        : end <= nowMinutes
          ? 'past'
          : block.startMinutes <= nowMinutes
            ? 'current'
            : 'upcoming';

    if (state === 'current') markerHandled = true;

    if (nowMinutes !== null && !markerHandled && state === 'upcoming') {
      entries.push({ kind: 'now', minutes: nowMinutes });
      markerHandled = true;
    } else if (previousEnd !== null && block.startMinutes - previousEnd >= MIN_GAP_TO_SHOW) {
      entries.push({ kind: 'gap', minutes: block.startMinutes - previousEnd });
    }

    entries.push({ kind: 'block', block, state });
    previousEnd = Math.max(previousEnd ?? 0, end);
  }

  if (nowMinutes !== null && !markerHandled && sorted.length > 0) {
    entries.push({ kind: 'now', minutes: nowMinutes });
  }

  return entries;
}

// ---- Focus (the few things that matter today) ----

/** The focus tasks for a day, in the order chosen. Tasks that no longer exist are left out. */
export function focusTasks(
  rows: readonly FocusRow[],
  tasks: readonly Task[],
  planDate: string,
): Task[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return rows
    .filter((row) => row.planDate === planDate)
    .sort((a, b) => a.position - b.position)
    .map((row) => byId.get(row.taskId))
    .filter((task): task is Task => task !== undefined)
    .slice(0, MAX_FOCUS);
}

/** Adds a task to the focus list. Returns null when three are already chosen. */
export function withFocus(ids: readonly string[], taskId: string): string[] | null {
  if (ids.includes(taskId)) return [...ids];
  if (ids.length >= MAX_FOCUS) return null;
  return [...ids, taskId];
}

export function withoutFocus(ids: readonly string[], taskId: string): string[] {
  return ids.filter((id) => id !== taskId);
}

/** Open tasks worth choosing from: today's first, then earlier ones, then undated, then later ones. */
export function focusCandidates(
  tasks: readonly Task[],
  today: string,
  excludeIds: readonly string[],
): Task[] {
  const groups = groupTasks(tasks, today);
  const excluded = new Set(excludeIds);
  return [...groups.today, ...groups.overdue, ...groups.noDate, ...groups.upcoming].filter(
    (task) => !excluded.has(task.id),
  );
}

/** Open tasks from earlier days that are still waiting. Shown gently, never as a warning. */
export function carryOverTasks(tasks: readonly Task[], today: string): Task[] {
  return groupTasks(tasks, today).overdue;
}

// ---- Progress and wording ----

export type DayProgress = { done: number; total: number; progress: number };

/** How many of today's tasks are finished. Tasks due on other days are not counted. */
export function dayProgress(tasks: readonly Task[], today: string): DayProgress {
  const dueToday = tasks.filter((task) => task.dueDate === today);
  const done = dueToday.filter((task) => task.completedAt !== null).length;
  const total = dueToday.length;
  return { done, total, progress: total === 0 ? 0 : done / total };
}

/** One short, kind line about the day so far. */
export function dayHeadline({ done, total }: Pick<DayProgress, 'done' | 'total'>): string {
  if (total === 0) return 'A clear day. Add the one thing that matters most.';
  if (done === total) return 'Everything planned for today is done. Well done.';
  if (done === 0) return 'Start with one small thing.';
  return `${done} of ${total} done. Keep going at your own pace.`;
}

/** The same kind of line for the day after today: how much is planned, never how much is done. */
export function tomorrowHeadline(total: number): string {
  if (total === 0) return 'Nothing planned yet. Choose what matters most.';
  return total === 1 ? '1 thing planned. A calm start.' : `${total} things planned. A calm start.`;
}

// ---- Evening wrap-up (saved as an encrypted journal entry) ----

export const WRAP_UP_TAG = 'day wrap-up';
const WENT_WELL = 'What went well today';
const TOMORROW = 'What matters tomorrow';

export type WrapUp = { wentWell: string; tomorrow: string };

/** The journal text for a wrap-up. Empty parts are left out. */
export function composeWrapUp({ wentWell, tomorrow }: WrapUp): string {
  const parts: string[] = [];
  if (wentWell.trim()) parts.push(`${WENT_WELL}\n${wentWell.trim()}`);
  if (tomorrow.trim()) parts.push(`${TOMORROW}\n${tomorrow.trim()}`);
  return parts.join('\n\n');
}

/** Reads a wrap-up back out of journal text, so it can be edited again. */
export function parseWrapUp(body: string): WrapUp {
  const wentIndex = body.indexOf(WENT_WELL);
  const tomorrowIndex = body.indexOf(TOMORROW);

  if (wentIndex === -1 && tomorrowIndex === -1) return { wentWell: body.trim(), tomorrow: '' };

  const section = (start: number, heading: string, otherStart: number): string => {
    if (start === -1) return '';
    const from = start + heading.length;
    const to = otherStart > start ? otherStart : body.length;
    return body.slice(from, to).trim();
  };

  return {
    wentWell: section(wentIndex, WENT_WELL, tomorrowIndex),
    tomorrow: section(tomorrowIndex, TOMORROW, wentIndex),
  };
}

export type TomorrowPlan = {
  /** The task title taken from the wrap-up line. */
  title: string;
  /** An open task already due that day with the same title, so nothing is added twice. */
  existingTaskId: string | null;
};

/**
 * Turns the "What matters tomorrow" text into something to plan: its first non-empty line becomes
 * the task title. Returns null when there is nothing written.
 */
export function tomorrowPlan(
  text: string,
  tasks: readonly Task[],
  tomorrow: string,
): TomorrowPlan | null {
  const first = text
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .find((line) => line.length > 0);
  if (!first) return null;
  const title =
    first.length > MAX_TASK_TITLE_LENGTH
      ? `${first.slice(0, MAX_TASK_TITLE_LENGTH - 1).trimEnd()}…`
      : first;
  const existing = tasks.find(
    (task) =>
      task.completedAt === null &&
      task.dueDate === tomorrow &&
      task.title.trim().toLowerCase() === title.toLowerCase(),
  );
  return { title, existingTaskId: existing?.id ?? null };
}

export function wrapUpTitle(shortDate: string): string {
  return `Day wrap-up: ${shortDate}`;
}

/** The wrap-up already saved for a day, if any. */
export function findWrapUp(
  entries: readonly JournalEntry[],
  planDate: string,
): JournalEntry | null {
  return (
    entries.find((entry) => entry.entryDate === planDate && entry.tags.includes(WRAP_UP_TAG)) ??
    null
  );
}
