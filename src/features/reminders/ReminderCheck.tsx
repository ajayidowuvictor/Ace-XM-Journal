import { useState } from 'react';

import { Button, Card, Text } from '../../ui';
import { scheduledSummary, scheduleTestReminder } from './service';

/** Lets the person check that reminders can reach this phone, without waiting for a real one. */
export function ReminderCheck() {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendTest() {
    setBusy(true);
    const result = await scheduleTestReminder();
    setBusy(false);
    if (result === 'ok') {
      setNote(
        'A test reminder will arrive in about a minute. Close the app now and wait, to see whether it reaches you.',
      );
    } else if (result === 'denied') {
      setNote(
        'Notifications are not allowed for this app. You can allow them in your phone settings.',
      );
    } else {
      setNote('The test could not be set. Please try again.');
    }
  }

  async function check() {
    setBusy(true);
    const summary = await scheduledSummary();
    setBusy(false);
    setNote(summary ?? 'This phone did not say what is scheduled. Please try again.');
  }

  return (
    <Card>
      <Text variant="heading">Check reminders</Text>
      <Text muted>
        Some phones stop apps from running in the background and so block reminders. Send a test to
        find out before you rely on them.
      </Text>
      <Button
        label="Send a test reminder in 1 minute"
        variant="secondary"
        loading={busy}
        onPress={() => void sendTest()}
      />
      <Button
        label="See what is scheduled"
        variant="ghost"
        disabled={busy}
        onPress={() => void check()}
      />
      {note ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}
    </Card>
  );
}
