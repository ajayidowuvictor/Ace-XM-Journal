import { Pressable } from 'react-native';

import { formatLongDate } from '../../lib/greeting';
import { parseLocalDate } from '../../lib/dates';
import { Card, Text } from '../../ui';
import { entryHeadline, moodFor } from './logic';
import type { JournalEntry } from './types';

export function EntryCard({ entry, onOpen }: { entry: JournalEntry; onOpen: () => void }) {
  const date = parseLocalDate(entry.entryDate);
  const mood = moodFor(entry.mood);
  const headline = entryHeadline(entry);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open entry: ${headline}`}
      onPress={onOpen}
    >
      <Card>
        <Text variant="caption" muted>
          {date ? formatLongDate(date) : entry.entryDate}
          {mood ? `  ${mood.emoji}` : ''}
        </Text>
        <Text variant="heading">{headline}</Text>
        {entry.tags.length > 0 ? (
          <Text variant="caption" muted>
            {entry.tags.map((tag) => `#${tag}`).join('  ')}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
