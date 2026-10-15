import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes the export text to a temporary file, opens the phone's share sheet so the user chooses
 * where it goes, then deletes the temporary file. Returns false if sharing is not available.
 */
export async function shareExport(fileName: string, text: string): Promise<boolean> {
  const file = new File(Paths.cache, fileName);
  try {
    try {
      file.delete();
    } catch {
      // Nothing to remove from an earlier export.
    }
    file.create();
    file.write(text);

    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export your data' });
    return true;
  } finally {
    try {
      file.delete();
    } catch {
      // The temporary file may already be gone.
    }
  }
}
