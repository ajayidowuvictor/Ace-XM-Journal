import { createHash } from 'node:crypto';

import { beforeEach, describe, expect, it } from '@jest/globals';

import { createPinStore, type PinStore } from '../pinStore';

let saved: string | null;
let counter: number;
let store: PinStore;

beforeEach(() => {
  saved = null;
  counter = 0;
  store = createPinStore({
    read: async () => saved,
    write: async (value) => {
      saved = value;
    },
    remove: async () => {
      saved = null;
    },
    randomHex: (bytes) => {
      counter += 1;
      return String(counter).padStart(bytes * 2, '0');
    },
    sha256Hex: async (text) => createHash('sha256').update(text).digest('hex'),
  });
});

describe('PIN store', () => {
  it('has no PIN to start with and accepts nothing', async () => {
    expect(await store.hasPin()).toBe(false);
    expect(await store.checkPin('123456')).toBe(false);
  });

  it('accepts the right PIN and rejects a wrong one', async () => {
    await store.setPin('123456');
    expect(await store.hasPin()).toBe(true);
    expect(await store.checkPin('123456')).toBe(true);
    expect(await store.checkPin('123457')).toBe(false);
    expect(await store.checkPin('12345')).toBe(false);
  });

  it('never keeps the PIN itself', async () => {
    await store.setPin('987654');
    expect(saved).not.toContain('987654');
  });

  it('uses a new random salt each time, so the same PIN is stored differently', async () => {
    await store.setPin('123456');
    const first = saved;
    await store.setPin('123456');
    expect(saved).not.toBe(first);
    expect(await store.checkPin('123456')).toBe(true);
  });

  it('refuses a PIN that is not six digits', async () => {
    await expect(store.setPin('1234')).rejects.toThrow();
    await expect(store.setPin('abcdef')).rejects.toThrow();
    expect(await store.hasPin()).toBe(false);
  });

  it('forgets the PIN when cleared', async () => {
    await store.setPin('123456');
    await store.clear();
    expect(await store.hasPin()).toBe(false);
    expect(await store.checkPin('123456')).toBe(false);
  });

  it('treats damaged stored data as no PIN', async () => {
    saved = 'garbage';
    expect(await store.hasPin()).toBe(false);
    saved = JSON.stringify({ v: 2, salt: 'a', hash: 'b' });
    expect(await store.checkPin('123456')).toBe(false);
  });
});
