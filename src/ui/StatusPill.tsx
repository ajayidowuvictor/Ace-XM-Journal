import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/context';
import { Text } from './Text';
import { radius, spacing } from './tokens';

type Props = {
  label: string;
  /** Spoken description, when the label alone is not enough. */
  accessibilityLabel?: string;
};

/** A small rounded label with a green dot, such as "Encrypted". */
export function StatusPill({ label, accessibilityLabel }: Props) {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.pill, { backgroundColor: colors.successTint }]}
    >
      <View style={[styles.dot, { backgroundColor: colors.success }]} />
      <Text variant="caption" tone="success">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
});
