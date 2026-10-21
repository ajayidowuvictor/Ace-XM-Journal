import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text as RNText, View } from 'react-native';

import { toLocalDateString } from '../../lib/dates';
import { useTheme } from '../../theme/context';
import {
  Button,
  Card,
  Text,
  maxFontScale,
  minTouchTarget,
  radius,
  scrim,
  spacing,
  typography,
} from '../../ui';
import { WEEKDAY_LABELS, monthGrid, monthName, shiftMonth } from './logic';

type Props = {
  /** The date shown as chosen when the sheet opens (`YYYY-MM-DD`), or null for none. */
  value: string | null;
  /** Dates before this one (`YYYY-MM-DD`) cannot be chosen. */
  minDate?: string;
  title?: string;
  onPick: (date: string) => void;
  onClose: () => void;
};

/**
 * A month calendar for choosing any date. Show it only while it is needed (render it when the
 * person asks for it) so it opens on the right month each time.
 */
export function DatePickerSheet({ value, minDate, title = 'Choose a date', onPick, onClose }: Props) {
  const { colors } = useTheme();
  const today = toLocalDateString(new Date());
  const start = value ?? today;
  const [view, setView] = useState(() => ({
    year: Number(start.slice(0, 4)),
    monthIndex: Number(start.slice(5, 7)) - 1,
  }));

  const weeks = monthGrid(view.year, view.monthIndex);
  const move = (months: number) => setView((v) => shiftMonth(v.year, v.monthIndex, months));

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.overlay}>
        <Card variant="hero" style={styles.sheet}>
          <Text variant="heading">{title}</Text>

          <View style={styles.nav}>
            <Button
              label="−1 y"
              accessibilityLabel="One year earlier"
              variant="ghost"
              size="compact"
              onPress={() => move(-12)}
            />
            <Button
              label="‹"
              accessibilityLabel="Previous month"
              variant="secondary"
              size="compact"
              onPress={() => move(-1)}
            />
            <Text variant="subheading" accessibilityLiveRegion="polite" style={styles.month}>
              {monthName(view.monthIndex)} {view.year}
            </Text>
            <Button
              label="›"
              accessibilityLabel="Next month"
              variant="secondary"
              size="compact"
              onPress={() => move(1)}
            />
            <Button
              label="+1 y"
              accessibilityLabel="One year later"
              variant="ghost"
              size="compact"
              onPress={() => move(12)}
            />
          </View>

          <View style={styles.week}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} variant="caption" muted style={styles.weekday}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week, row) => (
            <View key={row} style={styles.week}>
              {week.map((date, column) => {
                if (!date) return <View key={column} style={styles.cell} />;
                const disabled = minDate !== undefined && date < minDate;
                const selected = date === value;
                return (
                  <Pressable
                    key={column}
                    accessibilityRole="button"
                    accessibilityLabel={new Date(
                      Number(date.slice(0, 4)),
                      Number(date.slice(5, 7)) - 1,
                      Number(date.slice(8, 10)),
                    ).toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    accessibilityState={{ disabled, selected }}
                    disabled={disabled}
                    onPress={() => onPick(date)}
                    style={[
                      styles.cell,
                      styles.day,
                      selected && { backgroundColor: colors.primary },
                      !selected && date === today && { backgroundColor: colors.primaryTint },
                    ]}
                  >
                    <RNText
                      maxFontSizeMultiplier={maxFontScale.glyph}
                      style={[
                        typography.secondary,
                        {
                          color: selected
                            ? colors.onPrimary
                            : disabled
                              ? colors.textMuted
                              : colors.text,
                          opacity: disabled ? 0.45 : 1,
                        },
                      ]}
                    >
                      {Number(date.slice(8, 10))}
                    </RNText>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  sheet: { width: '100%', maxWidth: 420, gap: spacing.sm },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  cell: { flex: 1, height: minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: radius.pill },
});
