import type { Note, NoteInput, NoteKind, NotebookFilter } from './types';

export const MAX_NOTEBOOK_NAME = 40;
export const WORDS_PER_MINUTE = 200;

export const KIND_LABELS: Record<NoteKind, string> = {
  note: 'Note',
  verse: 'Verse',
  text: 'Long text',
};

/** Reading-view text sizes in points, from small to large. */
export const READER_SIZES = [17, 19, 21, 24, 28] as const;
export const DEFAULT_READER_INDEX = 2;

/** Reads a kind from a screen link. Anything unknown is a plain note. */
export function toNoteKind(raw: string | undefined): NoteKind {
  return raw === 'verse' || raw === 'text' ? raw : 'note';
}

/** A notebook name with extra spaces removed and cut to the allowed length. */
export function cleanNotebookName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_NOTEBOOK_NAME);
}

/** True when there is nothing worth saving yet. */
export function isEmptyNote(input: Pick<NoteInput, 'title' | 'body' | 'reference'>): boolean {
  return !input.title.trim() && !input.body.trim() && !input.reference.trim();
}

/** The line shown for a note in the list. */
export function noteHeadline(note: Pick<Note, 'kind' | 'title' | 'body' | 'reference'>): string {
  const title = note.title.trim();
  if (title) return title;
  if (note.kind === 'verse' && note.reference.trim()) return note.reference.trim();
  const firstLine = note.body.trim().split('\n')[0] ?? '';
  if (firstLine) return firstLine.length > 70 ? `${firstLine.slice(0, 67)}...` : firstLine;
  return note.kind === 'verse' ? 'Untitled verse' : note.kind === 'text' ? 'Untitled text' : 'Untitled note';
}

/** A short plain preview of the text for the list (line breaks become spaces). */
export function notePreview(body: string, maxLength = 140): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength - 3).trimEnd()}...` : flat;
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Minutes to read the text at an easy pace, at least 1 for any text. */
export function readingMinutes(text: string): number {
  const words = wordCount(text);
  return words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Such as "1,204 words · 6 min read". Empty when there is no text. */
export function readingSummary(text: string): string {
  const words = wordCount(text);
  if (words === 0) return '';
  const count = `${words.toLocaleString('en-US')} ${words === 1 ? 'word' : 'words'}`;
  return `${count} · ${readingMinutes(text)} min read`;
}

/** Paragraphs for the reading view: blocks of text separated by a blank line. */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Does the note belong to the chosen notebook view? */
export function matchesFilter(note: Pick<Note, 'notebookId'>, filter: NotebookFilter): boolean {
  if (filter.type === 'all') return true;
  if (filter.type === 'unfiled') return note.notebookId === null;
  return note.notebookId === filter.id;
}

/** Notes in the chosen notebook view that contain the search words (ignoring case). */
export function filterNotes(
  notes: readonly Note[],
  options: { filter: NotebookFilter; search: string; kind: NoteKind | null },
): Note[] {
  const term = options.search.trim().toLowerCase();
  return notes.filter((note) => {
    if (!matchesFilter(note, options.filter)) return false;
    if (options.kind !== null && note.kind !== options.kind) return false;
    if (!term) return true;
    return [note.title, note.body, note.reference].some((text) => text.toLowerCase().includes(term));
  });
}

/** Splits an already-ordered list into pinned notes and the rest, keeping their order. */
export function splitPinned(notes: readonly Note[]): { pinned: Note[]; others: Note[] } {
  return {
    pinned: notes.filter((note) => note.pinned),
    others: notes.filter((note) => !note.pinned),
  };
}

/** Reads a saved reading size. Anything that is not a valid size gives the default. */
export function parseReaderIndex(raw: string | null): number {
  const value = raw === null ? Number.NaN : Number(raw);
  return Number.isInteger(value) && value >= 0 && value < READER_SIZES.length
    ? value
    : DEFAULT_READER_INDEX;
}

/** The next reading size index, one step smaller or larger, never leaving the list. */
export function stepReaderSize(index: number, direction: -1 | 1): number {
  return Math.min(READER_SIZES.length - 1, Math.max(0, index + direction));
}

/** Text for the share sheet. A verse reads as a quotation followed by where it is from. */
export function shareText(note: Pick<Note, 'kind' | 'title' | 'body' | 'reference'>): string {
  const body = note.body.trim();
  const reference = note.reference.trim();
  const title = note.title.trim();
  if (note.kind === 'verse') {
    const quote = `“${body}”`;
    return reference ? `${quote}\n— ${reference}` : quote;
  }
  const parts = [title, body, reference ? `— ${reference}` : ''].filter(Boolean);
  return parts.join('\n\n');
}

/** How a count of notes reads under a heading, such as "3 notes". */
export function noteCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'note' : 'notes'}`;
}
