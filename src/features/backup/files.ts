import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const MAX_BACKUP_BYTES = 100 * 1024 * 1024;

/** A backup file name such as `acexm-backup-2026-10-16.acexmbackup`. */
export function backupFileName(localDate: string): string {
  return `acexm-backup-${localDate}.acexmbackup`;
}

/** Saves the backup text to a temporary file and opens the share sheet. Returns false if sharing is unavailable. */
export async function shareBackupFile(fileName: string, text: string): Promise<boolean> {
  const file = new File(Paths.cache, fileName);
  try {
    try {
      file.delete();
    } catch {
      // Nothing left over from before.
    }
    file.create();
    file.write(text);

    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save your encrypted backup',
    });
    return true;
  } finally {
    try {
      file.delete();
    } catch {
      // The temporary file may already be gone.
    }
  }
}

export type PickedBackup =
  | { status: 'picked'; name: string; text: string }
  | { status: 'cancelled' }
  | { status: 'too-big' }
  | { status: 'unreadable' };

/** Lets the person choose a backup file and reads it as text. */
export async function pickBackupFile(): Promise<PickedBackup> {
  let copy: File | null = null;
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) return { status: 'cancelled' };

    const asset = result.assets[0];
    copy = new File(asset.uri);
    if (typeof asset.size === 'number' && asset.size > MAX_BACKUP_BYTES) {
      return { status: 'too-big' };
    }
    const text = await copy.text();
    return { status: 'picked', name: asset.name, text };
  } catch {
    return { status: 'unreadable' };
  } finally {
    try {
      copy?.delete();
    } catch {
      // The temporary copy may already be gone.
    }
  }
}
