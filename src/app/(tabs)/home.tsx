import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { formatLongDate, greetingForHour } from '@/lib/greeting';
import { Button, Card, EmptyState, Screen, Text, spacing } from '@/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { displayName } = useOnboarding();
  const now = new Date();
  const greeting = greetingForHour(now.getHours());

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">{displayName ? `${greeting}, ${displayName}` : greeting}</Text>
        <Text muted>{formatLongDate(now)}</Text>
      </View>

      <View style={styles.actions}>
        <Button label="New task" onPress={() => router.push('/tasks')} style={styles.action} />
        <Button
          label="New journal entry"
          variant="secondary"
          onPress={() => router.push('/journal')}
          style={styles.action}
        />
      </View>

      <Card>
        <Text variant="heading">Today&apos;s priorities</Text>
        <EmptyState
          title="Nothing planned yet"
          message="Tasks you add for today will appear here."
        />
      </Card>

      <Card>
        <Text variant="heading">Habits</Text>
        <EmptyState
          title="No habits yet"
          message="Habits you track will show their progress here."
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, paddingTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
