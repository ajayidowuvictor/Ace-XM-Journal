import type { EntryInput, JournalEntry, Mood } from './types';

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

export const MOODS: readonly { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Very low' },
  { value: 2, emoji: '🙁', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

/** One tag: lower case, no leading #, inner spaces collapsed. Empty when nothing is left. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .slice(0, MAX_TAG_LENGTH);
}

/** Turns "Work, #Family, work" into ["work", "family"]: unique, in order, at most MAX_TAGS. */
export function parseTags(text: string): string[] {
  const tags: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const tag = normalizeTag(part);
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, MAX_TAGS);
}

export function tagsToText(tags: readonly string[]): string {
  return tags.join(', ');
}

/** Escapes % and _ so a search is matched as typed (used with `LIKE ? ESCAPE '\'`). */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** True when there is nothing worth saving yet. */
export function isEmptyEntry(input: EntryInput): boolean {
  return (
    !input.title.trim() && !input.body.trim() && input.mood === null && input.tags.length === 0
  );
}

/** The line shown for an entry in the list: its title, else the start of its text. */
export function entryHeadline(entry: Pick<JournalEntry, 'title' | 'body'>): string {
  const title = entry.title.trim();
  if (title) return title;
  const firstLine = entry.body.trim().split('\n')[0] ?? '';
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine || 'Untitled entry';
}

export function moodFor(value: number | null): (typeof MOODS)[number] | null {
  return MOODS.find((mood) => mood.value === value) ?? null;
}
