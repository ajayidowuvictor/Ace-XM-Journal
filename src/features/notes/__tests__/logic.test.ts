import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_READER_INDEX,
  READER_SIZES,
  cleanNotebookName,
  filterNotes,
  isEmptyNote,
  matchesFilter,
  noteCountLabel,
  noteHeadline,
  parseReaderIndex,
  notePreview,
  readingMinutes,
  readingSummary,
  shareText,
  splitPinned,
  splitParagraphs,
  stepReaderSize,
  toNoteKind,
  wordCount,
} from '../logic';
import type { Note } from '../types';

function make(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n',
    notebookId: null,
    kind: 'note',
    title: '',
    body: '',
    reference: '',
    pinned: false,
    createdAt: '2026-10-14T08:00:00.000Z',
    updatedAt: '2026-10-14T08:00:00.000Z',
    ...overrides,
  };
}

describe('cleanNotebookName', () => {
  it('trims, collapses spaces and limits the length', () => {
    expect(cleanNotebookName('   Sunday   sermons ')).toBe('Sunday sermons');
    expect(cleanNotebookName('x'.repeat(100))).toHaveLength(40);
    expect(cleanNotebookName('   ')).toBe('');
  });
});

describe('isEmptyNote', () => {
  it('is empty only when title, text and reference are all blank', () => {
    expect(isEmptyNote({ title: ' ', body: '\n', reference: '' })).toBe(true);
    expect(isEmptyNote({ title: '', body: 'x', reference: '' })).toBe(false);
    expect(isEmptyNote({ title: '', body: '', reference: 'John 3:16' })).toBe(false);
  });
});

describe('noteHeadline', () => {
  it('prefers the title', () => {
    expect(noteHeadline(make({ title: 'Plans', body: 'x' }))).toBe('Plans');
  });

  it('uses the reference for a verse without a title', () => {
    expect(noteHeadline(make({ kind: 'verse', reference: 'John 3:16', body: 'For God...' }))).toBe(
      'John 3:16',
    );
  });

  it('falls back to the first line, shortened', () => {
    expect(noteHeadline(make({ body: 'First\nSecond' }))).toBe('First');
    expect(noteHeadline(make({ body: 'a'.repeat(100) }))).toBe(`${'a'.repeat(67)}...`);
  });

  it('names an empty note by its kind', () => {
    expect(noteHeadline(make())).toBe('Untitled note');
    expect(noteHeadline(make({ kind: 'verse' }))).toBe('Untitled verse');
    expect(noteHeadline(make({ kind: 'text' }))).toBe('Untitled text');
  });
});

describe('notePreview', () => {
  it('turns line breaks into spaces and shortens long text', () => {
    expect(notePreview('One\n\nTwo   three')).toBe('One Two three');
    expect(notePreview('word '.repeat(100), 20)).toHaveLength(20);
    expect(notePreview('word '.repeat(100), 20).endsWith('...')).toBe(true);
  });
});

describe('reading time', () => {
  it('counts words', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount('  one   two\nthree ')).toBe(3);
  });

  it('is at least one minute for any text, none for no text', () => {
    expect(readingMinutes('')).toBe(0);
    expect(readingMinutes('a few words')).toBe(1);
    expect(readingMinutes('word '.repeat(1000))).toBe(5);
  });

  it('describes the text in plain words', () => {
    expect(readingSummary('')).toBe('');
    expect(readingSummary('one')).toBe('1 word · 1 min read');
    expect(readingSummary('word '.repeat(1204))).toBe('1,204 words · 6 min read');
  });
});

describe('splitParagraphs', () => {
  it('splits on blank lines and drops empty blocks', () => {
    expect(splitParagraphs('One\nstill one\n\n\n  Two  \n\n')).toEqual(['One\nstill one', 'Two']);
    expect(splitParagraphs('   ')).toEqual([]);
  });
});

describe('filtering', () => {
  const notes = [
    make({ id: 'a', notebookId: 'nb1', title: 'Grace', kind: 'verse', reference: 'Eph 2:8' }),
    make({ id: 'b', notebookId: null, body: 'Buy bread' }),
    make({ id: 'c', notebookId: 'nb2', title: 'Sermon', kind: 'text', body: 'On GRACE and faith' }),
  ];

  it('matches notebook views', () => {
    expect(matchesFilter(notes[0], { type: 'all' })).toBe(true);
    expect(matchesFilter(notes[1], { type: 'unfiled' })).toBe(true);
    expect(matchesFilter(notes[0], { type: 'unfiled' })).toBe(false);
    expect(matchesFilter(notes[0], { type: 'notebook', id: 'nb1' })).toBe(true);
    expect(matchesFilter(notes[0], { type: 'notebook', id: 'nb2' })).toBe(false);
  });

  it('searches title, text and reference, ignoring case', () => {
    const all = { filter: { type: 'all' } as const, kind: null };
    expect(filterNotes(notes, { ...all, search: 'grace' }).map((n) => n.id)).toEqual(['a', 'c']);
    expect(filterNotes(notes, { ...all, search: 'eph 2' }).map((n) => n.id)).toEqual(['a']);
    expect(filterNotes(notes, { ...all, search: 'BREAD' }).map((n) => n.id)).toEqual(['b']);
    expect(filterNotes(notes, { ...all, search: '  ' })).toHaveLength(3);
    expect(filterNotes(notes, { ...all, search: 'nothing' })).toEqual([]);
  });

  it('combines notebook, kind and search', () => {
    expect(
      filterNotes(notes, { filter: { type: 'notebook', id: 'nb2' }, search: 'grace', kind: 'text' }),
    ).toHaveLength(1);
    expect(
      filterNotes(notes, { filter: { type: 'notebook', id: 'nb2' }, search: '', kind: 'verse' }),
    ).toEqual([]);
  });
});

describe('splitPinned', () => {
  it('separates pinned notes and keeps the order', () => {
    const list = [make({ id: '1', pinned: true }), make({ id: '2' }), make({ id: '3', pinned: true })];
    const { pinned, others } = splitPinned(list);
    expect(pinned.map((n) => n.id)).toEqual(['1', '3']);
    expect(others.map((n) => n.id)).toEqual(['2']);
  });
});

describe('stepReaderSize', () => {
  it('moves one step and stops at both ends', () => {
    expect(stepReaderSize(2, 1)).toBe(3);
    expect(stepReaderSize(2, -1)).toBe(1);
    expect(stepReaderSize(0, -1)).toBe(0);
    expect(stepReaderSize(READER_SIZES.length - 1, 1)).toBe(READER_SIZES.length - 1);
  });
});

describe('toNoteKind', () => {
  it('accepts the three kinds and treats anything else as a note', () => {
    expect(toNoteKind('verse')).toBe('verse');
    expect(toNoteKind('text')).toBe('text');
    expect(toNoteKind('note')).toBe('note');
    expect(toNoteKind('other')).toBe('note');
    expect(toNoteKind(undefined)).toBe('note');
  });
});

describe('parseReaderIndex', () => {
  it('accepts a saved valid size and falls back to the default otherwise', () => {
    expect(parseReaderIndex('0')).toBe(0);
    expect(parseReaderIndex('4')).toBe(4);
    expect(parseReaderIndex(null)).toBe(DEFAULT_READER_INDEX);
    expect(parseReaderIndex('9')).toBe(DEFAULT_READER_INDEX);
    expect(parseReaderIndex('-1')).toBe(DEFAULT_READER_INDEX);
    expect(parseReaderIndex('2.5')).toBe(DEFAULT_READER_INDEX);
    expect(parseReaderIndex('big')).toBe(DEFAULT_READER_INDEX);
  });
});

describe('shareText', () => {
  it('writes a verse as a quotation with its reference', () => {
    expect(
      shareText(make({ kind: 'verse', body: ' Jesus wept. ', reference: 'John 11:35' })),
    ).toBe('“Jesus wept.”\n— John 11:35');
  });

  it('writes a verse without a reference as just the quotation', () => {
    expect(shareText(make({ kind: 'verse', body: 'Pray.' }))).toBe('“Pray.”');
  });

  it('writes other notes as title, text and source', () => {
    expect(shareText(make({ kind: 'text', title: 'On rest', body: 'Be still.', reference: 'A. Writer' }))).toBe(
      'On rest\n\nBe still.\n\n— A. Writer',
    );
    expect(shareText(make({ body: 'Only text' }))).toBe('Only text');
  });
});

describe('noteCountLabel', () => {
  it('uses the singular for one', () => {
    expect(noteCountLabel(1)).toBe('1 note');
    expect(noteCountLabel(0)).toBe('0 notes');
    expect(noteCountLabel(12)).toBe('12 notes');
  });
});
