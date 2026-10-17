import { StyleSheet, Text as RNText, View } from 'react-native';

import { selectionTick } from '../../lib/haptics';
import { useTheme } from '../../theme/context';
import {
  PressableScale,
  fonts,
  maxFontScale,
  minTouchTarget,
  radius,
  shadows,
  spacing,
} from '../../ui';
import { PIN_LENGTH } from './logic';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

/** The letters printed under each digit on a phone keypad (decoration only). */
const LETTERS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

const KEY_SIZE = 76;

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Called once all six digits are in. */
  onComplete: (pin: string) => void;
  disabled?: boolean;
  /** Optional key in the bottom-left corner, such as a fingerprint button. */
  extraKey?: { label: string; accessibilityLabel: string; onPress: () => void };
};

/** Six dots and a big number pad, used to enter or choose a PIN. */
export function PinPad({ value, onChange, onComplete, disabled = false, extraKey }: Props) {
  const { colors, scheme } = useTheme();
  const shadow = scheme === 'dark' ? { borderWidth: 1, borderColor: colors.border } : shadows.thumb;

  function press(digit: string) {
    if (disabled || value.length >= PIN_LENGTH) return;
    const next = value + digit;
    onChange(next);
    if (next.length === PIN_LENGTH) onComplete(next);
  }

  function erase() {
    if (disabled || value.length === 0) return;
    selectionTick();
    onChange(value.slice(0, -1));
  }

  function renderKey(
    label: string,
    accessibilityLabel: string,
    onPress: () => void,
    letters?: string,
  ) {
    return (
      <PressableScale
        key={accessibilityLabel}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => {
          selectionTick();
          onPress();
        }}
        style={[
          styles.key,
          { backgroundColor: colors.surface, opacity: disabled ? 0.5 : 1 },
          shadow,
        ]}
      >
        <RNText
          maxFontSizeMultiplier={maxFontScale.glyph}
          style={[styles.keyText, { color: colors.text }]}
        >
          {label}
        </RNText>
        {letters ? (
          <RNText
            maxFontSizeMultiplier={maxFontScale.glyph}
            accessible={false}
            importantForAccessibility="no"
            style={[styles.letters, { color: colors.textMuted }]}
          >
            {letters}
          </RNText>
        ) : null}
      </PressableScale>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View
        accessible
        accessibilityLabel={`${value.length} of ${PIN_LENGTH} digits entered`}
        style={styles.dots}
      >
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index < value.length ? colors.primary : 'transparent',
                borderColor: index < value.length ? colors.primary : colors.textMuted,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {ROWS.map((row) => (
          <View key={row.join('')} style={styles.row}>
            {row.map((digit) => renderKey(digit, digit, () => press(digit), LETTERS[digit]))}
          </View>
        ))}
        <View style={styles.row}>
          {extraKey ? (
            renderKey(extraKey.label, extraKey.accessibilityLabel, extraKey.onPress)
          ) : (
            <View style={styles.key} />
          )}
          {renderKey('0', '0', () => press('0'))}
          {renderKey('⌫', 'Delete last digit', erase)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.xl },
  dots: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 16, height: 16, borderRadius: radius.pill, borderWidth: 2 },
  pad: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.lg },
  key: {
    width: Math.max(KEY_SIZE, minTouchTarget),
    height: KEY_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 32 },
  letters: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, letterSpacing: 1.5 },
});
