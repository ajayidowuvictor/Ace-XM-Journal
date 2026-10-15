import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  SectionHeader,
  SegmentedControl,
  Text,
  TextField,
  spacing,
  type SegmentOption,
} from '../../ui';
import { filterNotes, noteCountLabel, splitPinned } from './logic';
import { NoteCard } from './NoteCard';
import { NotebookDialog } from './NotebookDialog';
import { useNotes } from './NotesContext';
import type { Note, NoteKind, NotebookFilter } from './types';

type KindChoice = 'all' | NoteKind;

const KIND_OPTIONS: readonly SegmentOption<KindChoice>[] = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'verse', label: 'Verses' },
  { value: 'text', label: 'Texts' },
];

/** The Notes side of the Journal tab: notebooks, search and the list of notes. */
export function NotesView() {
  const router = useRouter();
  const { notes, notebooks, addNotebook, renameNotebook, removeNotebook } = useNotes();

  const [filter, setFilter] = useState<NotebookFilter>({ type: 'all' });
  const [kind, setKind] = useState<KindChoice>('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<'create' | 'rename' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // If the chosen notebook was deleted, go back to showing everything.
  const activeFilter: NotebookFilter =
    filter.type === 'notebook' && !notebooks.some((book) => book.id === filter.id)
      ? { type: 'all' }
      : filter;
  const activeBook =
    activeFilter.type === 'notebook'
      ? (notebooks.find((book) => book.id === activeFilter.id) ?? null)
      : null;

  const visible = filterNotes(notes, {
    filter: activeFilter,
    search,
    kind: kind === 'all' ? null : kind,
  });
  const { pinned, others } = splitPinned(visible);
  const hasUnfiled = notes.some((note) => note.notebookId === null);
  const narrowing = search.trim().length > 0 || kind !== 'all' || activeFilter.type !== 'all';
  const bookName = (note: Note) =>
    activeFilter.type === 'all' && note.notebookId
      ? notebooks.find((book) => book.id === note.notebookId)?.name
      : undefined;

  function start(newKind: NoteKind) {
    router.push({
      pathname: '/note',
      params: {
        kind: newKind,
        ...(activeBook ? { notebook: activeBook.id } : {}),
      },
    });
  }

  function open(note: Note) {
    router.push({ pathname: '/note', params: { id: note.id } });
  }

  function saveNotebook(name: string) {
    const mode = dialog;
    setDialog(null);
    setProblem(null);
    if (mode === 'create') {
      const id = addNotebook(name);
      if (id) setFilter({ type: 'notebook', id });
      else setProblem('The notebook could not be saved. Please try again.');
    } else if (mode === 'rename' && activeBook) {
      if (!renameNotebook(activeBook.id, name)) {
        setProblem('The notebook could not be renamed. Please try again.');
      }
    }
  }

  function deleteNotebook() {
    setConfirmingDelete(false);
    if (activeBook && !removeNotebook(activeBook.id)) {
      setProblem('The notebook could not be deleted. Please try again.');
    }
  }

  function renderNotes(list: Note[]) {
    return list.map((note) => (
      <NoteCard key={note.id} note={note} notebookName={bookName(note)} onOpen={() => open(note)} />
    ));
  }

  return (
    <>
      <View style={styles.row}>
        <Button label="New note" size="compact" onPress={() => start('note')} style={styles.flex} />
        <Button
          label="New verse"
          variant="secondary"
          size="compact"
          onPress={() => start('verse')}
          style={styles.flex}
        />
        <Button
          label="Long text"
          variant="secondary"
          size="compact"
          accessibilityLabel="New long text"
          onPress={() => start('text')}
          style={styles.flex}
        />
      </View>

      <TextField
        label="Search notes"
        value={search}
        onChangeText={setSearch}
        placeholder="Words, titles or references"
        autoCapitalize="none"
        returnKeyType="search"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chips}
        accessibilityLabel="Notebooks"
      >
        <Chip
          label="All notes"
          selected={activeFilter.type === 'all'}
          onPress={() => setFilter({ type: 'all' })}
        />
        {notebooks.map((book) => (
          <Chip
            key={book.id}
            label={book.name}
            selected={activeFilter.type === 'notebook' && activeFilter.id === book.id}
            onPress={() => setFilter({ type: 'notebook', id: book.id })}
          />
        ))}
        {notebooks.length > 0 && hasUnfiled ? (
          <Chip
            label="Not filed"
            selected={activeFilter.type === 'unfiled'}
            onPress={() => setFilter({ type: 'unfiled' })}
          />
        ) : null}
        <Chip label="New notebook" onPress={() => setDialog('create')} />
      </ScrollView>

      <SegmentedControl<KindChoice>
        accessibilityLabel="Kind of note"
        options={KIND_OPTIONS}
        value={kind}
        onChange={setKind}
      />

      {activeBook ? (
        <View style={styles.bookRow}>
          <Text variant="secondary" muted style={styles.flex}>
            {activeBook.name} · {noteCountLabel(visible.length)}
          </Text>
          <Button
            label="Rename"
            variant="ghost"
            size="compact"
            accessibilityLabel={`Rename notebook ${activeBook.name}`}
            onPress={() => setDialog('rename')}
          />
          <Button
            label="Delete"
            variant="ghost"
            size="compact"
            accessibilityLabel={`Delete notebook ${activeBook.name}`}
            onPress={() => setConfirmingDelete(true)}
          />
        </View>
      ) : null}

      {problem ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {problem}
        </Text>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title={narrowing ? 'No matches' : 'No notes yet'}
          message={
            narrowing
              ? 'Try different words, or choose All notes.'
              : 'Keep a verse, a long text or a quick thought. Everything here is encrypted and stays on this device.'
          }
        />
      ) : pinned.length > 0 ? (
        <>
          <SectionHeader title="Pinned" />
          {renderNotes(pinned)}
          {others.length > 0 ? <SectionHeader title="Everything else" /> : null}
          {renderNotes(others)}
        </>
      ) : (
        renderNotes(others)
      )}

      <NotebookDialog
        visible={dialog !== null}
        title={dialog === 'rename' ? 'Rename notebook' : 'New notebook'}
        confirmLabel={dialog === 'rename' ? 'Rename' : 'Create'}
        initialName={dialog === 'rename' ? (activeBook?.name ?? '') : ''}
        onCancel={() => setDialog(null)}
        onSave={saveNotebook}
      />
      <ConfirmDialog
        visible={confirmingDelete}
        title="Delete this notebook?"
        message="Only the notebook is deleted. Its notes stay in your list under All notes."
        confirmLabel="Delete notebook"
        destructive
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={deleteNotebook}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
