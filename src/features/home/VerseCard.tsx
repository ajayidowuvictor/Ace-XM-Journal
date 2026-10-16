import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Button, Card, Text, readingFont, radius, spacing } from '../../ui';
import type { Note } from '../notes/types';

type Props = {
  /** Today's verse from the owner's saved verses, or null when none is saved. */
  verse: Note | null;
  onOpen: (verse: Note) => void;
  onReflect: (verse: Note) => void;
  onAdd: () => void;
};

/** "Verse of the Day": one of the owner's own saved verses, or an invitation to save one. */
export function VerseCard({ verse, onOpen, onReflect, onAdd }: Props) {
  const { colors } = useTheme();
  const reference = verse?.reference.trim() ?? '';

  return (
    <Card style={[styles.card, { borderLeftColor: colors.primary }]}>
      <View style={[styles.pill, { backgroundColor: colors.primaryTint }]}>
        <Text variant="caption" tone="primary">
          Verse of the Day
        </Text>
      </View>

      {verse ? (
        <>
          <Text
            accessibilityRole="button"
            accessibilityLabel={`Open verse${reference ? ` ${reference}` : ''}`}
            onPress={() => onOpen(verse)}
            numberOfLines={5}
            style={[styles.quote, { fontFamily: readingFont }]}
          >
            {verse.body.trim()}
          </Text>
          {reference ? (
            <Text variant="secondary" muted>
              {`— ${reference}`}
            </Text>
          ) : null}
          <Button
            label="Reflect in your journal"
            variant="ghost"
            size="compact"
            onPress={() => onReflect(verse)}
            style={styles.reflect}
          />
        </>
      ) : (
        <>
          <Text muted>
            Save the verses you love in Notes, and one of them will be shown here each day.
          </Text>
          <Button label="Add a verse" variant="secondary" size="compact" onPress={onAdd} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  quote: { fontSize: 20, lineHeight: 30, fontStyle: 'italic' },
  reflect: { alignSelf: 'flex-start' },
});
