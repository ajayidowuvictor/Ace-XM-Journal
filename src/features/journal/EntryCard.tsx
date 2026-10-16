import { Pressable, StyleSheet, View } from 'react-native';

import { formatLongDate } from '../../lib/greeting';
import { parseLocalDate, toLocalDateString } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import { Card, Text, radius, spacing } from '../../ui';
import { readingMinutes } from '../notes/logic';
import { entryHeadline, moodFor, relativeDayLabel } from './logic';
import type { JournalEntry } from './types';

/** A short preview under the headline: the text itself, or what follows the first line when that line is the headline. */
function previewOf(entry: JournalEntry): string {
  const body = entry.body.trim();
  const text = entry.title.trim() ? body : body.split('\n').slice(1).join(' ');
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 160 ? `${flat.slice(0, 157).trimEnd()}...` : flat;
}

export function EntryCard({ entry, onOpen }: { entry: JournalEntry; onOpen: () => void }) {
  const { colors } = useTheme();
  const date = parseLocalDate(entry.entryDate);
  const mood = moodFor(entry.mood);
  const headline = entryHeadline(entry);
  const preview = previewOf(entry);
  const day = relativeDayLabel(entry.entryDate, toLocalDateString(new Date()));
  const time = new Date(entry.createdAt);
  const timeText = Number.isNaN(time.getTime())
    ? null
    : time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const meta = [
    day ?? (date ? formatLongDate(date) : entry.entryDate),
    timeText,
    entry.body.trim() ? `${readingMinutes(entry.body)} min read` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open entry: ${headline}`}
      onPress={onOpen}
    >
      <Card>
        <Text variant="caption" muted>
          {mood ? `${mood.emoji}  ${meta}` : meta}
        </Text>
        <Text variant="heading">{headline}</Text>
        {preview ? (
          <Text variant="secondary" muted numberOfLines={3}>
            {preview}
          </Text>
        ) : null}
        {entry.tags.length > 0 ? (
          <View style={styles.tags}>
            {entry.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceMuted }]}>
                <Text variant="caption" muted>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  tag: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
