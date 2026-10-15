import { describe, expect, it } from '@jest/globals';

import { createEntry, listEntries } from '../journalRepo';
import { journalMigrations } from '../journalMigrations';
import { addMilestone, createGoal, listGoals } from '../goalsRepo';
import { createHabit, listHabits, setHabitDone } from '../habitsRepo';
import { migrate } from '../migrations';
import { createBlock, listBlocks, listFocus, replaceFocus } from '../plannerRepo';
import { createTask, listTasks } from '../tasksRepo';
import { createTestDatabase } from '../testing/testDatabase';
import { wipeAppData, wipeJournalData } from '../wipeRepo';

const now = '2026-10-14T08:00:00.000Z';

describe('wipeAppData', () => {
  it('removes all tasks, habits, history, goals and steps, and the app still works after', () => {
    const db = createTestDatabase();
    migrate(db);
    createTask(db, 't1', { title: 'a', notes: '', dueDate: null, priority: 0 }, now);
    createHabit(db, 'h1', 'Read', now);
    setHabitDone(db, 'h1', '2026-10-14', true, now);
    createGoal(db, 'g1', { title: 'g', notes: '', targetDate: null }, now);
    addMilestone(db, 'm1', 'g1', 'step', now);
    createBlock(
      db,
      'b1',
      '2026-10-14',
      { title: 'x', taskId: null, startMinutes: 540, durationMinutes: 30 },
      now,
    );
    replaceFocus(db, '2026-10-14', ['t1'], now);

    wipeAppData(db);

    expect(listTasks(db)).toEqual([]);
    expect(listHabits(db)).toEqual([]);
    expect(listGoals(db)).toEqual([]);
    expect(db.all('SELECT * FROM habit_completions')).toEqual([]);
    expect(db.all('SELECT * FROM milestones')).toEqual([]);
    expect(listBlocks(db)).toEqual([]);
    expect(db.all('SELECT * FROM plan_blocks')).toEqual([]);
    expect(listFocus(db)).toEqual([]);

    createTask(db, 't2', { title: 'b', notes: '', dueDate: null, priority: 0 }, now);
    expect(listTasks(db)).toHaveLength(1);
  });
});

describe('wipeJournalData', () => {
  it('removes every entry and tag, including already-deleted markers', () => {
    const db = createTestDatabase();
    migrate(db, journalMigrations);
    createEntry(db, 'e1', '2026-10-14', { title: 'x', body: 'y', mood: 3, tags: ['a'] }, now);

    wipeJournalData(db);

    expect(listEntries(db)).toEqual([]);
    expect(db.all('SELECT * FROM journal_entries')).toEqual([]);
    expect(db.all('SELECT * FROM entry_tags')).toEqual([]);
  });
});
