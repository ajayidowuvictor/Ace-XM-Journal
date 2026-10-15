import { beforeEach, describe, expect, it } from '@jest/globals';

import { createHabit, deleteHabit, listHabits, renameHabit, setHabitDone } from '../habitsRepo';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';
import type { SqlDatabase } from '../types';

const t1 = '2026-10-14T08:00:00.000Z';
const t2 = '2026-10-14T09:00:00.000Z';

let db: SqlDatabase;

beforeEach(() => {
  db = createTestDatabase();
  migrate(db);
});

describe('habits repository', () => {
  it('saves and lists a habit with no history', () => {
    createHabit(db, 'h1', 'Read', t1);
    expect(listHabits(db)).toEqual([{ id: 'h1', name: 'Read', completedDates: [], createdAt: t1 }]);
  });

  it('records days done in date order and ignores repeats', () => {
    createHabit(db, 'h1', 'Read', t1);
    setHabitDone(db, 'h1', '2026-10-14', true, t1);
    setHabitDone(db, 'h1', '2026-10-12', true, t1);
    setHabitDone(db, 'h1', '2026-10-14', true, t2);

    expect(listHabits(db)[0].completedDates).toEqual(['2026-10-12', '2026-10-14']);
  });

  it('can undo a day', () => {
    createHabit(db, 'h1', 'Read', t1);
    setHabitDone(db, 'h1', '2026-10-14', true, t1);
    setHabitDone(db, 'h1', '2026-10-14', false, t2);

    expect(listHabits(db)[0].completedDates).toEqual([]);
  });

  it('keeps each habit history separate', () => {
    createHabit(db, 'h1', 'Read', t1);
    createHabit(db, 'h2', 'Walk', t2);
    setHabitDone(db, 'h2', '2026-10-14', true, t2);

    expect(listHabits(db).map((h) => h.completedDates)).toEqual([[], ['2026-10-14']]);
  });

  it('renames a habit', () => {
    createHabit(db, 'h1', 'Read', t1);
    renameHabit(db, 'h1', 'Read 10 pages', t2);
    expect(listHabits(db)[0].name).toBe('Read 10 pages');
  });

  it('removes a deleted habit and its history, keeping an empty marker', () => {
    createHabit(db, 'h1', 'Read', t1);
    createHabit(db, 'h2', 'Walk', t1);
    setHabitDone(db, 'h1', '2026-10-14', true, t1);

    deleteHabit(db, 'h1', t2);

    expect(listHabits(db).map((h) => h.id)).toEqual(['h2']);
    expect(db.all('SELECT * FROM habit_completions WHERE habit_id = ?', ['h1'])).toEqual([]);
    expect(db.first<{ deleted_at: string }>(`SELECT deleted_at FROM habits WHERE id = 'h1'`)).toEqual({
      deleted_at: t2,
    });
  });

  it('does not record a day for a deleted habit', () => {
    createHabit(db, 'h1', 'Read', t1);
    deleteHabit(db, 'h1', t2);
    setHabitDone(db, 'h1', '2026-10-14', true, t2);

    expect(db.all('SELECT * FROM habit_completions')).toEqual([]);
  });
});
