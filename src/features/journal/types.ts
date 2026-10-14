export type Mood = 1 | 2 | 3 | 4 | 5;

export type JournalEntry = {
  id: string;
  /** Local calendar date `YYYY-MM-DD` the entry belongs to. */
  entryDate: string;
  title: string;
  body: string;
  mood: Mood | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type EntryInput = {
  title: string;
  body: string;
  mood: Mood | null;
  tags: string[];
};
