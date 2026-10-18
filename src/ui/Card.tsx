import { View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/context';
import { layout, radius, spacing } from './tokens';

type Props = ViewProps & {
  /**
   * raised: the normal flat tile. inset: a quiet tinted panel.
   * hero: a larger tile with more room, for the main block.
   */
  variant?: 'raised' | 'inset' | 'hero';
};

export function Card({ variant = 'raised', style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: variant === 'inset' ? colors.surfaceMuted : colors.surface,
          borderRadius: variant === 'hero' ? radius.xl : radius.lg,
          padding: variant === 'hero' ? layout.cardPadding + spacing.sm : layout.cardPadding,
          gap: spacing.sm + 4,
        },
        style,
      ]}
    />
  );
}
