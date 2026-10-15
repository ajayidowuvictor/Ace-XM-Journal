import { useState } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { motion } from './tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** How far the element squeezes while pressed (1 = not at all). */
  scaleTo?: number;
};

/** A pressable that squeezes slightly under the finger, like a physical button. */
export function PressableScale({
  style,
  scaleTo = motion.pressScale,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  const animateTo = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, ...motion.spring }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        animateTo(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    />
  );
}
