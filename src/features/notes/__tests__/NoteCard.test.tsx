import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { NoteCard } from '../NoteCard';
import type { Note } from '../types';

function make(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
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

describe('NoteCard', () => {
  it('shows a verse as a quotation with its reference', async () => {
    await render(
      <NoteCard
        note={make({
          kind: 'verse',
          body: 'The Lord is my shepherd.',
          reference: 'Psalm 23:1 (KJV)',
        })}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('The Lord is my shepherd.')).toBeTruthy();
    expect(screen.getByText('Psalm 23:1 (KJV)')).toBeTruthy();
    expect(screen.getByText('Verse')).toBeTruthy();
  });

  it('shows a long text with its title and reading time', async () => {
    await render(
      <NoteCard
        note={make({
          kind: 'text',
          title: 'On rest',
          body: 'word '.repeat(450),
          reference: 'A. Writer',
        })}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('On rest')).toBeTruthy();
    expect(screen.getByText('A. Writer  ·  450 words · 2 min read')).toBeTruthy();
  });

  it('shows the notebook name and the pinned mark', async () => {
    await render(
      <NoteCard
        note={make({ title: 'Plans', body: 'Buy bread', pinned: true })}
        notebookName="Ideas"
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('Note  ·  Ideas  ·  Pinned')).toBeTruthy();
    expect(screen.getByText('Plans')).toBeTruthy();
  });

  it('opens when pressed and can be found by its label', async () => {
    const onOpen = jest.fn();
    await render(<NoteCard note={make({ title: 'Plans' })} onOpen={onOpen} />);
    await fireEvent.press(screen.getByLabelText('Open note: Plans'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
