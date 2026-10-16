import type { Goal } from '../goals/types';
import type { Habit } from '../habits/types';
import type { JournalEntry } from '../journal/types';
import { entryHeadline } from '../journal/logic';
import { noteHeadline } from '../notes/logic';
import type { Note } from '../notes/types';
import type { Task } from '../tasks/types';

export type SearchKind = 'task' | 'goal' | 'habit' | 'entry' | 'note';

export type SearchHit = {
  kind: SearchKind;
  id: string;
  title: string;
  /** A short piece of the text around the match, or a status such as "Done". May be empty. */
  detail: string;
};

export type SearchGroup = { kind: SearchKind; label: string; hits: SearchHit[]; total: number };

export type SearchData = {
  tasks: readonly Task[];
  goals: readonly Goal[];
  habits: readonly Habit[];
  entries: readonly JournalEntry[];
  notes: readonly Note[];
};

export const GROUP_LABELS: Record<SearchKind, string> = {
  task: 'Tasks',
  goal: 'Goals',
  habit: 'Habits',
  entry: 'Journal',
  note: 'Notes',
};

/** Searches start once there are at least this many letters. */
export const MIN_QUERY_LENGTH = 2;

/** Most results shown for each kind. The group still says how many there are in all. */
export const MAX_HITS_PER_KIND = 8;

const ORDER: readonly SearchKind[] = ['task', 'goal', 'habit', 'entry', 'note'];

/** The search words: lower case, split on spaces. Empty when the search is too short. */
export function searchTerms(query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

function matches(terms: readonly string[], fields: readonly string[]): boolean {
  const text = fields.join('\n').toLowerCase();
  return terms.every((term) => text.includes(term));
}

/**
 * A short piece of `text` around the first search word, with "..." where it was cut. If no word
 * is in the text, its first words are used instead.
 */
export function snippet(text: string, terms: readonly string[], around = 45): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  const lower = flat.toLowerCase();
  let at = -1;
  for (const term of terms) {
    at = lower.indexOf(term);
    if (at !== -1) break;
  }
  if (at === -1) return flat.length > around * 2 ? `${flat.slice(0, around * 2).trimEnd()}...` : flat;
  const start = Math.max(0, at - around);
  const end = Math.min(flat.length, at + around);
  return `${start > 0 ? '...' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '...' : ''}`;
}

/** The first of several texts that contains a search word, shown as a snippet. */
function detailFrom(texts: readonly string[], terms: readonly string[]): string {
  const found = texts.find((text) => terms.some((term) => text.toLowerCase().includes(term)));
  return snippet(found ?? texts.find((text) => text.trim()) ?? '', terms);
}

function group(kind: SearchKind, all: SearchHit[]): SearchGroup | null {
  if (all.length === 0) return null;
  return { kind, label: GROUP_LABELS[kind], hits: all.slice(0, MAX_HITS_PER_KIND), total: all.length };
}

/**
 * Finds everything that contains every search word, grouped by kind. Matching ignores upper and
 * lower case. Open tasks are listed before finished ones; entries and notes keep the order they
 * are given in (newest first). Nothing is saved or logged.
 */
export function searchAll(data: SearchData, query: string): SearchGroup[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];

  const taskHits = [...data.tasks]
    .filter((task) => matches(terms, [task.title, task.notes]))
    .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)))
    .map<SearchHit>((task) => ({
      kind: 'task',
      id: task.id,
      title: task.title,
      detail: task.completedAt ? 'Done' : detailFrom([task.notes], terms),
    }));

  const goalHits = data.goals
    .filter((goal) =>
      matches(terms, [goal.title, goal.notes, ...goal.milestones.map((step) => step.title)]),
    )
    .map<SearchHit>((goal) => ({
      kind: 'goal',
      id: goal.id,
      title: goal.title,
      detail: detailFrom([goal.notes, ...goal.milestones.map((step) => step.title)], terms),
    }));

  const habitHits = data.habits
    .filter((habit) => matches(terms, [habit.name]))
    .map<SearchHit>((habit) => ({ kind: 'habit', id: habit.id, title: habit.name, detail: '' }));

  const entryHits = data.entries
    .filter((entry) => matches(terms, [entry.title, entry.body, entry.tags.join(' ')]))
    .map<SearchHit>((entry) => ({
      kind: 'entry',
      id: entry.id,
      title: entryHeadline(entry),
      detail: detailFrom([entry.body, entry.tags.join(' ')], terms),
    }));

  const noteHits = data.notes
    .filter((note) => matches(terms, [note.title, note.body, note.reference]))
    .map<SearchHit>((note) => ({
      kind: 'note',
      id: note.id,
      title: noteHeadline(note),
      detail: detailFrom([note.body, note.reference], terms),
    }));

  const byKind: Record<SearchKind, SearchHit[]> = {
    task: taskHits,
    goal: goalHits,
    habit: habitHits,
    entry: entryHits,
    note: noteHits,
  };
  return ORDER.map((kind) => group(kind, byKind[kind])).filter(
    (item): item is SearchGroup => item !== null,
  );
}

/** How many results there are in all, for a screen reader summary. */
export function totalHits(groups: readonly SearchGroup[]): number {
  return groups.reduce((sum, item) => sum + item.total, 0);
}
