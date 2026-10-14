import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Text, minTouchTarget, radius, spacing } from '../../ui';
import { MOODS } from './logic';
import type { Mood } from './types';

type Props = {
  value: Mood | null;
  /** Called with the new mood, or null when the chosen mood is tapped again to clear it. */
  onChange: (mood: Mood | null) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Mood" style={styles.row}>
      {MOODS.map((mood) => {
        const selected = mood.value === value;
        return (
          <Pressable
            key={mood.value}
            accessibilityRole="radio"
            accessibilityLabel={`Mood: ${mood.label}`}
            accessibilityHint={selected ? 'Tap again to clear' : undefined}
            accessibilityState={{ checked: selected, selected }}
            onPress={() => onChange(selected ? null : mood.value)}
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.surface : 'transparent',
              },
            ]}
          >
            <Text variant="heading">{mood.emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: minTouchTarget,
    borderWidth: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
