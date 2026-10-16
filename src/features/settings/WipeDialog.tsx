import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Button, Card, Text, TextField, radius, spacing } from '../../ui';

export const WIPE_WORD = 'DELETE';

/** True when the typed text confirms the erase (ignores case and surrounding spaces). */
export function isWipeConfirmed(typed: string): boolean {
  return typed.trim().toUpperCase() === WIPE_WORD;
}

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Second, typed confirmation before everything is erased. */
export function WipeDialog({ visible, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState('');
  const ready = isWipeConfirmed(typed);

  function close() {
    setTyped('');
    onCancel();
  }

  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Card variant="hero" style={styles.dialog}>
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.icon, { backgroundColor: colors.dangerTint }]}
          >
            <Text variant="heading" tone="danger">
              !
            </Text>
          </View>
          <Text variant="title" style={styles.centered}>
            Erase everything?
          </Text>
          <Text muted style={styles.centered}>
            Every task, habit, goal, journal entry and note will be permanently erased from this
            phone. There is no way to bring them back.
          </Text>
          <Card variant="inset" style={styles.tip}>
            <Text variant="secondary">
              Want to keep a copy first? Cancel, then use Create encrypted backup in Settings. It
              saves a .acexmbackup file you can restore later.
            </Text>
          </Card>
          <TextField
            label={`Type ${WIPE_WORD}`}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Button
            label="Erase all"
            variant="danger"
            disabled={!ready}
            onPress={() => {
              setTyped('');
              onConfirm();
            }}
          />
          <Button label="Cancel" variant="ghost" onPress={close} />
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
  centered: { textAlign: 'center' },
  icon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: { padding: spacing.md },
});
