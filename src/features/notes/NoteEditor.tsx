import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/context';
import {
  Button,
  Chip,
  ConfirmDialog,
  SegmentedControl,
  Text,
  TextField,
  layout,
  spacing,
  type SegmentOption,
} from '../../ui';
import { createAutosaver, type Autosaver } from '../journal/autosave';
import { KIND_LABELS, isEmptyNote, readingSummary } from './logic';
import { useNotes } from './NotesContext';
import type { Note, NoteInput, NoteKind } from './types';

type SaveState = 'idle' | 'saved' | 'error';

const SAVE_TEXT: Record<SaveState, string> = {
  idle: '',
  saved: 'Saved on this device',
  error: 'Not saved. Your changes are still on screen; keep this page open and try again.',
};

const KIND_OPTIONS: readonly SegmentOption<NoteKind>[] = [
  { value: 'note', label: KIND_LABELS.note },
  { value: 'verse', label: KIND_LABELS.verse },
  { value: 'text', label: KIND_LABELS.text },
];

const BODY_LABEL: Record<NoteKind, string> = {
  note: 'Note',
  verse: 'Verse',
  text: 'Text',
};

const BODY_PLACEHOLDER: Record<NoteKind, string> = {
  note: 'Start writing...',
  verse: 'Type or paste the verse here',
  text: 'Paste or write the full text here',
};

type Props = {
  note: Note | null;
  initialKind: NoteKind;
  initialNotebookId: string | null;
};

/** Writes one note, verse or long text (or starts a new one) and saves when typing pauses. */
export function NoteEditor({ note, initialKind, initialNotebookId }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { create, save, remove, notebooks } = useNotes();

  const [kind, setKind] = useState<NoteKind>(note?.kind ?? initialKind);
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [reference, setReference] = useState(note?.reference ?? '');
  const [notebookId, setNotebookId] = useState<string | null>(
    note ? note.notebookId : initialNotebookId,
  );
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [createdHere, setCreatedHere] = useState(false);

  const noteId = useRef<string | null>(note?.id ?? null);
  const draft = useRef<NoteInput>({
    notebookId,
    kind,
    title,
    body,
    reference,
    pinned,
  });

  const persist = useCallback(() => {
    const input = draft.current;
    if (noteId.current === null) {
      if (isEmptyNote(input)) return;
      const id = create(input);
      if (id) {
        noteId.current = id;
        setCreatedHere(true);
      }
      setSaveState(id ? 'saved' : 'error');
    } else {
      setSaveState(save(noteId.current, input) ? 'saved' : 'error');
    }
  }, [create, save]);

  const saver = useRef<Autosaver | null>(null);

  useEffect(() => {
    const autosaver = createAutosaver(persist);
    saver.current = autosaver;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') autosaver.flush();
    });
    return () => {
      subscription.remove();
      autosaver.flush();
      saver.current = null;
    };
  }, [persist]);

  function edit(changes: Partial<NoteInput>) {
    draft.current = { ...draft.current, ...changes };
    setSaveState('idle');
    saver.current?.schedule();
  }

  function close() {
    saver.current?.flush();
    router.back();
  }

  function openReader() {
    saver.current?.flush();
    if (noteId.current === null) {
      setSaveState('error');
      return;
    }
    router.push({ pathname: '/read', params: { id: noteId.current, from: 'editor' } });
  }

  function confirmDelete() {
    setConfirmingDelete(false);
    saver.current?.cancel();
    if (noteId.current !== null && !remove(noteId.current)) {
      setSaveState('error');
      return;
    }
    router.back();
  }

  const exists = note !== null || createdHere;
  const summary = kind === 'verse' ? '' : readingSummary(body);

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>
            <Button label="Done" variant="ghost" onPress={close} style={styles.done} />
            <Text variant="title">
              {note ? KIND_LABELS[kind] : `New ${KIND_LABELS[kind].toLowerCase()}`}
            </Text>

            <SegmentedControl<NoteKind>
              accessibilityLabel="Kind of note"
              options={KIND_OPTIONS}
              value={kind}
              onChange={(next) => {
                setKind(next);
                edit({ kind: next });
              }}
            />

            <TextField
              label="Title (optional)"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                edit({ title: text });
              }}
              placeholder={
                kind === 'verse' ? 'For example: A verse for courage' : 'Give it a title'
              }
            />

            {kind !== 'note' ? (
              <TextField
                label={kind === 'verse' ? 'Reference' : 'Source or author (optional)'}
                value={reference}
                onChangeText={(text) => {
                  setReference(text);
                  edit({ reference: text });
                }}
                placeholder={
                  kind === 'verse' ? 'For example: John 3:16 (KJV)' : 'Where is it from?'
                }
              />
            ) : null}

            <TextField
              label={BODY_LABEL[kind]}
              value={body}
              onChangeText={(text) => {
                setBody(text);
                edit({ body: text });
              }}
              multiline
              textAlignVertical="top"
              minInputHeight={kind === 'verse' ? 180 : 320}
              placeholder={BODY_PLACEHOLDER[kind]}
              autoFocus={!note}
              hint={
                kind === 'text'
                  ? 'Leave a blank line between paragraphs. They show as separate paragraphs when you read it.'
                  : undefined
              }
            />
            {summary ? (
              <Text variant="caption" muted>
                {summary}
              </Text>
            ) : null}

            <Text variant="caption" muted>
              Notebook
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chips}
              accessibilityLabel="Choose a notebook"
            >
              <Chip
                label="None"
                selected={notebookId === null}
                onPress={() => {
                  setNotebookId(null);
                  edit({ notebookId: null });
                }}
              />
              {notebooks.map((book) => (
                <Chip
                  key={book.id}
                  label={book.name}
                  selected={notebookId === book.id}
                  onPress={() => {
                    setNotebookId(book.id);
                    edit({ notebookId: book.id });
                  }}
                />
              ))}
            </ScrollView>

            <View style={styles.pinRow}>
              <Chip
                label={pinned ? 'Pinned to top' : 'Pin to top'}
                selected={pinned}
                onPress={() => {
                  setPinned(!pinned);
                  edit({ pinned: !pinned });
                }}
              />
            </View>

            <Text
              variant="caption"
              tone={saveState === 'error' ? 'danger' : undefined}
              muted={saveState !== 'error'}
              accessibilityLiveRegion="polite"
            >
              {SAVE_TEXT[saveState]}
            </Text>

            {body.trim() ? <Button label="Read" variant="secondary" onPress={openReader} /> : null}
            {exists ? (
              <Button
                label={`Delete ${KIND_LABELS[kind].toLowerCase()}`}
                variant="danger"
                onPress={() => setConfirmingDelete(true)}
              />
            ) : null}
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={confirmingDelete}
          title={`Delete this ${KIND_LABELS[kind].toLowerCase()}?`}
          message="It will be erased from your notes. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: layout.gutter, paddingBottom: spacing.xxl + spacing.lg },
  inner: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', gap: spacing.md },
  done: { alignSelf: 'flex-end' },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  pinRow: { flexDirection: 'row' },
});
