import { beforeEach, describe, expect, it } from '@jest/globals';

import type { TaskInput } from '../../features/tasks/types';
import { migrate } from '../migrations';
import { createTask, deleteTask, listTasks, setTaskCompleted, updateTask } from '../tasksRepo';
import type { SqlDatabase } from '../types';
import { createTestDatabase } from './testDatabase';

const input: TaskInput = { title: 'Call the bank', notes: 'Ask about fees', dueDate: '2026-10-14', priority: 2 };
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
    updateTask(db, 'id-1', { title: 'Call the bank today', notes: '', dueDate: null, priority: 3 }, t2);

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
    expect(db.first<{ deleted_at: string }>(`SELECT deleted_at FROM tasks WHERE id = 'id-1'`)).toEqual({
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
});
