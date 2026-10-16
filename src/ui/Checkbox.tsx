import { StyleSheet, View } from 'react-native';

import { success } from '../lib/haptics';
import { useTheme } from '../theme/context';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { maxFontScale, minTouchTarget } from './tokens';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read aloud by screen readers, for example `Mark "Call Ada" as done`. */
  accessibilityLabel: string;
};

const SIZE = 28;

/** A round tick circle with a 44-point touch area. Completing something gives a confirming buzz. */
export function Checkbox({ checked, onChange, accessibilityLabel }: Props) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      scaleTo={0.9}
      onPress={() => {
        if (!checked) success();
        onChange(!checked);
      }}
      style={styles.area}
    >
      <View
        style={[
          styles.circle,
          {
            borderColor: checked ? colors.success : colors.primary,
            backgroundColor: checked ? colors.success : 'transparent',
          },
        ]}
      >
        {checked ? (
          <Text
            variant="subheading"
            maxFontSizeMultiplier={maxFontScale.glyph}
            style={[styles.tick, { color: colors.surface }]}
          >
            ✓
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  area: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 16, lineHeight: 20 },
});
