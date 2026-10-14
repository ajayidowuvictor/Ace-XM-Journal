import { View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/context';
import { radius, spacing } from './tokens';

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
        },
        style,
      ]}
    />
  );
}
