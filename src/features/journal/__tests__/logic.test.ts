import { describe, expect, it } from '@jest/globals';

import type { JournalEntry } from '../types';

import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  entryHeadline,
  escapeLike,
  isEmptyEntry,
  moodFor,
  normalizeTag,
  parseTags,
  recentDays,
  relativeDayLabel,
  entriesOnDay,
  tagsToText,
} from '../logic';

describe('tags', () => {
  it('cleans one tag', () => {
    expect(normalizeTag('  ##Work   Life ')).toBe('work life');
    expect(normalizeTag('#')).toBe('');
    expect(normalizeTag('a'.repeat(MAX_TAG_LENGTH + 5))).toHaveLength(MAX_TAG_LENGTH);
  });

  it('splits on commas and new lines, removes blanks and repeats, keeps order', () => {
    expect(parseTags('Work, #Family,, work\nhealth')).toEqual(['work', 'family', 'health']);
    expect(parseTags('')).toEqual([]);
  });

  it('keeps at most the allowed number of tags', () => {
    const many = Array.from({ length: MAX_TAGS + 5 }, (_, i) => `t${i}`).join(',');
    expect(parseTags(many)).toHaveLength(MAX_TAGS);
  });

  it('turns tags back into editable text', () => {
    expect(tagsToText(['a', 'b'])).toBe('a, b');
  });
});

describe('escapeLike', () => {
  it('escapes the characters that act as wildcards', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});

describe('isEmptyEntry', () => {
  it('is empty only when there is no text, mood or tag', () => {
    expect(isEmptyEntry({ title: ' ', body: '\n', mood: null, tags: [] })).toBe(true);
    expect(isEmptyEntry({ title: '', body: 'x', mood: null, tags: [] })).toBe(false);
    expect(isEmptyEntry({ title: '', body: '', mood: 3, tags: [] })).toBe(false);
    expect(isEmptyEntry({ title: '', body: '', mood: null, tags: ['a'] })).toBe(false);
  });
});

describe('entryHeadline', () => {
  it('prefers the title, then the first line of text, then a placeholder', () => {
    expect(entryHeadline({ title: 'Title', body: 'Body' })).toBe('Title');
    expect(entryHeadline({ title: ' ', body: '\nFirst line\nSecond' })).toBe('First line');
    expect(entryHeadline({ title: '', body: '' })).toBe('Untitled entry');
  });

  it('shortens a long first line', () => {
    const headline = entryHeadline({ title: '', body: 'x'.repeat(200) });
    expect(headline).toHaveLength(80);
    expect(headline.endsWith('...')).toBe(true);
  });
});

describe('moodFor', () => {
  it('finds a mood by value and returns null for none', () => {
    expect(moodFor(5)?.label).toBe('Great');
    expect(moodFor(null)).toBeNull();
    expect(moodFor(9)).toBeNull();
  });
});

describe('recentDays', () => {
  it('lists the last days ending today, oldest first, across a month end', () => {
    expect(recentDays('2026-11-02', 4)).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(recentDays('2026-10-16')).toHaveLength(7);
    expect(recentDays('2026-10-16')[6]).toBe('2026-10-16');
  });
});

describe('relativeDayLabel', () => {
  it('names today and yesterday only', () => {
    expect(relativeDayLabel('2026-10-16', '2026-10-16')).toBe('Today');
    expect(relativeDayLabel('2026-10-15', '2026-10-16')).toBe('Yesterday');
    expect(relativeDayLabel('2026-10-14', '2026-10-16')).toBeNull();
    expect(relativeDayLabel('2026-10-31', '2026-11-01')).toBe('Yesterday');
  });
});

describe('entriesOnDay', () => {
  const make = (id: string, entryDate: string): JournalEntry => ({
    id,
    entryDate,
    title: '',
    body: '',
    mood: null,
    tags: [],
    createdAt: 'x',
    updatedAt: 'x',
  });
  const entries = [make('a', '2026-10-16'), make('b', '2026-10-15'), make('c', '2026-10-16')];

  it('keeps all entries when no day is chosen, or only that day', () => {
    expect(entriesOnDay(entries, null).map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(entriesOnDay(entries, '2026-10-16').map((e) => e.id)).toEqual(['a', 'c']);
    expect(entriesOnDay(entries, '2026-10-01')).toEqual([]);
  });
});
