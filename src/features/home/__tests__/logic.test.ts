import { describe, expect, it } from '@jest/globals';

import type { Note } from '../../notes/types';
import { CHECK_IN_PROMPTS, checkInPrompt, dayNumber, verseOfTheDay } from '../logic';

function note(id: string, overrides: Partial<Note> = {}): Note {
  return {
    id,
    notebookId: null,
    kind: 'verse',
    title: '',
    body: `Verse ${id}`,
    reference: id,
    pinned: false,
    createdAt: `2026-10-0${id.length}T00:00:00.000Z`,
    updatedAt: 'x',
    ...overrides,
  };
}

describe('dayNumber', () => {
  it('goes up by one each day, also across month ends', () => {
    expect(dayNumber('2026-10-16') - dayNumber('2026-10-15')).toBe(1);
    expect(dayNumber('2026-11-01') - dayNumber('2026-10-31')).toBe(1);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
  });

  it('is 0 for a date that is not real', () => {
    expect(dayNumber('soon')).toBe(0);
    expect(dayNumber('2026-13-40')).toBe(0);
  });
});

describe('verseOfTheDay', () => {
  const verses = [note('a'), note('bb'), note('ccc')];

  it('gives nothing when there are no saved verses with text', () => {
    expect(verseOfTheDay([], '2026-10-16')).toBeNull();
    expect(
      verseOfTheDay(
        [note('x', { kind: 'note' }), note('y', { body: '   ' }), note('z', { kind: 'text' })],
        '2026-10-16',
      ),
    ).toBeNull();
  });

  it('is the same all day and moves to the next verse the next day', () => {
    const first = verseOfTheDay(verses, '2026-10-16');
    expect(verseOfTheDay(verses, '2026-10-16')).toEqual(first);
    const second = verseOfTheDay(verses, '2026-10-17');
    expect(second).not.toEqual(first);
    const ids = ['2026-10-16', '2026-10-17', '2026-10-18'].map(
      (day) => verseOfTheDay(verses, day)?.id,
    );
    expect(new Set(ids).size).toBe(3);
  });

  it('does not depend on the order the notes come in', () => {
    const shuffled = [verses[2], verses[0], verses[1]];
    expect(verseOfTheDay(shuffled, '2026-10-20')).toEqual(verseOfTheDay(verses, '2026-10-20'));
  });

  it('shows the only verse every day', () => {
    expect(verseOfTheDay([note('a')], '2026-10-16')?.id).toBe('a');
    expect(verseOfTheDay([note('a')], '2026-10-17')?.id).toBe('a');
  });
});

describe('checkInPrompt', () => {
  it('has distinct questions', () => {
    expect(new Set(CHECK_IN_PROMPTS).size).toBe(CHECK_IN_PROMPTS.length);
    for (const prompt of CHECK_IN_PROMPTS) expect(prompt.endsWith('?')).toBe(true);
  });

  it('is the same all day and changes the next day', () => {
    expect(checkInPrompt('2026-10-16')).toBe(checkInPrompt('2026-10-16'));
    expect(checkInPrompt('2026-10-16')).not.toBe(checkInPrompt('2026-10-17'));
  });
});
