import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme/context';
import { Text } from './Text';
import { radius, spacing, typography } from './tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  hint?: string;
  error?: string;
  /** Makes a multi-line field taller than usual, such as the page of a note. */
  minInputHeight?: number;
};

export function TextField({
  label,
  hint,
  error,
  minInputHeight,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : 'transparent';

  return (
    <View style={styles.wrapper}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        {...rest}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          typography.body,
          { color: colors.text, backgroundColor: colors.surfaceMuted, borderColor },
          minInputHeight ? { minHeight: minInputHeight } : null,
        ]}
      />
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
