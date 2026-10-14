/** Where the journal's secret key is kept. In the app this is the phone's secure storage. */
export type KeyStore = {
  get: () => Promise<string | null>;
  set: (value: string) => Promise<void>;
};

const KEY_PATTERN = /^[0-9a-f]{64}$/;

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns the journal's 256-bit key as 64 hex letters, creating and saving one on first use.
 * A stored value that is not a valid key is never replaced: replacing it would lock the
 * existing journal forever, so this throws instead.
 */
export async function getOrCreateJournalKey(
  store: KeyStore,
  randomBytes: (count: number) => Uint8Array,
): Promise<string> {
  const existing = await store.get();
  if (existing !== null) {
    if (!KEY_PATTERN.test(existing)) throw new Error('The stored journal key is not valid.');
    return existing;
  }

  const created = bytesToHex(randomBytes(32));
  await store.set(created);
  return created;
}
