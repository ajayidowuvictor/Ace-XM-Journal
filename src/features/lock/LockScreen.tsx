import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { failure, success } from '../../lib/haptics';
import { useTheme } from '../../theme/context';
import { Button, Card, Text, fonts, layout, spacing } from '../../ui';
import { useEraseAll } from '../settings/useEraseAll';
import { WipeDialog } from '../settings/WipeDialog';
import { formatWait } from './logic';
import { useLock } from './LockContext';
import { PinPad } from './PinPad';

/** Covers the whole app until the right PIN (or fingerprint) is given. */
export function LockScreen() {
  const { colors } = useTheme();
  const {
    locked,
    biometric,
    waitSeconds,
    checkPin,
    unlockWithFingerprint,
    resetWithPhoneLock,
    turnOff,
  } = useLock();
  const eraseAll = useEraseAll();

  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [forgetting, setForgetting] = useState(false);
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Offer the fingerprint as soon as the lock appears.
  useEffect(() => {
    if (locked && biometric) void unlockWithFingerprint();
  }, [locked, biometric, unlockWithFingerprint]);

  async function submit(entered: string) {
    setChecking(true);
    const result = await checkPin(entered);
    setChecking(false);
    setPin('');
    if (result === 'ok') {
      setMessage(null);
      success();
      return;
    }
    failure();
    setMessage(result === 'wait' ? null : 'That PIN is not right. Try again.');
  }

  async function resetWithPhone() {
    setResetting(true);
    setMessage(null);
    const ok = await resetWithPhoneLock();
    setResetting(false);
    if (ok) {
      setForgetting(false);
      setPin('');
    } else {
      setMessage('Your phone could not confirm it is you. You can try again.');
    }
  }

  async function eraseEverything() {
    setConfirmingErase(false);
    const result = eraseAll();
    if (result.ok) {
      await turnOff();
      setForgetting(false);
    } else {
      setMessage(result.message);
    }
  }

  const status =
    waitSeconds > 0
      ? `Too many wrong tries. Please wait ${formatWait(waitSeconds)}.`
      : (message ?? 'Enter your PIN to open your journal.');
  const isProblem = waitSeconds > 0 || message !== null;

  return (
    <Modal
      visible={locked}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
      accessibilityViewIsModal
    >
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={[styles.brand, { color: colors.primary }]}>ACE XM JOURNAL</Text>
            <Text
              variant="secondary"
              tone={isProblem ? 'danger' : undefined}
              muted={!isProblem}
              style={styles.centered}
              accessibilityLiveRegion="polite"
            >
              {status}
            </Text>
          </View>

          <PinPad
            value={pin}
            onChange={setPin}
            onComplete={(entered) => void submit(entered)}
            disabled={checking || waitSeconds > 0 || resetting}
            extraKey={
              biometric
                ? {
                    label: '☝',
                    accessibilityLabel: 'Use fingerprint',
                    onPress: () => void unlockWithFingerprint(),
                  }
                : undefined
            }
          />

          <Button label="Forgot PIN?" variant="ghost" onPress={() => setForgetting(true)} />
        </View>

        <Modal
          visible={forgetting}
          transparent
          animationType="fade"
          onRequestClose={() => setForgetting(false)}
        >
          <View style={styles.overlay}>
            <Card variant="hero" style={styles.dialog}>
              <Text variant="heading">Forgot your PIN?</Text>
              <Text muted>
                Your phone&apos;s own screen lock can confirm it is you. The app lock is then
                turned off and nothing is erased. You can set a new PIN in Settings.
              </Text>
              {message ? (
                <Text variant="caption" tone="danger">
                  {message}
                </Text>
              ) : null}
              <Button
                label="Use my phone's screen lock"
                loading={resetting}
                onPress={() => void resetWithPhone()}
              />
              <Button
                label="Erase everything instead"
                variant="danger"
                onPress={() => setConfirmingErase(true)}
              />
              <Button label="Cancel" variant="ghost" onPress={() => setForgetting(false)} />
            </Card>
          </View>
        </Modal>

        <WipeDialog
          visible={confirmingErase}
          onCancel={() => setConfirmingErase(false)}
          onConfirm={() => void eraseEverything()}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: layout.gutter,
  },
  header: { alignItems: 'center', gap: spacing.md },
  brand: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: 1.5 },
  centered: { textAlign: 'center' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: { width: '100%', maxWidth: 420, gap: spacing.md },
});
