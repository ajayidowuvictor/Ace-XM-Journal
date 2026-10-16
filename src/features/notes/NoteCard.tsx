import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Card, PressableScale, Text, readingFont, spacing } from '../../ui';
import { KIND_LABELS, noteHeadline, notePreview, readingSummary } from './logic';
import type { Note } from './types';

type Props = {
  note: Note;
  /** Name of the notebook it is filed in, shown when the list covers several notebooks. */
  notebookName?: string;
  onOpen: () => void;
};

/** One note in the list. A verse is shown as a quotation, a long text with its reading time. */
export function NoteCard({ note, notebookName, onOpen }: Props) {
  const { colors } = useTheme();
  const headline = noteHeadline(note);
  const isVerse = note.kind === 'verse';

  const meta = [KIND_LABELS[note.kind], notebookName, note.pinned ? 'Pinned' : null]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Open ${KIND_LABELS[note.kind].toLowerCase()}: ${headline}`}
      onPress={onOpen}
    >
      <Card style={isVerse ? [styles.verse, { borderLeftColor: colors.primary }] : undefined}>
        <Text variant="caption" muted>
          {meta}
        </Text>

        {isVerse ? (
          <>
            <Text style={[styles.quote, { fontFamily: readingFont }]} numberOfLines={4}>
              {note.body.trim() || 'No verse text yet'}
            </Text>
            {note.reference.trim() ? (
              <Text variant="secondary" tone="primary" style={styles.reference}>
                {note.reference.trim()}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text variant="heading">{headline}</Text>
            {notePreview(note.body) ? (
              <Text variant="secondary" muted numberOfLines={note.kind === 'text' ? 3 : 2}>
                {notePreview(note.body, 200)}
              </Text>
            ) : null}
            {note.kind === 'text' ? (
              <View>
                <Text variant="caption" muted>
                  {[note.reference.trim(), readingSummary(note.body)].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  verse: { borderLeftWidth: 4 },
  quote: { fontSize: 19, lineHeight: 29, fontStyle: 'italic' },
  reference: { paddingTop: spacing.xs, letterSpacing: 0.3 },
});
