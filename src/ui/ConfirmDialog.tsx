import { Modal, StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { spacing } from './tokens';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Use for destructive actions such as deleting data. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <Card variant="hero" style={styles.dialog}>
          <Text variant="heading">{title}</Text>
          <Text muted>{message}</Text>
          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              style={styles.flex}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.flex}
            />
          </View>
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
  dialog: { width: '100%', maxWidth: 420, gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
