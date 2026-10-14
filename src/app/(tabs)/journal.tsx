import { EmptyState, Screen } from '@/ui';

export default function JournalScreen() {
  return (
    <Screen title="Journal">
      <EmptyState
        title="Journaling is coming soon"
        message="Your private journal is being built. Nothing is stored here yet."
      />
    </Screen>
  );
}
