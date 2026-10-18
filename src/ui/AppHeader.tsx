import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/context';
import { Text } from './Text';
import { layout, radius, spacing } from './tokens';

const LOGO = require('../../assets/images/icon.png');
const LOGO_SIZE = 40;

type Props = {
  /** The name of the screen, shown under the app name. */
  section: string;
  /** Something small on the right, such as a status pill or a button. */
  right?: ReactNode;
};

/** The bar at the top of each main screen: the logo, the app name, the screen and an optional extra. */
export function AppHeader({ section, right }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.background }]}>
      <View style={styles.brand}>
        <Image source={LOGO} accessibilityLabel="Ace Notes logo" style={styles.logo} />
        <View>
          <Text variant="caption" muted style={styles.name}>
            Ace Notes
          </Text>
          <Text variant="subheading" accessibilityRole="header">
            {section}
          </Text>
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter,
    paddingVertical: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: radius.sm + 2 },
  name: { letterSpacing: 0 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
