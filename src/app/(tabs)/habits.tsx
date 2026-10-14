import { EmptyState, Screen } from '@/ui';

export default function HabitsScreen() {
  return (
    <Screen title="Habits">
      <EmptyState
        title="Habit tracking is coming soon"
        message="Habits and goals are being built. Nothing is stored here yet."
      />
    </Screen>
  );
}
