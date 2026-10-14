import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/context';
import { Text } from './Text';
import { spacing } from './tokens';

type Props = {
  title?: string;
  children: ReactNode;
};

/** Standard scrolling screen: safe area, brand background, optional title, centred on wide screens. */
export function Screen({ title, children }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.inner}>
          {title ? <Text variant="title">{title}</Text> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  inner: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.md },
});
