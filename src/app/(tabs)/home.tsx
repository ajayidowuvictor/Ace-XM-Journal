import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useOnboarding } from '@/features/onboarding/OnboardingContext';
import { TaskRow } from '@/features/tasks/TaskRow';
import { useTasks } from '@/features/tasks/TasksContext';
import { useTaskEditor } from '@/features/tasks/useTaskEditor';
import { todaysPriorities } from '@/features/tasks/logic';
import { toLocalDateString } from '@/lib/dates';
import { formatLongDate, greetingForHour } from '@/lib/greeting';
import { Button, Card, EmptyState, Screen, Text, spacing } from '@/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { displayName } = useOnboarding();
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const { tasks, setCompleted } = useTasks();
  const editor = useTaskEditor();
  const today = toLocalDateString(now);
  const priorities = todaysPriorities(tasks, today);
  const overdueIds = new Set(priorities.filter((t) => t.dueDate && t.dueDate < today).map((t) => t.id));

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">{displayName ? `${greeting}, ${displayName}` : greeting}</Text>
        <Text muted>{formatLongDate(now)}</Text>
      </View>

      <View style={styles.actions}>
        <Button label="New task" onPress={() => editor.open(null)} style={styles.action} />
        <Button
          label="New journal entry"
          variant="secondary"
          onPress={() => router.push('/journal')}
          style={styles.action}
        />
      </View>

      <Card>
        <Text variant="heading">Today&apos;s priorities</Text>
        {priorities.length === 0 ? (
          <EmptyState
            title="Nothing planned yet"
            message="Tasks you add for today will appear here."
          />
        ) : (
          priorities.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              overdue={overdueIds.has(task.id)}
              onToggle={(completed) => setCompleted(task.id, completed)}
              onOpen={() => editor.open(task)}
            />
          ))
        )}
      </Card>

      <Card>
        <Text variant="heading">Habits</Text>
        <EmptyState
          title="No habits yet"
          message="Habits you track will show their progress here."
        />
      </Card>
      {editor.element}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, paddingTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
