import { KEY_PATTERN, bytesToHex } from './journalKey';

/** Where the key for tasks, habits and goals is kept (the phone's secure storage), read at once. */
export type SyncKeyStore = {
  get: () => string | null;
  set: (value: string) => void;
};

/**
 * Returns the 256-bit key (64 hex letters) for the tasks, habits and goals database, creating and
 * saving one on first use. A stored value that is not a valid key is never replaced: that would
 * lock the existing data forever, so this throws instead.
 */
export function getOrCreateAppKey(
  store: SyncKeyStore,
  randomBytes: (count: number) => Uint8Array,
): string {
  const existing = store.get();
  if (existing !== null) {
    if (!KEY_PATTERN.test(existing)) throw new Error('The stored key is not valid.');
    return existing;
  }
  const created = bytesToHex(randomBytes(32));
  store.set(created);
  return created;
}
