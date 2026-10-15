import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { spacing } from './tokens';

type Props = {
  title: string;
  /** An optional small button on the right, such as "Add block". */
  actionLabel?: string;
  onAction?: () => void;
};

/** A heading that sits above a card, with an optional action on the right. */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="heading">{title}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="ghost" size="compact" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
});
