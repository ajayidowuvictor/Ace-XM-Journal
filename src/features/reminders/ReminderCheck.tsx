import { useState } from 'react';

import { Button, Card, Text } from '../../ui';
import { reminderDiagnosis, scheduledSummary, scheduleTestReminder } from './service';

/** Lets the person check that reminders can reach this phone, without waiting for a real one. */
export function ReminderCheck() {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendTest(seconds: number) {
    setBusy(true);
    const result = await scheduleTestReminder(new Date(), seconds);
    const phone = await reminderDiagnosis();
    setBusy(false);
    if (result === 'ok') {
      const when =
        seconds < 60
          ? 'A test reminder will arrive in a few seconds. Press the phone\'s Home button now to leave the app.'
          : 'A test reminder will arrive in about a minute. Close the app now and wait, to see whether it reaches you.';
      setNote(phone ? `${when} ${phone}` : when);
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
    const phone = await reminderDiagnosis();
    setBusy(false);
    setNote(
      summary
        ? [summary, phone].filter(Boolean).join(' ')
        : 'This phone did not say what is scheduled. Please try again.',
    );
  }

  return (
    <Card>
      <Text variant="heading">Check reminders</Text>
      <Text muted>
        Some phones stop apps from running in the background and so block reminders. Send a test to
        find out before you rely on them.
      </Text>
      <Button
        label="Show a pop-up in 5 seconds"
        variant="secondary"
        loading={busy}
        onPress={() => void sendTest(5)}
      />
      <Button
        label="Send a test reminder in 1 minute"
        variant="secondary"
        loading={busy}
        onPress={() => void sendTest(60)}
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
