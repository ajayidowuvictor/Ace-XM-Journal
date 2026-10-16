import { StyleSheet, View } from 'react-native';

import { Button, Card, Text, spacing } from '../../ui';
import { describeLastBackup } from './status';

type Props = {
  lastBackup: string | null;
  now: Date;
  onBackUp: () => void;
  onLater: () => void;
};

/** A calm reminder on Home that the data lives only on this phone. */
export function BackupNudgeCard({ lastBackup, now, onBackUp, onLater }: Props) {
  return (
    <Card>
      <Text variant="subheading">Keep a copy of your journal</Text>
      <Text variant="secondary" muted>
        Everything is stored only on this phone. If it is lost or reset, nothing can bring it back
        without a backup. {describeLastBackup(lastBackup, now)}
      </Text>
      <View style={styles.actions}>
        <Button label="Back up now" onPress={onBackUp} style={styles.action} />
        <Button label="Not now" variant="ghost" onPress={onLater} style={styles.action} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
