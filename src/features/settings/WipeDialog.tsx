import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button, Card, Text, TextField, spacing } from '../../ui';

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <Text variant="heading">Erase everything?</Text>
          <Text muted>
            Every task, habit, goal and journal entry will be permanently erased from this phone.
            There is no way to bring them back. Type {WIPE_WORD} to confirm.
          </Text>
          <TextField
            label={`Type ${WIPE_WORD}`}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={close} style={styles.flex} />
            <Button
              label="Erase all"
              variant="danger"
              disabled={!ready}
              onPress={() => {
                setTyped('');
                onConfirm();
              }}
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
