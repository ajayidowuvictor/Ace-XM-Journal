import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Text, TextField, spacing } from '../../ui';
import { passwordProblem } from './backupFormat';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Ask for the password twice (when making a new backup). */
  askTwice: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => void;
};

/** A pop-up that asks for the backup password. */
export function PasswordDialog(props: Props) {
  // Mounted only while open, so the boxes are always empty when it appears.
  return props.visible ? <OpenDialog {...props} /> : null;
}

function OpenDialog({ title, message, confirmLabel, askTwice, onCancel, onSubmit }: Props) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [shown, setShown] = useState(false);

  const problem = askTwice ? passwordProblem(password) : null;
  const mismatch = askTwice && again.length > 0 && again !== password;
  const ready = password.length > 0 && (!askTwice || (problem === null && again === password));

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <Card variant="hero" style={styles.dialog}>
          <Text variant="heading">{title}</Text>
          <Text muted>{message}</Text>
          <TextField
            label="Backup password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!shown}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            error={askTwice && password.length > 0 ? (problem ?? undefined) : undefined}
          />
          {askTwice ? (
            <TextField
              label="Type the password again"
              value={again}
              onChangeText={setAgain}
              secureTextEntry={!shown}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              error={mismatch ? 'The two passwords do not match.' : undefined}
            />
          ) : null}
          <View style={styles.row}>
            <Chip
              label={shown ? 'Hide password' : 'Show password'}
              selected={shown}
              onPress={() => setShown(!shown)}
            />
          </View>
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button
              label={confirmLabel}
              disabled={!ready}
              onPress={() => onSubmit(password)}
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
  row: { flexDirection: 'row' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
