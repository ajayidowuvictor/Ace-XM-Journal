import { StyleSheet, Text as RNText } from 'react-native';

import { selectionTick } from '../lib/haptics';
import { useTheme } from '../theme/context';
import { PressableScale } from './PressableScale';
import { minTouchTarget, radius, spacing, typography } from './tokens';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** A small rounded choice, such as a length of time. Selected chips are filled with the brand colour. */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: Props) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      scaleTo={0.95}
      onPress={() => {
        if (!selected) selectionTick();
        onPress();
      }}
      style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceMuted }]}
    >
      <RNText
        style={[typography.secondary, { color: selected ? colors.onPrimary : colors.text }]}
      >
        {label}
      </RNText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
