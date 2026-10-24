import { describe, expect, it } from '@jest/globals';

import { journalMigrations } from '../../../db/journalMigrations';
import { createEntry, listEntries } from '../../../db/journalRepo';
import { addMilestone, createGoal, listGoals, setGoalDone } from '../../../db/goalsRepo';
import { createHabit, listHabits, setHabitDone } from '../../../db/habitsRepo';
import { migrate } from '../../../db/migrations';
import { createNote, createNotebook, listNotebooks, listNotes } from '../../../db/notesRepo';
import { createBlock, listBlocks, listFocus, replaceFocus } from '../../../db/plannerRepo';
import { restoreAppData, restoreJournalData } from '../../../db/restoreRepo';
import { createTask, listTasks, setTaskCompleted } from '../../../db/tasksRepo';
import { createTestDatabase } from '../../../db/testing/testDatabase';
import { buildExport } from '../../export/buildExport';
import { parseBackupData, summarizeBackup } from '../parseBackup';

const t = (n: number) => `2026-10-1${n}T08:00:00.000Z`;

function filledDatabases() {
  const app = createTestDatabase();
  migrate(app);
  const journal = createTestDatabase();
  migrate(journal, journalMigrations);

  createTask(
    app,
    'task-1',
    {
      title: 'Pay rent',
      notes: 'Bank "A"',
      dueDate: '2026-10-14',
      priority: 3,
      repeat: 'monthly',
      reminderTime: '09:00',
      category: 'health',
      goalId: 'goal-1',
    },
    t(1),
  );
  createTask(app, 'task-2', { title: 'Call mum', notes: '', dueDate: null, priority: 0 }, t(2));
  setTaskCompleted(app, 'task-2', true, t(3));

  createHabit(app, 'habit-1', 'Read', t(1), [0, 2, 4]);
  setHabitDone(app, 'habit-1', '2026-10-12', true, t(2));
  setHabitDone(app, 'habit-1', '2026-10-13', true, t(2));

  createGoal(app, 'goal-1', { title: 'Ship app', notes: 'v1', targetDate: '2026-12-01' }, t(1));
  addMilestone(app, 'zzz-last-id', 'goal-1', 'Step one', t(2));
  addMilestone(app, 'aaa-first-id', 'goal-1', 'Step two', t(3));
  addMilestone(app, 'mmm-middle-id', 'goal-1', 'Step three', t(4));
  setGoalDone(app, 'goal-1', true, t(5));

  replaceFocus(app, '2026-10-15', ['task-1'], t(1));
  createBlock(
    app,
    'block-1',
    '2026-10-15',
    { title: 'Deep work', taskId: 'task-1', startMinutes: 540, durationMinutes: 90 },
    t(1),
  );

  createEntry(
    journal,
    'entry-1',
    '2026-10-14',
    { title: 'Day', body: 'Line 1\nLine 2 🙏', mood: 4, tags: ['work', 'family'] },
    t(1),
  );
  createNotebook(journal, 'nb-1', 'Scriptures', t(1));
  createNote(
    journal,
    'note-1',
    {
      notebookId: 'nb-1',
      kind: 'verse',
      title: '',
      body: 'Be still.',
      reference: 'Psalm 46:10',
      pinned: true,
    },
    t(2),
  );
  return { app, journal };
}

function exportText(
  app: ReturnType<typeof createTestDatabase>,
  journal: ReturnType<typeof createTestDatabase>,
) {
  return buildExport(
    {
      tasks: listTasks(app),
      habits: listHabits(app),
      goals: listGoals(app),
      entries: listEntries(journal),
      plan: { focus: listFocus(app), blocks: listBlocks(app) },
      notes: { notebooks: listNotebooks(journal), notes: listNotes(journal) },
    },
    t(9),
  );
}

describe('restoring a backup', () => {
  it('puts back exactly what was exported, including order, dates and text', () => {
    const { app, journal } = filledDatabases();
    const text = exportText(app, journal);
    const data = parseBackupData(text);
    expect(data).not.toBeNull();

    const freshApp = createTestDatabase();
    migrate(freshApp);
    const freshJournal = createTestDatabase();
    migrate(freshJournal, journalMigrations);
    restoreAppData(freshApp, data!, t(9));
    restoreJournalData(freshJournal, data!);

    expect(listTasks(freshApp)).toEqual(listTasks(app));
    expect(listHabits(freshApp)).toEqual(listHabits(app));
    expect(listGoals(freshApp)).toEqual(listGoals(app));
    expect(listFocus(freshApp)).toEqual(listFocus(app));
    expect(listBlocks(freshApp)).toEqual(listBlocks(app));
    expect(listEntries(freshJournal)).toEqual(listEntries(journal));
    expect(listNotebooks(freshJournal)).toEqual(listNotebooks(journal));
    expect(listNotes(freshJournal)).toEqual(listNotes(journal));

    expect(listGoals(freshApp)[0].milestones.map((m) => m.title)).toEqual([
      'Step one',
      'Step two',
      'Step three',
    ]);
  });

  it('replaces what is already on the phone', () => {
    const { app, journal } = filledDatabases();
    const data = parseBackupData(exportText(app, journal))!;

    const other = createTestDatabase();
    migrate(other);
    createTask(other, 'old', { title: 'Old task', notes: '', dueDate: null, priority: 0 }, t(1));
    restoreAppData(other, data, t(9));

    expect(listTasks(other).map((x) => x.id)).toEqual(['task-1', 'task-2']);
  });

  it('leaves the current data alone if the restore fails part-way', () => {
    const { app, journal } = filledDatabases();
    const data = parseBackupData(exportText(app, journal))!;
    // Two tasks with the same id cannot be stored, so the second insert fails.
    const broken = { ...data, tasks: [data.tasks[0], data.tasks[0]] };

    const other = createTestDatabase();
    migrate(other);
    createTask(other, 'keep', { title: 'Keep me', notes: '', dueDate: null, priority: 0 }, t(1));

    expect(() => restoreAppData(other, broken, t(9))).toThrow();
    expect(listTasks(other).map((x) => x.id)).toEqual(['keep']);
  });
});

describe('parseBackupData', () => {
  it('reads the days a habit repeats on, and gives older backups every day', () => {
    const withDays = parseBackupData(
      JSON.stringify({
        app: 'ACE XM JOURNAL',
        habits: [{ id: 'h', name: 'x', completedDates: [], days: [4, 0, 2], createdAt: 'a' }],
      }),
    );
    expect(withDays?.habits[0].days).toEqual([0, 2, 4]);

    const older = parseBackupData(
      JSON.stringify({
        app: 'ACE XM JOURNAL',
        habits: [{ id: 'h', name: 'x', completedDates: [], createdAt: 'a' }],
      }),
    );
    expect(older?.habits[0].days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('reads which goal a task counts towards, and drops links to goals that are not there', () => {
    const task = (id: string, extra: object) => ({
      id,
      title: id,
      notes: '',
      dueDate: null,
      priority: 0,
      completedAt: null,
      createdAt: 'a',
      updatedAt: 'a',
      ...extra,
    });
    const parsed = parseBackupData(
      JSON.stringify({
        app: 'ACE XM JOURNAL',
        tasks: [
          task('linked', { goalId: 'g1' }),
          task('dangling', { goalId: 'gone' }),
          task('older', {}),
        ],
        goals: [{ id: 'g1', title: 'Goal', notes: '', createdAt: 'a', milestones: [] }],
      }),
    );
    expect(parsed?.tasks.map((x) => x.goalId)).toEqual(['g1', null, null]);
  });

  it('refuses text that is not an export', () => {
    expect(parseBackupData('nope')).toBeNull();
    expect(parseBackupData('{}')).toBeNull();
    expect(parseBackupData('{"app":"Other"}')).toBeNull();
    expect(parseBackupData('[]')).toBeNull();
  });

  it('refuses records with missing or wrong fields instead of half restoring', () => {
    const base = { app: 'ACE XM JOURNAL' };
    expect(parseBackupData(JSON.stringify({ ...base, tasks: [{ title: 'No id' }] }))).toBeNull();
    expect(parseBackupData(JSON.stringify({ ...base, tasks: 'oops' }))).toBeNull();
    expect(
      parseBackupData(
        JSON.stringify({
          ...base,
          habits: [{ id: 'h', name: 'x', completedDates: [1], createdAt: 'a' }],
        }),
      ),
    ).toBeNull();
  });

  it('accepts an older export that has no notes or day plans', () => {
    const data = parseBackupData(
      JSON.stringify({
        app: 'ACE XM JOURNAL',
        exportVersion: 1,
        tasks: [],
        habits: [],
        goals: [],
        journalEntries: [],
      }),
    );
    expect(data).not.toBeNull();
    expect(data!.notes).toEqual([]);
    expect(data!.focus).toEqual([]);
  });
});

describe('tasks from before repeats and reminders existed', () => {
  it('come back as tasks that do not repeat and have no reminder', () => {
    const data = parseBackupData(
      JSON.stringify({
        app: 'ACE XM JOURNAL',
        exportVersion: 1,
        tasks: [
          {
            id: 'old',
            title: 'Old task',
            notes: '',
            dueDate: '2026-10-14',
            priority: 1,
            completedAt: null,
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
          },
          { id: 'odd', title: 'Odd', createdAt: 'x', repeat: 'hourly', reminderTime: '99:99' },
        ],
        habits: [],
        goals: [],
        journalEntries: [],
      }),
    );
    expect(data!.tasks[0]).toMatchObject({ repeat: 'none', reminderTime: null });
    expect(data!.tasks[1]).toMatchObject({ repeat: 'none', reminderTime: null });
    expect(data!.tasks[0].category).toBe('none');
  });
});

describe('summarizeBackup', () => {
  it('lists what is inside in plain words', () => {
    const { app, journal } = filledDatabases();
    const data = parseBackupData(exportText(app, journal))!;
    expect(summarizeBackup(data)).toBe('2 tasks, 1 habit, 1 goal, 1 journal entry, 1 note');
    expect(
      summarizeBackup({ ...data, tasks: [], habits: [], goals: [], entries: [], notes: [] }),
    ).toBe('nothing yet');
  });
});
