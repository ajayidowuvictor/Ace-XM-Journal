import { describe, expect, it } from '@jest/globals';

import { migrate, migrations } from '../migrations';
import { APP_TABLES, copyAppData } from '../moveAppData';
import { createTestDatabase } from '../testing/testDatabase';
import { listTasks } from '../tasksRepo';

function filledSource() {
  const db = createTestDatabase();
  migrate(db);
  db.run(
    `INSERT INTO tasks (id, title, notes, due_date, priority, repeat, reminder_time, category, completed_at, created_at, updated_at, deleted_at)
     VALUES ('t1', 'Pay "rent"', 'n', '2026-10-20', 2, 'monthly', '08:00', 'personal', NULL, 'c', 'u', NULL),
            ('t2', 'Old', '', NULL, 0, 'none', NULL, 'none', 'done', 'c', 'u', 'gone')`,
  );
  db.run(`INSERT INTO habits (id, name, created_at, updated_at) VALUES ('h1', 'Read', 'c', 'u')`);
  db.run(
    `INSERT INTO habit_completions (habit_id, completed_date, created_at) VALUES ('h1', '2026-10-14', 'c'), ('h1', '2026-10-15', 'c')`,
  );
  db.run(`INSERT INTO goals (id, title, notes, created_at, updated_at) VALUES ('g1', 'Run', '', 'c', 'u')`);
  db.run(
    `INSERT INTO milestones (id, goal_id, title, created_at, updated_at) VALUES ('m1', 'g1', 'Week 1', 'c', 'u')`,
  );
  db.run(`INSERT INTO plan_focus (plan_date, task_id, position, created_at) VALUES ('2026-10-16', 't1', 0, 'c')`);
  db.run(
    `INSERT INTO plan_blocks (id, plan_date, title, task_id, start_minutes, duration_minutes, created_at, updated_at)
     VALUES ('b1', '2026-10-16', 'Focus', 't1', 540, 60, 'c', 'u')`,
  );
  return db;
}

function counts(db: ReturnType<typeof createTestDatabase>) {
  return APP_TABLES.map((table) => db.first<{ n: number }>(`SELECT count(*) AS n FROM ${table}`)?.n);
}

describe('copyAppData', () => {
  it('copies every row of every table, including deleted ones', () => {
    const from = filledSource();
    const to = createTestDatabase();
    migrate(to);

    copyAppData(from, to);

    expect(counts(to)).toEqual(counts(from));
    expect(counts(to)).toEqual([2, 1, 2, 1, 1, 1, 1]);
    expect(listTasks(to)).toEqual(listTasks(from));
    expect(listTasks(to)[0]).toMatchObject({ title: 'Pay "rent"', category: 'personal' });
  });

  it('is safe to run twice', () => {
    const from = filledSource();
    const to = createTestDatabase();
    migrate(to);
    copyAppData(from, to);
    copyAppData(from, to);
    expect(counts(to)).toEqual([2, 1, 2, 1, 1, 1, 1]);
  });

  it('leaves the target as it was when the copy fails', () => {
    const from = filledSource();
    // A target made before the category column existed cannot take the tasks.
    const to = createTestDatabase();
    migrate(to, migrations.slice(0, 5));

    expect(() => copyAppData(from, to)).toThrow();
    expect(counts(to)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('copies nothing from an empty source', () => {
    const from = createTestDatabase();
    migrate(from);
    const to = createTestDatabase();
    migrate(to);
    copyAppData(from, to);
    expect(counts(to)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});
