import { constantTimeEqual, isValidPin } from './logic';

/** What the PIN store needs from the phone. Passing it in lets tests use plain stand-ins. */
export type PinStoreDeps = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
  /** Random bytes as hex text. */
  randomHex: (bytes: number) => string;
  sha256Hex: (text: string) => Promise<string>;
};

type Stored = { v: 1; salt: string; hash: string };

export type PinStore = {
  hasPin: () => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  checkPin: (pin: string) => Promise<boolean>;
  clear: () => Promise<void>;
};

/**
 * Keeps a salted fingerprint of the PIN in the phone's secure storage, never the PIN itself.
 * This lock stops other people from opening the app; the journal database has its own
 * encryption key and does not depend on the PIN.
 */
export function createPinStore(deps: PinStoreDeps): PinStore {
  async function load(): Promise<Stored | null> {
    const raw = await deps.read();
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as Partial<Stored>;
      if (value.v === 1 && typeof value.salt === 'string' && typeof value.hash === 'string') {
        return { v: 1, salt: value.salt, hash: value.hash };
      }
    } catch {
      // A damaged value counts as "no PIN".
    }
    return null;
  }

  return {
    hasPin: async () => (await load()) !== null,

    async setPin(pin) {
      if (!isValidPin(pin)) throw new Error('A PIN must be six digits.');
      const salt = deps.randomHex(16);
      const hash = await deps.sha256Hex(`${salt}:${pin}`);
      await deps.write(JSON.stringify({ v: 1, salt, hash } satisfies Stored));
    },

    async checkPin(pin) {
      const stored = await load();
      if (!stored || !isValidPin(pin)) return false;
      const hash = await deps.sha256Hex(`${stored.salt}:${pin}`);
      return constantTimeEqual(hash, stored.hash);
    },

    clear: () => deps.remove(),
  };
}
