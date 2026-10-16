import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatLongDate } from '../../lib/greeting';
import { parseLocalDate, toLocalDateString } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import { Button, ConfirmDialog, Text, TextField, spacing } from '../../ui';
import { createAutosaver, type Autosaver } from './autosave';
import { useJournal } from './JournalContext';
import { isEmptyEntry, parseTags, tagsToText } from './logic';
import { ENTRY_TEMPLATES, canApplyTemplate } from '../templates/logic';
import { TemplatePicker } from '../templates/TemplatePicker';
import { MoodPicker } from './MoodPicker';
import type { EntryInput, JournalEntry, Mood } from './types';

type SaveState = 'idle' | 'saved' | 'error';

const SAVE_TEXT: Record<SaveState, string> = {
  idle: '',
  saved: 'Saved on this device',
  error: 'Not saved. Your changes are still on screen; keep this page open and try again.',
};

/** Edits one entry (or starts a new one) and saves automatically when typing pauses. */
export function EntryEditor({
  entry,
  initialTitle,
  bodyPrompt,
}: {
  entry: JournalEntry | null;
  /** A title to start a new entry with, such as "Reflection: John 3:16". Never used for an existing entry. */
  initialTitle?: string;
  /** A question shown faintly in the empty text box of a new entry. It is not saved. */
  bodyPrompt?: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const { create, save, remove } = useJournal();

  const [title, setTitle] = useState(entry?.title ?? initialTitle ?? '');
  const [body, setBody] = useState(entry?.body ?? '');
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [tagsText, setTagsText] = useState(tagsToText(entry?.tags ?? []));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [createdHere, setCreatedHere] = useState(false);

  const entryId = useRef<string | null>(entry?.id ?? null);
  const draft = useRef<EntryInput & { tagsText: string }>({
    title,
    body,
    mood,
    tags: entry?.tags ?? [],
    tagsText,
  });

  const persist = useCallback(() => {
    const input: EntryInput = {
      title: draft.current.title,
      body: draft.current.body,
      mood: draft.current.mood,
      tags: parseTags(draft.current.tagsText),
    };
    if (entryId.current === null) {
      if (isEmptyEntry(input)) return;
      const id = create(input);
      if (id) {
        entryId.current = id;
        setCreatedHere(true);
      }
      setSaveState(id ? 'saved' : 'error');
    } else {
      setSaveState(save(entryId.current, input) ? 'saved' : 'error');
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

  function edit(changes: Partial<typeof draft.current>) {
    draft.current = { ...draft.current, ...changes };
    setSaveState('idle');
    saver.current?.schedule();
  }

  function close() {
    saver.current?.flush();
    router.back();
  }

  function confirmDelete() {
    setConfirmingDelete(false);
    saver.current?.cancel();
    if (entryId.current !== null && !remove(entryId.current)) {
      setSaveState('error');
      return;
    }
    router.back();
  }

  const date = parseLocalDate(entry?.entryDate ?? toLocalDateString(new Date()));

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button label="Done" variant="ghost" onPress={close} style={styles.done} />
          <Text variant="title">{entry ? 'Journal entry' : 'New entry'}</Text>
          {date ? <Text muted>{formatLongDate(date)}</Text> : null}

          {!entry && !createdHere && canApplyTemplate(title, body) ? (
            <TemplatePicker
              templates={ENTRY_TEMPLATES}
              onPick={(template) => {
                setTitle(template.title);
                setBody(template.body);
                edit({ title: template.title, body: template.body });
              }}
            />
          ) : null}

          <TextField
            label="Title (optional)"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              edit({ title: text });
            }}
            placeholder="Give this day a title"
          />
          <TextField
            label="What's on your mind?"
            value={body}
            onChangeText={(text) => {
              setBody(text);
              edit({ body: text });
            }}
            multiline
            textAlignVertical="top"
            placeholder={bodyPrompt ?? 'Write freely. This stays private on your phone.'}
            autoFocus={!entry}
          />

          <Text variant="caption" muted>
            How are you feeling?
          </Text>
          <MoodPicker
            value={mood}
            onChange={(next) => {
              setMood(next);
              edit({ mood: next });
            }}
          />

          <TextField
            label="Tags (optional)"
            hint="Separate with commas, for example: work, family"
            value={tagsText}
            onChangeText={(text) => {
              setTagsText(text);
              edit({ tagsText: text });
            }}
            autoCapitalize="none"
          />

          <Text
            variant="caption"
            tone={saveState === 'error' ? 'danger' : undefined}
            muted={saveState !== 'error'}
            accessibilityLiveRegion="polite"
          >
            {SAVE_TEXT[saveState]}
          </Text>

          {entry || createdHere ? (
            <Button
              label="Delete entry"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
            />
          ) : null}
        </ScrollView>

        <ConfirmDialog
          visible={confirmingDelete}
          title="Delete this entry?"
          message="The entry will be erased from your journal. This cannot be undone."
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  done: { alignSelf: 'flex-end' },
});
