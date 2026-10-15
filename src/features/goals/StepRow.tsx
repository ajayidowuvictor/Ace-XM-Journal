import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Button, Text, minTouchTarget, radius, spacing } from '../../ui';
import type { Milestone } from './types';

type Props = {
  step: Milestone;
  onToggle: (done: boolean) => void;
  onRemove: () => void;
};

export function StepRow({ step, onToggle, onRemove }: Props) {
  const { colors } = useTheme();
  const done = step.completedAt !== null;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Mark step "${step.title}" as ${done ? 'not done' : 'done'}`}
        accessibilityState={{ checked: done }}
        onPress={() => onToggle(!done)}
        style={styles.checkArea}
      >
        <View
          style={[
            styles.box,
            { borderColor: colors.primary, backgroundColor: done ? colors.primary : 'transparent' },
          ]}
        >
          {done ? <Text style={{ color: colors.onPrimary }}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.title}>
        <Text muted={done} style={done ? styles.doneTitle : undefined}>
          {step.title}
        </Text>
      </View>
      <Button
        label="Remove"
        variant="ghost"
        accessibilityHint={`Removes the step ${step.title}`}
        onPress={onRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1 },
  doneTitle: { textDecorationLine: 'line-through' },
  checkArea: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
