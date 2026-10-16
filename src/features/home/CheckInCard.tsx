import { Button, Card, Text } from '../../ui';

type Props = { prompt: string; onWrite: () => void };

/** A gentle daily question that opens a new journal entry with the question in the text box. */
export function CheckInCard({ prompt, onWrite }: Props) {
  return (
    <Card>
      <Text variant="caption" muted>
        DAILY CHECK-IN
      </Text>
      <Text variant="heading">{prompt}</Text>
      <Text muted>A quick pause to note down clarity, gratitude or a prayer.</Text>
      <Button label="Write a short entry" onPress={onWrite} />
    </Card>
  );
}
