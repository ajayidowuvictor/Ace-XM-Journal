import { describe, expect, it } from '@jest/globals';

import type { FocusRow, PlanBlock } from '../../planner/types';
import type { Task } from '../../tasks/types';
import { buildWidgetPayload, parseWidgetNames } from '../logic';

const TODAY = '2026-10-21';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    notes: '',
    dueDate: TODAY,
    priority: 0,
    repeat: 'none',
    reminderTime: null,
    category: 'none',
    completedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function block(id: string, start: number, length: number, title = id): PlanBlock {
  return {
    id,
    planDate: TODAY,
    title,
    taskId: null,
    startMinutes: start,
    durationMinutes: length,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };
}

const focusRow = (taskId: string, position: number): FocusRow => ({
  planDate: TODAY,
  taskId,
  position,
});

const NOON = 12 * 60;

describe('parseWidgetNames', () => {
  it('hides names unless the person chose to show them', () => {
    expect(parseWidgetNames('shown')).toBe('shown');
    expect(parseWidgetNames('hidden')).toBe('hidden');
    expect(parseWidgetNames(null)).toBe('hidden');
    expect(parseWidgetNames('anything else')).toBe('hidden');
  });
});

describe('buildWidgetPayload', () => {
  const tasks = [
    task('Pay rent', { completedAt: '2026-10-21T08:00:00.000Z' }),
    task('Call Dr Ade'),
    task('Write report'),
    task('Other day', { dueDate: '2026-10-22' }),
  ];
  const focus = [focusRow('Call Dr Ade', 0), focusRow('Write report', 1)];
  const blocks = [block('Gym', 17 * 60, 60), block('Deep work', 9 * 60, 60)];

  it('counts today and works out the progress', () => {
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: NOON,
      tasks,
      focus,
      blocks,
      names: 'hidden',
    });
    expect(payload.date).toBe(TODAY);
    expect(payload.headline).toBe('1 of 3 tasks done');
    expect(payload.progress).toBe(33);
    expect(payload.footer).toBe('Updated 12:00 PM');
  });

  it('never includes task or block names unless asked to', () => {
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: NOON,
      tasks,
      focus,
      blocks,
      names: 'hidden',
    });
    expect(payload.lines).toEqual(['2 focus tasks to do', 'Next at 5:00 PM']);
    const everything = JSON.stringify(payload);
    for (const secret of ['Pay rent', 'Call Dr Ade', 'Write report', 'Gym', 'Deep work']) {
      expect(everything).not.toContain(secret);
    }
  });

  it('shows names when the person chose to', () => {
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: NOON,
      tasks,
      focus,
      blocks,
      names: 'shown',
    });
    expect(payload.lines).toEqual(['• Call Dr Ade', '• Write report', 'Next at 5:00 PM: Gym']);
  });

  it('says so when a block is under way and skips blocks that are over', () => {
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: 9 * 60 + 30,
      tasks: [],
      focus: [],
      blocks,
      names: 'hidden',
    });
    expect(payload.lines).toEqual(['Until 10:00 AM']);
    const after = buildWidgetPayload({
      today: TODAY,
      nowMinutes: 20 * 60,
      tasks: [],
      focus: [],
      blocks,
      names: 'hidden',
    });
    expect(after.lines).toEqual([]);
  });

  it('is calm when nothing is planned', () => {
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: NOON,
      tasks: [],
      focus: [],
      blocks: [],
      names: 'shown',
    });
    expect(payload.headline).toBe('Nothing planned yet');
    expect(payload.progress).toBe(0);
    expect(payload.lines).toEqual([]);
  });

  it('uses the singular for one focus task and skips finished ones', () => {
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: NOON,
      tasks: [task('a', { completedAt: 'x' }), task('b')],
      focus: [focusRow('a', 0), focusRow('b', 1)],
      blocks: [],
      names: 'hidden',
    });
    expect(payload.lines).toEqual(['1 focus task to do']);
  });

  it('cuts very long names short', () => {
    const long = 'x'.repeat(100);
    const payload = buildWidgetPayload({
      today: TODAY,
      nowMinutes: NOON,
      tasks: [task(long)],
      focus: [focusRow(long, 0)],
      blocks: [],
      names: 'shown',
    });
    expect(payload.lines[0].length).toBeLessThanOrEqual(34);
    expect(payload.lines[0].endsWith('…')).toBe(true);
  });
});
