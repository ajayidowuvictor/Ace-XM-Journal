import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button, Card, Text, TextField, spacing, scrim } from '../../ui';
import { MAX_NOTEBOOK_NAME, cleanNotebookName } from './logic';

type Props = {
  visible: boolean;
  title: string;
  confirmLabel: string;
  /** The name already in the box, when renaming. */
  initialName?: string;
  onCancel: () => void;
  /** Called with the cleaned name, which is never empty. */
  onSave: (name: string) => void;
};

/** A small pop-up asking for a notebook name, used to make a notebook or rename one. */
export function NotebookDialog(props: Props) {
  // Mounted only while open, so the box always starts with the right name.
  return props.visible ? <OpenDialog {...props} /> : null;
}

function OpenDialog({ title, confirmLabel, initialName = '', onCancel, onSave }: Props) {
  const [name, setName] = useState(initialName);
  const clean = cleanNotebookName(name);

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
          <TextField
            label="Notebook name"
            value={name}
            onChangeText={setName}
            placeholder="For example: Scriptures"
            maxLength={MAX_NOTEBOOK_NAME}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (clean) onSave(clean);
            }}
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button
              label={confirmLabel}
              disabled={!clean}
              onPress={() => onSave(clean)}
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
    backgroundColor: scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: { width: '100%', maxWidth: 420, gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
