import { beforeEach, describe, expect, it } from '@jest/globals';

import type { TaskInput } from '../../features/tasks/types';
import { migrate } from '../migrations';
import {
  completeTask,
  createTask,
  deleteTask,
  listTasks,
  setTaskCompleted,
  updateTask,
} from '../tasksRepo';
import type { SqlDatabase } from '../types';
import { createTestDatabase } from '../testing/testDatabase';

const input: TaskInput = {
  title: 'Call the bank',
  notes: 'Ask about fees',
  dueDate: '2026-10-14',
  priority: 2,
};
const t1 = '2026-10-14T08:00:00.000Z';
const t2 = '2026-10-14T09:00:00.000Z';

let db: SqlDatabase;

beforeEach(() => {
  db = createTestDatabase();
  migrate(db);
});

describe('tasks repository', () => {
  it('saves and lists a task', () => {
    createTask(db, 'id-1', input, t1);

    expect(listTasks(db)).toEqual([
      {
        id: 'id-1',
        title: 'Call the bank',
        notes: 'Ask about fees',
        dueDate: '2026-10-14',
        priority: 2,
        repeat: 'none',
        reminderTime: null,
        category: 'none',
        completedAt: null,
        createdAt: t1,
        updatedAt: t1,
      },
    ]);
  });

  it('keeps a task without a due date', () => {
    createTask(db, 'id-1', { ...input, dueDate: null }, t1);
    expect(listTasks(db)[0].dueDate).toBeNull();
  });

  it('updates the edited fields and the updated time only', () => {
    createTask(db, 'id-1', input, t1);
    updateTask(
      db,
      'id-1',
      { title: 'Call the bank today', notes: '', dueDate: null, priority: 3 },
      t2,
    );

    const [task] = listTasks(db);
    expect(task).toMatchObject({
      title: 'Call the bank today',
      notes: '',
      dueDate: null,
      priority: 3,
      createdAt: t1,
      updatedAt: t2,
    });
  });

  it('completes a task and reopens it', () => {
    createTask(db, 'id-1', input, t1);

    setTaskCompleted(db, 'id-1', true, t2);
    expect(listTasks(db)[0].completedAt).toBe(t2);

    setTaskCompleted(db, 'id-1', false, t2);
    expect(listTasks(db)[0].completedAt).toBeNull();
  });

  it('hides a deleted task but keeps its row for later sync', () => {
    createTask(db, 'id-1', input, t1);
    createTask(db, 'id-2', { ...input, title: 'Other' }, t1);

    deleteTask(db, 'id-1', t2);

    expect(listTasks(db).map((task) => task.id)).toEqual(['id-2']);
    expect(
      db.first<{ deleted_at: string }>(`SELECT deleted_at FROM tasks WHERE id = 'id-1'`),
    ).toEqual({
      deleted_at: t2,
    });
  });

  it('does not change a deleted task', () => {
    createTask(db, 'id-1', input, t1);
    deleteTask(db, 'id-1', t2);

    updateTask(db, 'id-1', { ...input, title: 'Changed' }, '2026-10-15T00:00:00.000Z');

    expect(db.first<{ title: string }>(`SELECT title FROM tasks WHERE id = 'id-1'`)?.title).toBe(
      'Call the bank',
    );
  });

  it('stores text that contains quotes and symbols exactly as typed', () => {
    const awkward = `Buy "milk"; DROP TABLE tasks; -- it's 50% off`;
    createTask(db, 'id-1', { ...input, title: awkward }, t1);

    expect(listTasks(db)[0].title).toBe(awkward);
  });

  it('saves the repeat rule and reminder time and gives older tasks the defaults', () => {
    createTask(db, 'plain', input, t1);
    createTask(db, 'rep', { ...input, repeat: 'weekly', reminderTime: '17:00' }, t2);
    const [plain, rep] = listTasks(db);
    expect(plain).toMatchObject({ repeat: 'none', reminderTime: null });
    expect(rep).toMatchObject({ repeat: 'weekly', reminderTime: '17:00' });
  });

  it('keeps the repeat rule and reminder when an edit leaves them out, and changes them when given', () => {
    createTask(db, 'rep', { ...input, repeat: 'daily', reminderTime: '08:00' }, t1);
    updateTask(db, 'rep', { ...input, title: 'Renamed' }, t2);
    expect(listTasks(db)[0]).toMatchObject({
      title: 'Renamed',
      repeat: 'daily',
      reminderTime: '08:00',
    });

    updateTask(db, 'rep', { ...input, repeat: 'monthly', reminderTime: null }, t2);
    expect(listTasks(db)[0]).toMatchObject({ repeat: 'monthly', reminderTime: null });
  });

  it('saves the category, defaults to none, and keeps it when an edit leaves it out', () => {
    createTask(db, 'plain', input, t1);
    createTask(db, 'cat', { ...input, category: 'deep' }, t1);
    expect(listTasks(db).map((t) => t.category)).toEqual(['none', 'deep']);

    updateTask(db, 'cat', { ...input, title: 'Renamed' }, t2);
    expect(listTasks(db)[1].category).toBe('deep');
    updateTask(db, 'cat', { ...input, category: 'health' }, t2);
    expect(listTasks(db)[1].category).toBe('health');
  });

  it('adds the next copy when a repeating task is finished', () => {
    createTask(db, 'rep', { ...input, repeat: 'daily', reminderTime: '08:00' }, t1);
    const created = completeTask(db, 'rep', '2026-10-14', t2, 'next-1');

    expect(created).toBe('next-1');
    const tasks = listTasks(db);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({ id: 'rep', completedAt: t2 });
    expect(tasks[1]).toMatchObject({
      id: 'next-1',
      title: 'Call the bank',
      notes: 'Ask about fees',
      dueDate: '2026-10-15',
      priority: 2,
      repeat: 'daily',
      reminderTime: '08:00',
      completedAt: null,
    });
  });

  it('adds no copy for a task that does not repeat, and none for a second tap', () => {
    createTask(db, 'once', input, t1);
    expect(completeTask(db, 'once', '2026-10-14', t2, 'x')).toBeNull();
    expect(listTasks(db)).toHaveLength(1);

    createTask(db, 'rep', { ...input, repeat: 'daily' }, t1);
    completeTask(db, 'rep', '2026-10-14', t2, 'n1');
    expect(completeTask(db, 'rep', '2026-10-14', t2, 'n2')).toBeNull();
    expect(listTasks(db)).toHaveLength(3);
  });
});
