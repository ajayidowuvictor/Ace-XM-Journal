/** What a note is for. It decides how the editor and the reading view look. */
export type NoteKind = 'note' | 'verse' | 'text';

export type Notebook = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  /** The notebook it lives in, or null when it is not filed in one. */
  notebookId: string | null;
  kind: NoteKind;
  title: string;
  body: string;
  /**
   * For a verse, where it comes from, such as "John 3:16 (KJV)". For a long text, the author or
   * source. Empty for a plain note.
   */
  reference: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteInput = {
  notebookId: string | null;
  kind: NoteKind;
  title: string;
  body: string;
  reference: string;
  pinned: boolean;
};

/** Which notes the list shows. */
export type NotebookFilter =
  { type: 'all' } | { type: 'unfiled' } | { type: 'notebook'; id: string };
