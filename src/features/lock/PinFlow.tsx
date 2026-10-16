import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { success } from '../../lib/haptics';
import { Button, Card, Text, spacing, scrim } from '../../ui';
import { formatWait } from './logic';
import { useLock } from './LockContext';
import { PinPad } from './PinPad';

export type PinFlowMode = 'set' | 'change' | 'disable';

type Step = 'current' | 'new' | 'again';

type Props = {
  /** Which job to do, or null when the pop-up is closed. */
  mode: PinFlowMode | null;
  /** Called when the pop-up closes. `done` is true if the job finished. */
  onClose: (done: boolean) => void;
};

const TITLES: Record<PinFlowMode, string> = {
  set: 'Turn on app lock',
  change: 'Change PIN',
  disable: 'Turn off app lock',
};

/** A pop-up that asks for the PINs needed to turn the lock on, change the PIN or turn it off. */
export function PinFlow({ mode, onClose }: Props) {
  // Mounted only while open, so every visit starts fresh.
  return mode ? <OpenFlow mode={mode} onClose={onClose} /> : null;
}

function OpenFlow({ mode, onClose }: { mode: PinFlowMode; onClose: (done: boolean) => void }) {
  const { confirmPin, savePin, turnOff, waitSeconds } = useLock();
  const [step, setStep] = useState<Step>(mode === 'set' ? 'new' : 'current');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const prompt: Record<Step, string> = {
    current: 'Enter your current PIN.',
    new: 'Choose a new six-digit PIN.',
    again: 'Enter the same PIN again to confirm.',
  };

  async function complete(entered: string) {
    setBusy(true);
    setMessage(null);
    try {
      if (step === 'current') {
        if (!(await confirmPin(entered))) {
          setMessage('That PIN is not right.');
          return;
        }
        if (mode === 'disable') {
          await turnOff();
          success();
          onClose(true);
          return;
        }
        setStep('new');
      } else if (step === 'new') {
        setFirstPin(entered);
        setStep('again');
      } else if (entered !== firstPin) {
        setMessage('The two PINs did not match. Please start again.');
        setFirstPin('');
        setStep('new');
      } else if (await savePin(entered)) {
        success();
        onClose(true);
        return;
      } else {
        setMessage('The PIN could not be saved. Please try again.');
        setFirstPin('');
        setStep('new');
      }
    } finally {
      setPin('');
      setBusy(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View style={styles.overlay}>
        <Card variant="hero" style={styles.dialog}>
          <Text variant="heading">{TITLES[mode]}</Text>
          <Text
            muted={!message && waitSeconds === 0}
            tone={message || waitSeconds > 0 ? 'danger' : undefined}
            accessibilityLiveRegion="polite"
          >
            {waitSeconds > 0
              ? `Too many wrong tries. Please wait ${formatWait(waitSeconds)}.`
              : (message ?? prompt[step])}
          </Text>
          <PinPad
            value={pin}
            onChange={setPin}
            onComplete={(entered) => void complete(entered)}
            disabled={busy || (step === 'current' && waitSeconds > 0)}
          />
          <Button label="Cancel" variant="ghost" onPress={() => onClose(false)} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: { width: '100%', maxWidth: 420, gap: spacing.lg, alignItems: 'center' },
});
