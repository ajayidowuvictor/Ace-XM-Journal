import { useState } from 'react';

import { toLocalDateString } from '../../lib/dates';
import { Button, Card, ConfirmDialog, Text } from '../../ui';
import { buildExport } from '../export/buildExport';
import { useExportInputs } from '../export/useExportInputs';
import { useJournal } from '../journal/JournalContext';
import { useLock } from '../lock/LockContext';
import { BusyDialog } from './BusyDialog';
import { phoneCrypto } from './backupCrypto';
import { createBackupFile, openBackupFile, readEnvelope } from './backupFormat';
import { backupFileName, pickBackupFile, shareBackupFile } from './files';
import { PasswordDialog } from './PasswordDialog';
import { parseBackupData, summarizeBackup } from './parseBackup';
import type { BackupData } from './types';
import { useRestore } from './useRestore';

type Phase =
  | { name: 'idle' }
  | { name: 'create-password' }
  | { name: 'restore-password'; fileName: string; fileText: string }
  | { name: 'busy'; title: string }
  | { name: 'restore-confirm'; data: BackupData };

const SLOW_MESSAGE =
  'Checking the password is deliberately slow, to keep your data safe. It can take up to a minute on an older phone. Please keep the app open.';

/** Lets the paint happen before slow work starts, so the "please wait" pop-up shows first. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 80));
}

/** The "Backup and restore" card in Settings. */
export function BackupCard() {
  const inputs = useExportInputs();
  const { status } = useJournal();
  const { withoutLock } = useLock();
  const restore = useRestore();

  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [note, setNote] = useState<string | null>(null);

  async function startCreate(password: string) {
    setPhase({ name: 'busy', title: 'Locking your backup' });
    await nextFrame();
    try {
      const plaintext = buildExport(inputs, new Date().toISOString());
      const file = await createBackupFile(phoneCrypto, password, plaintext);
      setPhase({ name: 'idle' });
      const shared = await withoutLock(() =>
        shareBackupFile(backupFileName(toLocalDateString(new Date())), file),
      );
      setNote(
        shared
          ? 'Backup created. Keep the file and your password safe. The file cannot be opened without the password, and nobody can recover the password for you.'
          : 'Sharing is not available on this device, so the backup could not be saved.',
      );
    } catch {
      setPhase({ name: 'idle' });
      setNote('The backup could not be created. Please try again.');
    }
  }

  async function chooseFile() {
    setNote(null);
    const picked = await withoutLock(() => pickBackupFile());
    if (picked.status === 'cancelled') return;
    if (picked.status === 'too-big') {
      setNote('That file is too big to be a backup.');
      return;
    }
    if (picked.status === 'unreadable') {
      setNote('That file could not be read.');
      return;
    }
    const envelope = readEnvelope(picked.text);
    if (!envelope.ok) {
      setNote(
        envelope.reason === 'unsupported'
          ? 'This backup was made in a way this version of the app cannot open.'
          : 'That file is not an ACE XM JOURNAL backup.',
      );
      return;
    }
    setPhase({ name: 'restore-password', fileName: picked.name, fileText: picked.text });
  }

  async function openFile(password: string, fileText: string) {
    setPhase({ name: 'busy', title: 'Opening your backup' });
    await nextFrame();
    try {
      const opened = await openBackupFile(phoneCrypto, password, fileText);
      if (!opened.ok) {
        setPhase({ name: 'idle' });
        setNote(
          opened.reason === 'wrong-password'
            ? 'The password is wrong, or the file is damaged. Nothing was changed.'
            : 'That file is not an ACE XM JOURNAL backup.',
        );
        return;
      }
      const data = parseBackupData(opened.plaintext);
      if (!data) {
        setPhase({ name: 'idle' });
        setNote('The backup opened but its contents are not readable. Nothing was changed.');
        return;
      }
      setPhase({ name: 'restore-confirm', data });
    } catch {
      setPhase({ name: 'idle' });
      setNote('The backup could not be opened. Nothing was changed.');
    }
  }

  function applyRestore(data: BackupData) {
    setPhase({ name: 'idle' });
    setNote(restore(data).message);
  }

  const journalReady = status === 'ready';

  return (
    <Card>
      <Text variant="heading">Backup and restore</Text>
      <Text muted>
        Save everything in one file locked with a password, so you can move to a new phone or
        recover from a loss. Without the password the file cannot be opened, and nobody can reset it
        for you.
      </Text>
      <Button
        label="Create encrypted backup"
        variant="secondary"
        disabled={!journalReady}
        onPress={() => {
          setNote(null);
          setPhase({ name: 'create-password' });
        }}
      />
      <Button
        label="Restore from a backup"
        variant="secondary"
        disabled={!journalReady}
        onPress={() => void chooseFile()}
      />
      {!journalReady ? (
        <Text variant="caption" muted>
          Backups are available once your journal has opened.
        </Text>
      ) : null}
      {note ? (
        <Text variant="caption" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}

      <PasswordDialog
        visible={phase.name === 'create-password'}
        title="Choose a backup password"
        message="You will need this password to open the backup. Write it down somewhere safe: if you forget it, the backup cannot be opened by anyone."
        confirmLabel="Create backup"
        askTwice
        onCancel={() => setPhase({ name: 'idle' })}
        onSubmit={(password) => void startCreate(password)}
      />
      <PasswordDialog
        visible={phase.name === 'restore-password'}
        title="Enter the backup password"
        message={phase.name === 'restore-password' ? `File: ${phase.fileName}` : ''}
        confirmLabel="Open backup"
        askTwice={false}
        onCancel={() => setPhase({ name: 'idle' })}
        onSubmit={(password) => {
          if (phase.name === 'restore-password') void openFile(password, phase.fileText);
        }}
      />
      <BusyDialog
        visible={phase.name === 'busy'}
        title={phase.name === 'busy' ? phase.title : ''}
        message={SLOW_MESSAGE}
      />
      <ConfirmDialog
        visible={phase.name === 'restore-confirm'}
        title="Replace everything with this backup?"
        message={
          phase.name === 'restore-confirm'
            ? `This backup contains ${summarizeBackup(phase.data)}. Everything now on this phone will be replaced by it. This cannot be undone.`
            : ''
        }
        confirmLabel="Replace everything"
        destructive
        onCancel={() => setPhase({ name: 'idle' })}
        onConfirm={() => {
          if (phase.name === 'restore-confirm') applyRestore(phase.data);
        }}
      />
    </Card>
  );
}
