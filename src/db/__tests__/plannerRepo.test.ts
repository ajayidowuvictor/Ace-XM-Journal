import { describe, expect, it } from '@jest/globals';

import {
  createBlock,
  deleteBlock,
  listBlocks,
  listFocus,
  replaceFocus,
  updateBlock,
} from '../plannerRepo';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';

const now = '2026-10-15T08:00:00.000Z';
const later = '2026-10-15T09:00:00.000Z';
const input = { title: 'Write report', taskId: null, startMinutes: 540, durationMinutes: 60 };

function setup() {
  const db = createTestDatabase();
  migrate(db);
  return db;
}

describe('plan blocks', () => {
  it('saves and lists a block', () => {
    const db = setup();
    createBlock(db, 'b1', '2026-10-15', input, now);

    expect(listBlocks(db)).toEqual([
      {
        id: 'b1',
        planDate: '2026-10-15',
        title: 'Write report',
        taskId: null,
        startMinutes: 540,
        durationMinutes: 60,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  it('lists blocks by day and then by start time', () => {
    const db = setup();
    createBlock(db, 'late', '2026-10-15', { ...input, startMinutes: 900 }, now);
    createBlock(db, 'next-day', '2026-10-16', { ...input, startMinutes: 60 }, now);
    createBlock(db, 'early', '2026-10-15', { ...input, startMinutes: 480 }, now);

    expect(listBlocks(db).map((b) => b.id)).toEqual(['early', 'late', 'next-day']);
  });

  it('updates a block and remembers when', () => {
    const db = setup();
    createBlock(db, 'b1', '2026-10-15', input, now);
    updateBlock(
      db,
      'b1',
      { title: 'Read', taskId: 't1', startMinutes: 600, durationMinutes: 30 },
      later,
    );

    expect(listBlocks(db)[0]).toMatchObject({
      title: 'Read',
      taskId: 't1',
      startMinutes: 600,
      durationMinutes: 30,
      createdAt: now,
      updatedAt: later,
    });
  });

  it('hides a deleted block but keeps the row', () => {
    const db = setup();
    createBlock(db, 'b1', '2026-10-15', input, now);
    deleteBlock(db, 'b1', later);

    expect(listBlocks(db)).toEqual([]);
    expect(db.all('SELECT id FROM plan_blocks')).toHaveLength(1);
  });

  it('does not change a deleted block when updating', () => {
    const db = setup();
    createBlock(db, 'b1', '2026-10-15', input, now);
    deleteBlock(db, 'b1', later);
    updateBlock(db, 'b1', { ...input, title: 'Changed' }, later);

    expect(db.first<{ title: string }>('SELECT title FROM plan_blocks')?.title).toBe(
      'Write report',
    );
  });
});

describe('plan focus', () => {
  it('saves the focus tasks for a day in order', () => {
    const db = setup();
    replaceFocus(db, '2026-10-15', ['b', 'a'], now);

    expect(listFocus(db)).toEqual([
      { planDate: '2026-10-15', taskId: 'b', position: 0 },
      { planDate: '2026-10-15', taskId: 'a', position: 1 },
    ]);
  });

  it('replaces the previous choice for that day only', () => {
    const db = setup();
    replaceFocus(db, '2026-10-15', ['a', 'b'], now);
    replaceFocus(db, '2026-10-16', ['c'], now);
    replaceFocus(db, '2026-10-15', ['b'], later);

    expect(listFocus(db)).toEqual([
      { planDate: '2026-10-15', taskId: 'b', position: 0 },
      { planDate: '2026-10-16', taskId: 'c', position: 0 },
    ]);
  });

  it('keeps at most three and ignores duplicates', () => {
    const db = setup();
    replaceFocus(db, '2026-10-15', ['a', 'a', 'b', 'c', 'd'], now);

    expect(listFocus(db).map((row) => row.taskId)).toEqual(['a', 'b', 'c']);
  });

  it('can be cleared', () => {
    const db = setup();
    replaceFocus(db, '2026-10-15', ['a'], now);
    replaceFocus(db, '2026-10-15', [], later);

    expect(listFocus(db)).toEqual([]);
  });
});
