import { View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/context';
import { layout, radius, shadows, spacing } from './tokens';

type Props = ViewProps & {
  /**
   * raised: the normal card (soft shadow, or a hairline in dark mode).
   * inset: a quiet tinted panel with no shadow. hero: a larger raised card for the main block.
   */
  variant?: 'raised' | 'inset' | 'hero';
};

export function Card({ variant = 'raised', style, ...rest }: Props) {
  const { colors, scheme } = useTheme();
  const raised = variant !== 'inset';

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: variant === 'inset' ? colors.surfaceMuted : colors.surface,
          borderRadius: variant === 'hero' ? radius.xl : radius.lg,
          padding: variant === 'hero' ? layout.cardPadding + spacing.xs : layout.cardPadding,
          gap: spacing.sm,
        },
        raised && scheme === 'dark' ? { borderWidth: 1, borderColor: colors.border } : null,
        raised && scheme !== 'dark' ? shadows.card : null,
        style,
      ]}
    />
  );
}
