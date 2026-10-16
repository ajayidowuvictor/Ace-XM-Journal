import { describe, expect, it } from '@jest/globals';

import { getOrCreateAppKey, type SyncKeyStore } from '../appKey';

function memoryStore(initial: string | null = null) {
  let value = initial;
  const store: SyncKeyStore = {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
  return { store, read: () => value };
}

const fixedBytes = (count: number) => Uint8Array.from({ length: count }, (_, i) => i);

describe('getOrCreateAppKey', () => {
  it('creates a 64-letter key on first use and saves it', () => {
    const { store, read } = memoryStore();
    const key = getOrCreateAppKey(store, fixedBytes);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(read()).toBe(key);
  });

  it('returns the saved key again instead of making a new one', () => {
    const { store } = memoryStore();
    const first = getOrCreateAppKey(store, fixedBytes);
    expect(getOrCreateAppKey(store, () => new Uint8Array(32).fill(7))).toBe(first);
  });

  it('refuses to replace a stored value that is not a valid key', () => {
    const { store, read } = memoryStore('not-a-key');
    expect(() => getOrCreateAppKey(store, fixedBytes)).toThrow();
    expect(read()).toBe('not-a-key');
  });
});
