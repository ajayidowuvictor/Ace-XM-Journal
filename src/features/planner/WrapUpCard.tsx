import { useState } from 'react';

import { Button, Card, Text, TextField } from '../../ui';
import type { JournalEntry } from '../journal/types';
import { parseWrapUp } from './logic';

type Props = {
  /** Today's saved wrap-up, if there is one. Give the card a new `key` when this changes. */
  existing: JournalEntry | null;
  /** False while the journal is locked or unavailable. */
  journalReady: boolean;
  /** Saves the wrap-up to the journal. Returns true when saved. */
  onSave: (wentWell: string, tomorrow: string) => boolean;
};

/** A short end-of-day reflection that is saved to the (encrypted) journal. */
export function WrapUpCard({ existing, journalReady, onSave }: Props) {
  const initial = existing ? parseWrapUp(existing.body) : { wentWell: '', tomorrow: '' };
  const [wentWell, setWentWell] = useState(initial.wentWell);
  const [tomorrow, setTomorrow] = useState(initial.tomorrow);
  const [note, setNote] = useState<string | null>(null);

  const empty = !wentWell.trim() && !tomorrow.trim();

  function save() {
    setNote(onSave(wentWell, tomorrow) ? 'Saved to your journal.' : 'Could not save. Please try again.');
  }

  return (
    <Card>
      <Text variant="heading">Wrap up your day</Text>
      <Text variant="secondary" muted>
        Two short lines. They are saved to your private journal.
      </Text>
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
        }}
        multiline
        textAlignVertical="top"
        placeholder="One thing is enough"
      />
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
