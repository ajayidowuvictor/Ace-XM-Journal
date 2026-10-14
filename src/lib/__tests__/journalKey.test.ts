import { describe, expect, it } from '@jest/globals';

import { bytesToHex, getOrCreateJournalKey, type KeyStore } from '../journalKey';

function memoryStore(initial: string | null = null) {
  let value = initial;
  const store: KeyStore = {
    get: async () => value,
    set: async (next) => {
      value = next;
    },
  };
  return { store, read: () => value };
}

const fixedBytes = (count: number) => Uint8Array.from({ length: count }, (_, i) => i);

describe('bytesToHex', () => {
  it('writes each byte as two lower-case hex letters', () => {
    expect(bytesToHex(Uint8Array.from([0, 15, 16, 255]))).toBe('000f10ff');
  });
});

describe('getOrCreateJournalKey', () => {
  it('creates a 64-letter key on first use and saves it', async () => {
    const { store, read } = memoryStore();
    const key = await getOrCreateJournalKey(store, fixedBytes);

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(read()).toBe(key);
  });

  it('returns the saved key again instead of making a new one', async () => {
    const { store } = memoryStore();
    const first = await getOrCreateJournalKey(store, fixedBytes);
    const second = await getOrCreateJournalKey(store, () => new Uint8Array(32).fill(7));

    expect(second).toBe(first);
  });

  it('refuses to replace a stored value that is not a valid key', async () => {
    const { store, read } = memoryStore('not-a-key');

    await expect(getOrCreateJournalKey(store, fixedBytes)).rejects.toThrow();
    expect(read()).toBe('not-a-key');
  });
});
