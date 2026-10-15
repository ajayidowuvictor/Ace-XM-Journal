import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  addMilestone,
  createGoal,
  deleteGoal,
  deleteMilestone,
  listGoals,
  setGoalDone,
  setMilestoneDone,
  updateGoal,
} from '../goalsRepo';
import { migrate } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';
import type { SqlDatabase } from '../types';

const t1 = '2026-10-14T08:00:00.000Z';
const t2 = '2026-10-14T09:00:00.000Z';
const input = { title: 'Run a 10k', notes: 'By spring', targetDate: '2027-03-01' };

let db: SqlDatabase;

beforeEach(() => {
  db = createTestDatabase();
  migrate(db);
});

describe('goals repository', () => {
  it('saves a goal with no steps', () => {
    createGoal(db, 'g1', input, t1);
    expect(listGoals(db)).toEqual([
      {
        id: 'g1',
        title: 'Run a 10k',
        notes: 'By spring',
        targetDate: '2027-03-01',
        completedAt: null,
        milestones: [],
        createdAt: t1,
      },
    ]);
  });

  it('updates the text and target date', () => {
    createGoal(db, 'g1', input, t1);
    updateGoal(db, 'g1', { title: 'Run a half marathon', notes: '', targetDate: null }, t2);
    expect(listGoals(db)[0]).toMatchObject({
      title: 'Run a half marathon',
      notes: '',
      targetDate: null,
    });
  });

  it('adds steps in order and ticks and unticks them', () => {
    createGoal(db, 'g1', input, t1);
    addMilestone(db, 'm1', 'g1', 'Buy shoes', t1);
    addMilestone(db, 'm2', 'g1', 'Run 5k', t2);
    setMilestoneDone(db, 'm1', true, t2);

    let steps = listGoals(db)[0].milestones;
    expect(steps.map((m) => [m.title, m.completedAt])).toEqual([
      ['Buy shoes', t2],
      ['Run 5k', null],
    ]);

    setMilestoneDone(db, 'm1', false, t2);
    steps = listGoals(db)[0].milestones;
    expect(steps[0].completedAt).toBeNull();
  });

  it('marks a goal done and reopens it', () => {
    createGoal(db, 'g1', input, t1);
    setGoalDone(db, 'g1', true, t2);
    expect(listGoals(db)[0].completedAt).toBe(t2);
    setGoalDone(db, 'g1', false, t2);
    expect(listGoals(db)[0].completedAt).toBeNull();
  });

  it('removes a single step', () => {
    createGoal(db, 'g1', input, t1);
    addMilestone(db, 'm1', 'g1', 'Buy shoes', t1);
    addMilestone(db, 'm2', 'g1', 'Run 5k', t1);
    deleteMilestone(db, 'm1', t2);
    expect(listGoals(db)[0].milestones.map((m) => m.id)).toEqual(['m2']);
  });

  it('erases a deleted goal and its steps and hides them', () => {
    createGoal(db, 'g1', input, t1);
    createGoal(db, 'g2', { ...input, title: 'Keep' }, t1);
    addMilestone(db, 'm1', 'g1', 'Secret step', t1);

    deleteGoal(db, 'g1', t2);

    expect(listGoals(db).map((g) => g.id)).toEqual(['g2']);
    expect(db.first(`SELECT title, notes FROM goals WHERE id = 'g1'`)).toEqual({
      title: '',
      notes: '',
    });
    expect(db.first(`SELECT title FROM milestones WHERE id = 'm1'`)).toEqual({ title: '' });
  });

  it('does not add a step to a deleted or missing goal', () => {
    createGoal(db, 'g1', input, t1);
    deleteGoal(db, 'g1', t2);
    addMilestone(db, 'm1', 'g1', 'Late step', t2);
    addMilestone(db, 'm2', 'nope', 'Orphan', t2);
    expect(db.all('SELECT id FROM milestones')).toEqual([]);
  });
});
