import { describe, expect, it } from '@jest/globals';

import { buildExport, exportFileName } from '../buildExport';

describe('buildExport', () => {
  const text = buildExport(
    {
      tasks: [
        {
          id: 't1',
          title: 'Pay rent',
          notes: '',
          dueDate: '2026-10-14',
          priority: 2,
          completedAt: null,
          createdAt: 'x',
          updatedAt: 'x',
        },
      ],
      habits: [{ id: 'h1', name: 'Read', completedDates: ['2026-10-14'], createdAt: 'x' }],
      goals: [],
      entries: [
        {
          id: 'e1',
          entryDate: '2026-10-14',
          title: 'Day "one"',
          body: 'Line 1\nLine 2',
          mood: 4,
          tags: ['work'],
          createdAt: 'x',
          updatedAt: 'x',
        },
      ],
    },
    '2026-10-14T10:00:00.000Z',
  );
  const parsed = JSON.parse(text);

  it('is valid JSON with a version, time and an unencrypted warning', () => {
    expect(parsed.app).toBe('ACE XM JOURNAL');
    expect(parsed.exportVersion).toBe(1);
    expect(parsed.exportedAt).toBe('2026-10-14T10:00:00.000Z');
    expect(parsed.note).toContain('NOT encrypted');
  });

  it('includes every kind of data exactly as stored, including quotes and new lines', () => {
    expect(parsed.tasks[0].title).toBe('Pay rent');
    expect(parsed.habits[0].completedDates).toEqual(['2026-10-14']);
    expect(parsed.goals).toEqual([]);
    expect(parsed.journalEntries[0].title).toBe('Day "one"');
    expect(parsed.journalEntries[0].body).toBe('Line 1\nLine 2');
  });
});

describe('buildExport day plans', () => {
  it('includes focus tasks and time blocks, and is empty for older callers', () => {
    const empty = JSON.parse(buildExport({ tasks: [], habits: [], goals: [], entries: [] }, 'x'));
    expect(empty.dayPlans).toEqual({ focus: [], blocks: [] });

    const withPlan = JSON.parse(
      buildExport(
        {
          tasks: [],
          habits: [],
          goals: [],
          entries: [],
          plan: {
            focus: [{ planDate: '2026-10-15', taskId: 't1', position: 0 }],
            blocks: [
              {
                id: 'b1',
                planDate: '2026-10-15',
                title: 'Write',
                taskId: null,
                startMinutes: 540,
                durationMinutes: 60,
                createdAt: 'x',
                updatedAt: 'x',
              },
            ],
          },
        },
        'x',
      ),
    );
    expect(withPlan.dayPlans.focus[0].taskId).toBe('t1');
    expect(withPlan.dayPlans.blocks[0].title).toBe('Write');
  });
});

describe('exportFileName', () => {
  it('includes the local date', () => {
    expect(exportFileName('2026-10-14')).toBe('acexm-export-2026-10-14.json');
  });
});
