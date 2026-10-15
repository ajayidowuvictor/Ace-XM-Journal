import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '../theme/context';
import { typography } from './tokens';

type Props = TextProps & {
  variant?: keyof typeof typography;
  muted?: boolean;
  tone?: 'default' | 'primary' | 'success' | 'danger';
};

const HEADER_VARIANTS = new Set(['largeTitle', 'title', 'heading']);

export function Text({ variant = 'body', muted = false, tone = 'default', style, ...rest }: Props) {
  const { colors } = useTheme();
  const color =
    tone === 'primary'
      ? colors.primary
      : tone === 'success'
        ? colors.success
        : tone === 'danger'
          ? colors.danger
          : muted
            ? colors.textMuted
            : colors.text;
  const role = HEADER_VARIANTS.has(variant) ? 'header' : undefined;

  return (
    <RNText accessibilityRole={role} {...rest} style={[typography[variant], { color }, style]} />
  );
}
