import {
  ActivityIndicator,
  Text as RNText,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { tapLight } from '../lib/haptics';
import { useTheme } from '../theme/context';
import { PressableScale } from './PressableScale';
import { fonts, maxFontScale, minTouchTarget, radius, spacing, typography } from './tokens';

type Props = {
  label: string;
  onPress: () => void;
  /**
   * primary: the main action (filled). secondary: a calm alternative (tinted).
   * ghost: text only. danger: destructive (filled red).
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** compact is for buttons inside rows and sheets. */
  size?: 'regular' | 'compact';
  disabled?: boolean;
  /** Shows a spinner and ignores presses, which prevents duplicate submissions. */
  loading?: boolean;
  accessibilityHint?: string;
  /** Read aloud instead of the visible label, when the label is a short symbol such as "+15 m". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  accessibilityHint,
  accessibilityLabel,
  style,
}: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { background: colors.primary, text: colors.onPrimary },
    secondary: { background: colors.primaryTint, text: colors.primary },
    danger: { background: colors.danger, text: colors.onDanger },
    ghost: { background: 'transparent', text: colors.primary },
  }[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        tapLight();
        onPress();
      }}
      style={[
        styles.base,
        size === 'compact' ? styles.compact : styles.regular,
        { backgroundColor: palette.background, opacity: inactive ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <RNText
          maxFontSizeMultiplier={maxFontScale.normal}
          style={[
            size === 'compact' ? styles.compactText : typography.subheading,
            { color: palette.text },
          ]}
        >
          {label}
        </RNText>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regular: { minHeight: 52, borderRadius: radius.pill },
  compact: {
    minHeight: minTouchTarget,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  compactText: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
});
