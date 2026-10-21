import { describe, expect, it } from '@jest/globals';

import type { Goal } from '../../goals/types';
import type { Habit } from '../../habits/types';
import type { JournalEntry } from '../../journal/types';
import type { Note } from '../../notes/types';
import type { Task } from '../../tasks/types';
import {
  MAX_HITS_PER_KIND,
  searchAll,
  searchTerms,
  snippet,
  totalHits,
  type SearchData,
} from '../logic';

function task(id: string, title: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title,
    notes: '',
    dueDate: null,
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

const goal: Goal = {
  id: 'g1',
  title: 'Run a half marathon',
  notes: 'Train three times a week',
  targetDate: null,
  completedAt: null,
  createdAt: 'x',
  milestones: [{ id: 'm1', goalId: 'g1', title: 'Buy new shoes', completedAt: null }],
};

const habit: Habit = {
  id: 'h1',
  name: 'Read the Bible',
  completedDates: [],
  days: [0, 1, 2, 3, 4, 5, 6],
  createdAt: 'x',
};

const entry: JournalEntry = {
  id: 'e1',
  entryDate: '2026-10-14',
  title: '',
  body: 'Today I walked to the market and thought about my father.',
  mood: 3,
  tags: ['family'],
  createdAt: 'x',
  updatedAt: 'x',
};

const verse: Note = {
  id: 'n1',
  notebookId: null,
  kind: 'verse',
  title: '',
  body: 'For God so loved the world',
  reference: 'John 3:16 (KJV)',
  pinned: false,
  createdAt: 'x',
  updatedAt: 'x',
};

const data: SearchData = {
  tasks: [
    task('t1', 'Call the bank', { notes: 'Ask about the loan fees' }),
    task('t2', 'Bank statement', { completedAt: '2026-10-10T00:00:00.000Z' }),
    task('t3', 'Buy bread'),
  ],
  goals: [goal],
  habits: [habit],
  entries: [entry],
  notes: [verse],
};

describe('searchTerms', () => {
  it('splits into lower case words and ignores very short searches', () => {
    expect(searchTerms('  Bank   Loan ')).toEqual(['bank', 'loan']);
    expect(searchTerms('b')).toEqual([]);
    expect(searchTerms('   ')).toEqual([]);
  });
});

describe('snippet', () => {
  it('shows the text around the match with dots where it was cut', () => {
    const text = `${'a'.repeat(100)} needle ${'b'.repeat(100)}`;
    const result = snippet(text, ['needle'], 10);
    expect(result.startsWith('...')).toBe(true);
    expect(result.endsWith('...')).toBe(true);
    expect(result).toContain('needle');
    expect(result.length).toBeLessThan(40);
  });

  it('gives short text whole, and the start of long text when nothing matches', () => {
    expect(snippet('Short  text\nhere', ['zzz'])).toBe('Short text here');
    expect(snippet('x'.repeat(300), ['zzz'], 20)).toBe(`${'x'.repeat(40)}...`);
    expect(snippet('   ', ['a'])).toBe('');
  });
});

describe('searchAll', () => {
  it('finds nothing for an empty or too short search', () => {
    expect(searchAll(data, '')).toEqual([]);
    expect(searchAll(data, 'a')).toEqual([]);
  });

  it('ignores upper and lower case and lists open tasks before done ones', () => {
    const groups = searchAll(data, 'BANK');
    const tasks = groups.find((item) => item.kind === 'task');
    expect(tasks?.hits.map((hit) => hit.id)).toEqual(['t1', 't2']);
    expect(tasks?.hits[1].detail).toBe('Done');
  });

  it('needs every word to be there, in any order', () => {
    expect(searchAll(data, 'bank loan')[0].hits.map((hit) => hit.id)).toEqual(['t1']);
    expect(searchAll(data, 'loan bank')[0].hits.map((hit) => hit.id)).toEqual(['t1']);
    expect(searchAll(data, 'bank bread')).toEqual([]);
  });

  it('searches goals and their steps, habits, journal entries and notes', () => {
    expect(searchAll(data, 'shoes')[0]).toMatchObject({ kind: 'goal', label: 'Goals' });
    expect(searchAll(data, 'bible')[0]).toMatchObject({ kind: 'habit', total: 1 });
    expect(searchAll(data, 'family')[0].hits[0]).toMatchObject({ kind: 'entry', id: 'e1' });
    expect(searchAll(data, 'market')[0].hits[0].detail).toContain('market');
    expect(searchAll(data, 'john 3:16')[0].hits[0]).toMatchObject({
      kind: 'note',
      id: 'n1',
      title: 'John 3:16 (KJV)',
    });
  });

  it('groups results in a fixed order and counts them', () => {
    const extra: SearchData = {
      ...data,
      habits: [{ ...habit, name: 'Walk to the market' }],
    };
    const groups = searchAll(extra, 'market');
    expect(groups.map((item) => item.kind)).toEqual(['habit', 'entry']);
    expect(totalHits(groups)).toBe(2);
  });

  it('shows a limited number per kind but still counts them all', () => {
    const many: SearchData = {
      ...data,
      tasks: Array.from({ length: MAX_HITS_PER_KIND + 5 }, (_, index) =>
        task(`x${index}`, `Pay invoice ${index}`),
      ),
    };
    const [tasks] = searchAll(many, 'invoice');
    expect(tasks.hits).toHaveLength(MAX_HITS_PER_KIND);
    expect(tasks.total).toBe(MAX_HITS_PER_KIND + 5);
  });
});
