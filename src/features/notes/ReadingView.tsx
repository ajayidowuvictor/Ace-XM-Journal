import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatLongDate } from '../../lib/greeting';
import { PREF_KEYS, readPreference, writePreference } from '../../lib/preferences';
import { useTheme } from '../../theme/context';
import { Button, Text, layout, radius, readingFont, spacing } from '../../ui';
import {
  READER_SIZES,
  parseReaderIndex,
  readingSummary,
  shareText,
  splitParagraphs,
  stepReaderSize,
} from './logic';
import type { Note } from './types';

type Props = {
  note: Note;
  /** True when the reader was opened from the editor, so "Edit" goes back instead of opening it again. */
  fromEditor: boolean;
};

/** A calm full-screen view for reading a verse or a long text, with a text size the reader picks. */
export function ReadingView({ note, fromEditor }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const [sizeIndex, setSizeIndex] = useState(() =>
    parseReaderIndex(readPreference(PREF_KEYS.readerSize)),
  );
  const [shareProblem, setShareProblem] = useState(false);

  const size = READER_SIZES[sizeIndex];
  const lineHeight = Math.round(size * 1.65);
  const isVerse = note.kind === 'verse';
  const title = note.title.trim();
  const reference = note.reference.trim();
  const paragraphs = splitParagraphs(note.body);

  function resize(direction: -1 | 1) {
    const next = stepReaderSize(sizeIndex, direction);
    if (next === sizeIndex) return;
    setSizeIndex(next);
    writePreference(PREF_KEYS.readerSize, String(next));
  }

  async function share() {
    setShareProblem(false);
    try {
      await Share.share({ message: shareText(note) });
    } catch {
      setShareProblem(true);
    }
  }

  function edit() {
    if (fromEditor) router.back();
    else router.push({ pathname: '/note', params: { id: note.id } });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.bar}>
        <Button label="Done" variant="ghost" size="compact" onPress={() => router.back()} />
        <View style={styles.sizes}>
          <Button
            label={'A−'}
            accessibilityLabel="Smaller text"
            variant="secondary"
            size="compact"
            disabled={sizeIndex === 0}
            onPress={() => resize(-1)}
          />
          <Button
            label="A+"
            accessibilityLabel="Larger text"
            variant="secondary"
            size="compact"
            disabled={sizeIndex === READER_SIZES.length - 1}
            onPress={() => resize(1)}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.page}>
          {isVerse ? (
            <View style={styles.verse}>
              <RNText
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.mark, { color: colors.primary, fontFamily: readingFont }]}
              >
                {'“'}
              </RNText>
              {title ? (
                <Text variant="caption" muted style={styles.centered}>
                  {title}
                </Text>
              ) : null}
              <RNText
                style={[
                  styles.centered,
                  {
                    color: colors.text,
                    fontFamily: readingFont,
                    fontSize: size + 3,
                    lineHeight: Math.round((size + 3) * 1.6),
                  },
                ]}
              >
                {note.body.trim()}
              </RNText>
              <View style={[styles.rule, { backgroundColor: colors.primary }]} />
              {reference ? (
                <RNText
                  style={[
                    styles.centered,
                    styles.reference,
                    { color: colors.primary, fontFamily: readingFont },
                  ]}
                >
                  {reference.toUpperCase()}
                </RNText>
              ) : null}
            </View>
          ) : (
            <View>
              {title ? (
                <RNText
                  accessibilityRole="header"
                  style={[
                    styles.title,
                    {
                      color: colors.text,
                      fontFamily: readingFont,
                      fontSize: size + 9,
                      lineHeight: Math.round((size + 9) * 1.25),
                    },
                  ]}
                >
                  {title}
                </RNText>
              ) : null}
              {reference ? (
                <Text variant="secondary" tone="primary" style={styles.source}>
                  {reference}
                </Text>
              ) : null}
              <Text variant="caption" muted style={styles.source}>
                {[readingSummary(note.body), formatLongDate(new Date(note.updatedAt))]
                  .filter(Boolean)
                  .join('  ·  ')}
              </Text>
              <View style={[styles.rule, styles.ruleLeft, { backgroundColor: colors.primary }]} />
              {paragraphs.map((paragraph, index) => (
                <RNText
                  key={index}
                  style={{
                    color: colors.text,
                    fontFamily: readingFont,
                    fontSize: size,
                    lineHeight,
                    marginBottom: Math.round(size * 0.9),
                  }}
                >
                  {paragraph}
                </RNText>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        {shareProblem ? (
          <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
            Sharing is not available right now.
          </Text>
        ) : null}
        <View style={styles.actionRow}>
          <Button label="Share" variant="secondary" onPress={() => void share()} style={styles.flex} />
          <Button label="Edit" onPress={edit} style={styles.flex} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.sm,
  },
  sizes: { flexDirection: 'row', gap: spacing.sm },
  content: { paddingHorizontal: layout.gutter + spacing.sm, paddingVertical: spacing.xl },
  page: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  verse: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  mark: { fontSize: 88, lineHeight: 72, height: 56 },
  centered: { textAlign: 'center' },
  reference: { fontSize: 14, letterSpacing: 2, fontWeight: '600' },
  rule: { width: 44, height: 3, borderRadius: radius.pill, marginVertical: spacing.sm },
  ruleLeft: { marginTop: spacing.md, marginBottom: spacing.lg },
  title: { fontWeight: '700', letterSpacing: -0.3 },
  source: { marginTop: spacing.sm },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
});
