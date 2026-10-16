export type Template = {
  id: string;
  label: string;
  /** Put in the title box. Empty means the title is left for the person to write. */
  title: string;
  body: string;
};

/** Starting points for a journal entry. */
export const ENTRY_TEMPLATES: readonly Template[] = [
  {
    id: 'gratitude',
    label: 'Gratitude',
    title: '',
    body: "Three things I'm grateful for today:\n1. \n2. \n3. \n",
  },
  {
    id: 'reflection',
    label: 'Daily reflection',
    title: '',
    body: "What went well today:\n\n\nWhat was hard:\n\n\nWhat I learned:\n\n\nOne thing I'll do tomorrow:\n",
  },
  {
    id: 'prayer',
    label: 'Prayer',
    title: '',
    body: "Thank you for:\n\n\nI'm asking for:\n\n\nWhat I sense I'm being told:\n",
  },
  {
    id: 'weekly',
    label: 'Weekly check-in',
    title: '',
    body: "Wins this week:\n\n\nWhat I'm stuck on:\n\n\nMy focus for next week:\n",
  },
];

/** Starting points for a note. */
export const NOTE_TEMPLATES: readonly Template[] = [
  {
    id: 'sermon',
    label: 'Sermon notes',
    title: 'Sermon notes',
    body: 'Preacher:\nPassage:\n\nMain point:\n\nKey verses:\n\nHow I will apply it:\n',
  },
  {
    id: 'meeting',
    label: 'Meeting notes',
    title: 'Meeting notes',
    body: 'Date and people:\n\nWhat we discussed:\n\nDecisions:\n\nWhat happens next (who, by when):\n',
  },
  {
    id: 'book',
    label: 'Book notes',
    title: 'Book notes',
    body: "Book and author:\n\nThe big idea:\n\nQuotes worth keeping:\n\nWhat I'll do with it:\n",
  },
];

/** A template is only offered on a blank page, so it can never replace words already written. */
export function canApplyTemplate(title: string, body: string): boolean {
  return title.trim() === '' && body.trim() === '';
}
