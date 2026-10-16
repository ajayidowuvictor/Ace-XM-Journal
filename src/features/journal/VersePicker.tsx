import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/context';
import { Button, Card, PressableScale, Text, readingFont, radius, spacing, scrim } from '../../ui';
import { shareText } from '../notes/logic';
import { useNotes } from '../notes/NotesContext';

type Props = {
  visible: boolean;
  /** Called with the verse written as a quotation followed by where it is from. */
  onPick: (quote: string) => void;
  onClose: () => void;
};

/** A list of the verses saved in Notes, so one can be dropped into a journal entry. */
export function VersePicker({ visible, onPick, onClose }: Props) {
  const { colors } = useTheme();
  const { notes } = useNotes();
  const verses = notes.filter((note) => note.kind === 'verse' && note.body.trim() !== '');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Text variant="heading">Insert a saved verse</Text>
          {verses.length === 0 ? (
            <Text muted>
              You have no saved verses yet. Add one in Notes and it will show up here.
            </Text>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {verses.map((verse) => (
                <PressableScale
                  key={verse.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Insert ${verse.reference.trim() || 'this verse'}`}
                  onPress={() => onPick(shareText(verse))}
                >
                  <Card>
                    <Text style={{ fontFamily: readingFont }} numberOfLines={3}>
                      {verse.body.trim()}
                    </Text>
                    {verse.reference.trim() ? (
                      <Text variant="secondary" tone="primary">
                        {verse.reference.trim()}
                      </Text>
                    ) : null}
                  </Card>
                </PressableScale>
              ))}
            </ScrollView>
          )}
          <Button label="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: scrim, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  list: { gap: spacing.md, paddingBottom: spacing.md },
});
