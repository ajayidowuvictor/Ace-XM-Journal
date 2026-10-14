import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/context';
import { Button } from './Button';
import { Text } from './Text';
import { spacing } from './tokens';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme();

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={styles.box}>
      <ActivityIndicator color={colors.primary} />
      <Text muted>{label}</Text>
    </View>
  );
}

type EmptyProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.box}>
      <Text variant="heading" style={styles.centered}>
        {title}
      </Text>
      <Text muted style={styles.centered}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

type ErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorProps) {
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text variant="heading" tone="danger" style={styles.centered}>
        Something went wrong
      </Text>
      <Text muted style={styles.centered}>
        {message}
      </Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  centered: { textAlign: 'center' },
});
