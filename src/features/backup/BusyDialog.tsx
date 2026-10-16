import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Card, Text, spacing } from '../../ui';

type Props = { visible: boolean; title: string; message: string };

/** A pop-up with a spinner, shown while the phone works on something slow. It cannot be dismissed. */
export function BusyDialog({ visible, title, message }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <Card variant="hero" style={styles.dialog}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="heading" style={styles.centered}>
            {title}
          </Text>
          <Text muted style={styles.centered}>
            {message}
          </Text>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: { width: '100%', maxWidth: 420, gap: spacing.md, alignItems: 'center' },
  centered: { textAlign: 'center' },
});
