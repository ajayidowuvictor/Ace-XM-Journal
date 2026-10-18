import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/context';
import { Text } from './Text';
import { layout, spacing } from './tokens';

type Props = {
  title?: string;
  /** Shown above the scrolling page and always in view, such as the app header. */
  header?: ReactNode;
  /** A button that floats above the page near the bottom, such as "New entry". */
  floating?: ReactNode;
  children: ReactNode;
};

/** Standard scrolling screen: safe area, background, large title, centred on wide screens. */
export function Screen({ title, header, floating, children }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.inner}>
          {title ? (
            <Text variant="largeTitle" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </ScrollView>
      {floating ? <View style={styles.floating}>{floating}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: layout.gutter, paddingBottom: spacing.xxl * 2 },
  inner: { width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', gap: spacing.lg - 4 },
  title: { paddingTop: spacing.md },
  floating: { position: 'absolute', bottom: spacing.md, left: 0, right: 0, alignItems: 'center' },
});
