import { isValidDateString } from '../../lib/dates';
import type { Note } from '../notes/types';

/** A whole number that goes up by one each calendar day, so the same date always gives the same pick. */
export function dayNumber(localDate: string): number {
  if (!isValidDateString(localDate)) return 0;
  const [year, month, day] = localDate.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * The saved verse to show on a given day, chosen from the owner's own verses (notes of the verse
 * kind that have some text). It changes once a day and is the same all day. Null when there are none.
 */
export function verseOfTheDay(notes: readonly Note[], localDate: string): Note | null {
  const verses = notes
    .filter((note) => note.kind === 'verse' && note.body.trim() !== '')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  if (verses.length === 0) return null;
  return verses[dayNumber(localDate) % verses.length];
}

/** Short prompts for the daily check-in. They ask a question and never contain the person's words. */
export const CHECK_IN_PROMPTS: readonly string[] = [
  'What brought you peace today?',
  'What are you grateful for right now?',
  'What is one thing that went well today?',
  'What is weighing on your mind, and what could you let go of?',
  'Who are you thankful for today, and why?',
  'What did you learn today?',
  'What would make tomorrow a good day?',
  'Where did you see kindness today?',
  'What is one small win you can celebrate?',
  'What are you looking forward to?',
  'What do you need more of, or less of, this week?',
  'How are you really feeling right now?',
  'What is one thing you want to remember about today?',
  'What would you tell a friend in your place?',
];

/** The check-in prompt for a day. It changes daily. */
export function checkInPrompt(localDate: string): string {
  return CHECK_IN_PROMPTS[dayNumber(localDate) % CHECK_IN_PROMPTS.length];
}
