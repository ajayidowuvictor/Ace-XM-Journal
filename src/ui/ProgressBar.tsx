import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/context';
import { radius } from './tokens';

/** Keeps a progress value between 0 and 1. Invalid numbers count as 0. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

type Props = {
  /** Progress from 0 (nothing) to 1 (complete). */
  value: number;
  accessibilityLabel: string;
};

export function ProgressBar({ value, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const progress = clampProgress(value);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
    >
      <View
        style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.success }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
