import { Pressable, Text as RNText, StyleSheet, View } from 'react-native';

import { selectionTick } from '../lib/haptics';
import { useTheme } from '../theme/context';
import { maxFontScale, minTouchTarget, radius, shadows, spacing, typography } from './tokens';

export type SegmentOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const { colors, scheme } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { backgroundColor: colors.surfaceMuted }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, selected }}
            onPress={() => {
              if (!selected) selectionTick();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.thumb },
              selected && scheme !== 'dark' ? shadows.thumb : null,
            ]}
          >
            <RNText
              maxFontSizeMultiplier={maxFontScale.normal}
              style={[
                selected ? typography.subheading : typography.secondary,
                { color: selected ? colors.text : colors.textMuted },
              ]}
            >
              {option.label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: minTouchTarget - spacing.xs,
    borderRadius: radius.md - 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
