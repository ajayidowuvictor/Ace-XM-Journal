import { describe, expect, it } from '@jest/globals';

import type { JournalEntry } from '../../journal/types';
import type { Task } from '../../tasks/types';
import {
  buildTimeline,
  carryOverTasks,
  composeWrapUp,
  dayHeadline,
  dayProgress,
  findWrapUp,
  focusCandidates,
  focusTasks,
  formatDuration,
  formatTime,
  from12Hour,
  parseTypedDuration,
  parseTypedStart,
  to12Hour,
  withMeridiem,
  minutesOfDay,
  overlappingBlocks,
  parseWrapUp,
  shiftStart,
  sortBlocks,
  suggestStart,
  timeRange,
  tomorrowHeadline,
  tomorrowPlan,
  validateBlock,
  withFocus,
  withoutFocus,
} from '../logic';
import type { PlanBlock } from '../types';

function block(id: string, start: number, duration: number, title = id): PlanBlock {
  return {
    id,
    planDate: '2026-10-15',
    title,
    taskId: null,
    startMinutes: start,
    durationMinutes: duration,
    createdAt: 'x',
    updatedAt: 'x',
  };
}

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    notes: '',
    dueDate: null,
    priority: 0,
    repeat: 'none',
    reminderTime: null,
    category: 'none',
    goalId: null,
    completedAt: null,
    createdAt: `2026-10-0${id.length}T00:00:00.000Z`,
    updatedAt: 'x',
    ...overrides,
  };
}

const TODAY = '2026-10-15';

describe('time wording', () => {
  it('formats clock times', () => {
    expect(formatTime(0)).toBe('12:00 AM');
    expect(formatTime(545)).toBe('9:05 AM');
    expect(formatTime(12 * 60)).toBe('12:00 PM');
    expect(formatTime(13 * 60 + 30)).toBe('1:30 PM');
    expect(formatTime(23 * 60 + 59)).toBe('11:59 PM');
  });

  it('wraps a time past midnight onto the next morning', () => {
    expect(formatTime(24 * 60)).toBe('12:00 AM');
    expect(formatTime(25 * 60 + 15)).toBe('1:15 AM');
  });

  it('splits and joins 12-hour clock parts', () => {
    expect(to12Hour(0)).toEqual({ hour12: 12, minute: 0, pm: false });
    expect(to12Hour(13 * 60 + 5)).toEqual({ hour12: 1, minute: 5, pm: true });
    expect(from12Hour(12, 0, false)).toBe(0);
    expect(from12Hour(12, 0, true)).toBe(720);
    expect(from12Hour(6, 45, true)).toBe(18 * 60 + 45);
    for (let m = 0; m < 1440; m += 5) {
      const { hour12, minute, pm } = to12Hour(m);
      expect(from12Hour(hour12, minute, pm)).toBe(m);
    }
  });

  it('moves a time between morning and afternoon', () => {
    expect(withMeridiem(9 * 60 + 30, true)).toBe(21 * 60 + 30);
    expect(withMeridiem(21 * 60 + 30, false)).toBe(9 * 60 + 30);
    expect(withMeridiem(12 * 60, false)).toBe(0);
    expect(withMeridiem(9 * 60, false)).toBe(9 * 60);
  });

  it('reads a typed start time', () => {
    expect(parseTypedStart('6', '20', true)).toBe(18 * 60 + 20);
    expect(parseTypedStart('12', '', false)).toBe(0);
    expect(parseTypedStart('0', '10', false)).toBeNull();
    expect(parseTypedStart('13', '10', false)).toBeNull();
    expect(parseTypedStart('5', '60', false)).toBeNull();
    expect(parseTypedStart('', '10', false)).toBeNull();
    expect(parseTypedStart('x', '10', false)).toBeNull();
  });

  it('reads a typed length', () => {
    expect(parseTypedDuration('2', '')).toBe(120);
    expect(parseTypedDuration('', '50')).toBe(50);
    expect(parseTypedDuration('1', '25')).toBe(85);
    expect(parseTypedDuration('', '')).toBeNull();
    expect(parseTypedDuration('a', '5')).toBeNull();
  });

  it('formats lengths of time in plain words', () => {
    expect(formatDuration(15)).toBe('15 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('shows a block as a time range', () => {
    expect(timeRange(block('a', 9 * 60, 90))).toBe('9:00 AM to 10:30 AM');
  });

  it('reads minutes after midnight from a date', () => {
    expect(minutesOfDay(new Date(2026, 9, 15, 14, 45))).toBe(14 * 60 + 45);
  });
});

describe('validateBlock', () => {
  const good = { title: 'Write report', taskId: null, startMinutes: 540, durationMinutes: 60 };

  it('accepts a normal block', () => {
    expect(validateBlock(good)).toBeNull();
  });

  it('asks for a name', () => {
    expect(validateBlock({ ...good, title: '   ' })).toBe('Enter a name for this block.');
  });

  it('rejects very long names', () => {
    expect(validateBlock({ ...good, title: 'a'.repeat(201) })).toMatch(/under 200/);
  });

  it('rejects start times outside the day', () => {
    expect(validateBlock({ ...good, startMinutes: -5 })).toMatch(/start time/);
    expect(validateBlock({ ...good, startMinutes: 1440 })).toMatch(/start time/);
    expect(validateBlock({ ...good, startMinutes: 10.5 })).toMatch(/start time/);
  });

  it('rejects lengths that are too short or too long', () => {
    expect(validateBlock({ ...good, durationMinutes: 4 })).toMatch(/length/);
    expect(validateBlock({ ...good, durationMinutes: 721 })).toMatch(/length/);
  });

  it('rejects a block that would run past midnight', () => {
    expect(validateBlock({ ...good, startMinutes: 23 * 60 + 30, durationMinutes: 60 })).toMatch(
      /past midnight/,
    );
  });

  it('allows a block that ends exactly at midnight', () => {
    expect(validateBlock({ ...good, startMinutes: 23 * 60, durationMinutes: 60 })).toBeNull();
  });
});

describe('sortBlocks and overlaps', () => {
  it('orders by start, then by length, without changing the input', () => {
    const input = [block('c', 600, 60), block('a', 540, 60), block('b', 600, 30)];
    expect(sortBlocks(input).map((b) => b.id)).toEqual(['a', 'b', 'c']);
    expect(input.map((b) => b.id)).toEqual(['c', 'a', 'b']);
  });

  it('finds blocks that share time and ignores blocks that only touch', () => {
    const blocks = [block('a', 540, 60), block('b', 600, 60)];
    expect(
      overlappingBlocks(blocks, { startMinutes: 570, durationMinutes: 60 }).map((b) => b.id),
    ).toEqual(['a', 'b']);
    expect(overlappingBlocks(blocks, { startMinutes: 660, durationMinutes: 30 })).toEqual([]);
    expect(overlappingBlocks(blocks, { startMinutes: 480, durationMinutes: 60 })).toEqual([]);
  });

  it('can ignore the block being edited', () => {
    const blocks = [block('a', 540, 60)];
    expect(overlappingBlocks(blocks, { startMinutes: 540, durationMinutes: 60 }, 'a')).toEqual([]);
  });
});

describe('shiftStart', () => {
  it('moves a start time', () => {
    expect(shiftStart(540, 15, 60)).toBe(555);
    expect(shiftStart(540, -15, 60)).toBe(525);
  });

  it('keeps the block inside the day', () => {
    expect(shiftStart(5, -15, 60)).toBe(0);
    expect(shiftStart(1370, 15, 60)).toBe(1380);
  });
});

describe('suggestStart', () => {
  it('uses 9:00 for a day that is not today', () => {
    expect(suggestStart([], 60, null)).toBe(540);
  });

  it('uses the next quarter hour for today', () => {
    expect(suggestStart([], 60, 14 * 60 + 1)).toBe(14 * 60 + 15);
    expect(suggestStart([], 60, 14 * 60)).toBe(14 * 60);
  });

  it('never suggests before 6:00', () => {
    expect(suggestStart([], 30, 3 * 60)).toBe(6 * 60);
  });

  it('moves past blocks that are in the way', () => {
    const blocks = [block('a', 540, 60), block('b', 600, 45)];
    expect(suggestStart(blocks, 30, null)).toBe(645);
  });

  it('stays inside the day when the evening is full', () => {
    expect(suggestStart([block('a', 1300, 140)], 60, 1320)).toBe(1380);
  });
});

describe('buildTimeline', () => {
  const blocks = [block('a', 540, 60), block('b', 720, 60), block('c', 780, 30)];

  it('marks every block as upcoming and shows no marker when the day is not today', () => {
    const entries = buildTimeline(blocks, null);
    expect(entries.map((e) => e.kind)).toEqual(['block', 'gap', 'block', 'block']);
    expect(
      entries
        .filter((e) => e.kind === 'block')
        .every((e) => e.kind === 'block' && e.state === 'upcoming'),
    ).toBe(true);
  });

  it('only mentions gaps of 30 minutes or more', () => {
    const entries = buildTimeline(blocks, null);
    const gaps = entries.filter((e) => e.kind === 'gap');
    expect(gaps).toEqual([{ kind: 'gap', minutes: 120 }]);
  });

  it('puts a now marker before the next block', () => {
    const entries = buildTimeline(blocks, 650);
    expect(entries.map((e) => e.kind)).toEqual(['block', 'now', 'block', 'block']);
    expect(entries[0]).toMatchObject({ kind: 'block', state: 'past' });
    expect(entries[2]).toMatchObject({ kind: 'block', state: 'upcoming' });
  });

  it('marks the running block as current and adds no separate marker', () => {
    const entries = buildTimeline(blocks, 560);
    expect(entries.map((e) => e.kind)).toEqual(['block', 'gap', 'block', 'block']);
    expect(entries[0]).toMatchObject({ kind: 'block', state: 'current' });
  });

  it('puts the marker at the end when everything is over', () => {
    const entries = buildTimeline(blocks, 900);
    expect(entries[entries.length - 1]).toEqual({ kind: 'now', minutes: 900 });
    expect(entries.filter((e) => e.kind === 'block' && e.state === 'past')).toHaveLength(3);
  });

  it('puts the marker first when the day has not started', () => {
    const entries = buildTimeline(blocks, 400);
    expect(entries[0]).toEqual({ kind: 'now', minutes: 400 });
  });

  it('is empty when there are no blocks', () => {
    expect(buildTimeline([], 600)).toEqual([]);
    expect(buildTimeline([], null)).toEqual([]);
  });
});

describe('focus', () => {
  const tasks = [task('a'), task('bb'), task('ccc')];

  it('returns the chosen tasks for the day in order and skips deleted ones', () => {
    const rows = [
      { planDate: TODAY, taskId: 'ccc', position: 1 },
      { planDate: TODAY, taskId: 'gone', position: 2 },
      { planDate: TODAY, taskId: 'a', position: 0 },
      { planDate: '2026-10-16', taskId: 'bb', position: 0 },
    ];
    expect(focusTasks(rows, tasks, TODAY).map((t) => t.id)).toEqual(['a', 'ccc']);
  });

  it('allows at most three focus tasks', () => {
    expect(withFocus(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(withFocus(['a', 'b', 'c'], 'd')).toBeNull();
  });

  it('does not add the same task twice', () => {
    expect(withFocus(['a', 'b', 'c'], 'b')).toEqual(['a', 'b', 'c']);
  });

  it('removes a task from the focus list', () => {
    expect(withoutFocus(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('suggests today first, then earlier, then undated, then later, skipping done and chosen tasks', () => {
    const list = [
      task('later', { dueDate: '2026-10-20' }),
      task('undated'),
      task('earlier', { dueDate: '2026-10-10' }),
      task('today', { dueDate: TODAY }),
      task('finished', { dueDate: TODAY, completedAt: '2026-10-15T08:00:00.000Z' }),
      task('chosen', { dueDate: TODAY }),
    ];
    expect(focusCandidates(list, TODAY, ['chosen']).map((t) => t.id)).toEqual([
      'today',
      'earlier',
      'undated',
      'later',
    ]);
  });

  it('lists open tasks from earlier days to carry over', () => {
    const list = [
      task('old', { dueDate: '2026-10-10' }),
      task('oldDone', { dueDate: '2026-10-09', completedAt: '2026-10-09T08:00:00.000Z' }),
      task('today', { dueDate: TODAY }),
    ];
    expect(carryOverTasks(list, TODAY).map((t) => t.id)).toEqual(['old']);
  });
});

describe('day progress and wording', () => {
  it('counts only tasks due today', () => {
    const list = [
      task('a', { dueDate: TODAY, completedAt: '2026-10-15T07:00:00.000Z' }),
      task('b', { dueDate: TODAY }),
      task('c', { dueDate: '2026-10-16' }),
      task('d'),
    ];
    expect(dayProgress(list, TODAY)).toEqual({ done: 1, total: 2, progress: 0.5 });
  });

  it('has zero progress for an empty day', () => {
    expect(dayProgress([], TODAY)).toEqual({ done: 0, total: 0, progress: 0 });
  });

  it('writes a kind line for each situation', () => {
    expect(dayHeadline({ done: 0, total: 0 })).toMatch(/clear day/);
    expect(dayHeadline({ done: 0, total: 3 })).toMatch(/one small thing/);
    expect(dayHeadline({ done: 1, total: 3 })).toBe('1 of 3 done. Keep going at your own pace.');
    expect(dayHeadline({ done: 3, total: 3 })).toMatch(/done\. Well done/);
  });
});

describe('tomorrowHeadline', () => {
  it('says how much is planned', () => {
    expect(tomorrowHeadline(0)).toMatch(/Nothing planned/);
    expect(tomorrowHeadline(1)).toBe('1 thing planned. A calm start.');
    expect(tomorrowHeadline(4)).toBe('4 things planned. A calm start.');
  });
});

describe('wrap-up text', () => {
  it('puts both parts in the journal text', () => {
    expect(composeWrapUp({ wentWell: ' Finished the report ', tomorrow: 'Call Ada' })).toBe(
      'What went well today\nFinished the report\n\nWhat matters tomorrow\nCall Ada',
    );
  });

  it('leaves out empty parts', () => {
    expect(composeWrapUp({ wentWell: '', tomorrow: 'Rest' })).toBe('What matters tomorrow\nRest');
    expect(composeWrapUp({ wentWell: '  ', tomorrow: '' })).toBe('');
  });

  it('reads the parts back, including text with several lines', () => {
    const body = composeWrapUp({ wentWell: 'Line one\nLine two', tomorrow: 'Plan the week' });
    expect(parseWrapUp(body)).toEqual({
      wentWell: 'Line one\nLine two',
      tomorrow: 'Plan the week',
    });
  });

  it('reads a wrap-up that only has the second part', () => {
    expect(parseWrapUp(composeWrapUp({ wentWell: '', tomorrow: 'Rest' }))).toEqual({
      wentWell: '',
      tomorrow: 'Rest',
    });
  });

  it('treats text without headings as what went well', () => {
    expect(parseWrapUp('Just some words')).toEqual({ wentWell: 'Just some words', tomorrow: '' });
  });

  it('finds the wrap-up for a day', () => {
    const entry = (id: string, entryDate: string, tags: string[]): JournalEntry => ({
      id,
      entryDate,
      title: id,
      body: '',
      mood: null,
      tags,
      createdAt: 'x',
      updatedAt: 'x',
    });
    const entries = [
      entry('other', TODAY, ['work']),
      entry('yesterday', '2026-10-14', ['day wrap-up']),
      entry('mine', TODAY, ['day wrap-up']),
    ];
    expect(findWrapUp(entries, TODAY)?.id).toBe('mine');
    expect(findWrapUp(entries, '2026-10-13')).toBeNull();
  });
});

describe('tomorrowPlan', () => {
  const TOMORROW = '2026-10-16';

  it('uses the first written line as the task title, tidied up', () => {
    expect(tomorrowPlan('\n   Call   Ada  about the\tinvoice \nThen rest', [], TOMORROW)).toEqual({
      title: 'Call Ada about the invoice',
      existingTaskId: null,
    });
  });

  it('has nothing to plan when nothing is written', () => {
    expect(tomorrowPlan('', [], TOMORROW)).toBeNull();
    expect(tomorrowPlan('  \n \t ', [], TOMORROW)).toBeNull();
  });

  it('keeps a very long line within the title limit', () => {
    const plan = tomorrowPlan('x'.repeat(500), [], TOMORROW);
    expect(plan?.title.length).toBe(200);
    expect(plan?.title.endsWith('…')).toBe(true);
  });

  it('reuses an open task due tomorrow with the same title, ignoring letter case', () => {
    const tasks = [task('Call Ada', { dueDate: TOMORROW }), task('Other', { dueDate: TOMORROW })];
    expect(tomorrowPlan('call ada', tasks, TOMORROW)?.existingTaskId).toBe('Call Ada');
  });

  it('does not reuse a finished task, a task due another day, or a task with another title', () => {
    const tasks = [
      task('Call Ada', { dueDate: TOMORROW, completedAt: '2026-10-15T08:00:00.000Z' }),
      task('Call Bola', { dueDate: '2026-10-17' }),
      task('Call Ade', { dueDate: TOMORROW }),
    ];
    expect(tomorrowPlan('Call Ada', tasks, TOMORROW)?.existingTaskId).toBeNull();
    expect(tomorrowPlan('Call Bola', tasks, TOMORROW)?.existingTaskId).toBeNull();
  });
});
