import { useState } from 'react';

import { Button, Card, SegmentedControl, Text } from '../../ui';
import { LOCK_DELAY_OPTIONS, type LockDelay } from './logic';
import { useLock } from './LockContext';
import { PinFlow, type PinFlowMode } from './PinFlow';

const ON_OFF = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
] as const;

/** The "App lock" card in Settings. */
export function AppLockCard() {
  const { enabled, delay, setDelay, biometric, biometricAvailable, setBiometric } = useLock();
  const [flow, setFlow] = useState<PinFlowMode | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function chooseFingerprint(value: 'on' | 'off') {
    setNote(null);
    const ok = await setBiometric(value === 'on');
    if (!ok && value === 'on') setNote('Fingerprint unlock was not turned on. Please try again.');
  }

  return (
    <Card>
      <Text variant="heading">App lock</Text>
      <Text muted>
        Ask for a PIN when someone opens the app. It stops other people who pick up your phone. Your
        journal and notes are also encrypted on their own.
      </Text>

      {enabled ? (
        <>
          <Text variant="caption" muted>
            Lock the app after being away
          </Text>
          <SegmentedControl<LockDelay>
            accessibilityLabel="Lock the app after being away"
            options={LOCK_DELAY_OPTIONS}
            value={delay}
            onChange={setDelay}
          />

          {biometricAvailable ? (
            <>
              <Text variant="caption" muted>
                Open with your fingerprint
              </Text>
              <SegmentedControl<'on' | 'off'>
                accessibilityLabel="Open with your fingerprint"
                options={ON_OFF}
                value={biometric ? 'on' : 'off'}
                onChange={(value) => void chooseFingerprint(value)}
              />
            </>
          ) : null}

          {note ? (
            <Text variant="caption" accessibilityLiveRegion="polite">
              {note}
            </Text>
          ) : null}

          <Button label="Change PIN" variant="secondary" onPress={() => setFlow('change')} />
          <Button label="Turn off app lock" variant="ghost" onPress={() => setFlow('disable')} />
        </>
      ) : (
        <Button label="Turn on app lock" variant="secondary" onPress={() => setFlow('set')} />
      )}

      <PinFlow
        mode={flow}
        onClose={() => {
          setFlow(null);
        }}
      />
    </Card>
  );
}
