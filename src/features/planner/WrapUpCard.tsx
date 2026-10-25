import { useState } from 'react';

import { Button, Card, Text, TextField } from '../../ui';
import { MoodPicker } from '../journal/MoodPicker';
import type { JournalEntry, Mood } from '../journal/types';
import { parseWrapUp } from './logic';

type Props = {
  /** Today's saved wrap-up, if there is one. Give the card a new `key` when this changes. */
  existing: JournalEntry | null;
  /** False while the journal is locked or unavailable. */
  journalReady: boolean;
  /** Saves the wrap-up to the journal. Returns true when saved. */
  onSave: (wentWell: string, tomorrow: string, mood: Mood | null) => boolean;
  /** Adds the "what matters tomorrow" line as tomorrow's focus. Returns a message to show. */
  onPlanTomorrow: (tomorrow: string) => string;
};

/** A short end-of-day reflection that is saved to the (encrypted) journal. */
export function WrapUpCard({ existing, journalReady, onSave, onPlanTomorrow }: Props) {
  const initial = existing ? parseWrapUp(existing.body) : { wentWell: '', tomorrow: '' };
  const [wentWell, setWentWell] = useState(initial.wentWell);
  const [tomorrow, setTomorrow] = useState(initial.tomorrow);
  const [mood, setMood] = useState<Mood | null>(existing?.mood ?? null);
  const [note, setNote] = useState<string | null>(null);
  const [planNote, setPlanNote] = useState<string | null>(null);

  const empty = !wentWell.trim() && !tomorrow.trim() && mood === null;

  function save() {
    setNote(
      onSave(wentWell, tomorrow, mood)
        ? 'Saved to your journal.'
        : 'Could not save. Please try again.',
    );
  }

  return (
    <Card>
      <Text variant="heading">Wrap up your day</Text>
      <Text variant="secondary" muted>
        A few short lines. They are saved to your private journal.
      </Text>
      <Text variant="caption" muted>
        How was today?
      </Text>
      <MoodPicker
        value={mood}
        onChange={(next) => {
          setMood(next);
          setNote(null);
        }}
      />
      <TextField
        label="What went well today?"
        value={wentWell}
        onChangeText={(text) => {
          setWentWell(text);
          setNote(null);
        }}
        multiline
        textAlignVertical="top"
        placeholder="Even a small thing counts"
      />
      <TextField
        label="What matters tomorrow?"
        value={tomorrow}
        onChangeText={(text) => {
          setTomorrow(text);
          setNote(null);
          setPlanNote(null);
        }}
        multiline
        textAlignVertical="top"
        placeholder="One thing is enough"
      />
      <Button
        label="Make it tomorrow's focus"
        variant="secondary"
        accessibilityHint="Adds the first line as a task for tomorrow and puts it in tomorrow's focus"
        disabled={!tomorrow.trim()}
        onPress={() => setPlanNote(onPlanTomorrow(tomorrow))}
      />
      {planNote ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {planNote}
        </Text>
      ) : null}
      <Button
        label={existing ? 'Update wrap-up' : 'Save wrap-up'}
        disabled={empty || !journalReady}
        onPress={save}
      />
      {note ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}
      {!journalReady ? (
        <Text variant="caption" muted>
          Your journal is not available right now, so the wrap-up cannot be saved.
        </Text>
      ) : null}
    </Card>
  );
}
