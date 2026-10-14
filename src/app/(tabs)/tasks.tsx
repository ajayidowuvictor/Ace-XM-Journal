import { EmptyState, Screen } from '@/ui';

export default function TasksScreen() {
  return (
    <Screen title="Tasks">
      <EmptyState
        title="Tasks are coming next"
        message="Planning and task tracking are being built. Nothing is stored here yet."
      />
    </Screen>
  );
}
