import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { PressableScale, Text, spacing } from '../../ui';
import { formatDuration, formatTime, timeRange, type TimelineEntry } from './logic';
import type { PlanBlock } from './types';

type Props = {
  entries: readonly TimelineEntry[];
  /** Ids of tasks that are already done, so their blocks can be shown as finished. */
  completedTaskIds: ReadonlySet<string>;
  onOpenBlock: (block: PlanBlock) => void;
};

const TIME_WIDTH = 48;
const RAIL_WIDTH = 24;

/** The blocks of a day on a vertical time rail, with a "now" marker and free-time gaps. */
export function TimelineView({ entries, completedTaskIds, onOpenBlock }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      {entries.map((entry, index) => {
        const key = entry.kind === 'block' ? entry.block.id : `${entry.kind}-${index}`;

        const rail = (
          <View style={styles.rail}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            {entry.kind === 'block' ? (
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: entry.state === 'current' ? colors.primary : colors.surface,
                    borderColor: entry.state === 'past' ? colors.border : colors.primary,
                  },
                ]}
              />
            ) : entry.kind === 'now' ? (
              <View style={[styles.nowDot, { backgroundColor: colors.success }]} />
            ) : null}
          </View>
        );

        if (entry.kind === 'now') {
          return (
            <View key={key} style={styles.row} accessibilityLabel={`Now, ${formatTime(entry.minutes)}`}>
              <View style={styles.time}>
                <Text variant="caption" tone="success">
                  Now
                </Text>
              </View>
              {rail}
              <View style={[styles.content, styles.nowContent]}>
                <View style={[styles.nowLine, { backgroundColor: colors.success }]} />
                <Text variant="caption" tone="success">
                  {formatTime(entry.minutes)}
                </Text>
              </View>
            </View>
          );
        }

        if (entry.kind === 'gap') {
          return (
            <View key={key} style={styles.row}>
              <View style={styles.time} />
              {rail}
              <View style={[styles.content, styles.gapContent]}>
                <Text variant="caption" muted>
                  {formatDuration(entry.minutes)} free
                </Text>
              </View>
            </View>
          );
        }

        const { block, state } = entry;
        const taskDone = block.taskId !== null && completedTaskIds.has(block.taskId);
        const finished = taskDone || state === 'past';

        return (
          <View key={key} style={styles.row}>
            <View style={styles.time}>
              <Text variant="secondary" muted={state !== 'current'} tone={state === 'current' ? 'primary' : undefined}>
                {formatTime(block.startMinutes)}
              </Text>
            </View>
            {rail}
            <View style={styles.content}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`${block.title}, ${timeRange(block)}${taskDone ? ', done' : ''}${state === 'current' ? ', happening now' : ''}`}
                accessibilityHint="Opens the block so you can change it"
                scaleTo={0.98}
                onPress={() => onOpenBlock(block)}
                style={[
                  styles.block,
                  {
                    backgroundColor: state === 'current' ? colors.primaryTint : colors.surfaceMuted,
                    opacity: finished ? 0.65 : 1,
                  },
                ]}
              >
                <Text variant="subheading" style={taskDone ? styles.done : undefined}>
                  {taskDone ? '✓ ' : ''}
                  {block.title}
                </Text>
                <Text variant="caption" muted>
                  {formatDuration(block.durationMinutes)}  ·  until {formatTime(block.startMinutes + block.durationMinutes)}
                </Text>
              </PressableScale>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  time: { width: TIME_WIDTH, paddingTop: spacing.md, alignItems: 'flex-end' },
  rail: { width: RAIL_WIDTH, alignItems: 'center' },
  line: { position: 'absolute', top: 0, bottom: 0, width: 2 },
  dot: {
    marginTop: spacing.md + 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  nowDot: { marginTop: spacing.sm + 2, width: 12, height: 12, borderRadius: 6 },
  content: { flex: 1, paddingVertical: spacing.xs },
  block: { borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: 2 },
  done: { textDecorationLine: 'line-through' },
  nowContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  nowLine: { flex: 1, height: 2, borderRadius: 1, opacity: 0.5 },
  gapContent: { paddingVertical: spacing.sm, justifyContent: 'center' },
});
