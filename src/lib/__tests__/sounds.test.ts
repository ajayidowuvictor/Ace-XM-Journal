import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const play = jest.fn();
const seekTo = jest.fn(async () => undefined);
const createAudioPlayer = jest.fn(() => ({ play, seekTo, volume: 1 }));
const setAudioModeAsync = jest.fn(async () => undefined);

jest.mock('expo-audio', () => ({ createAudioPlayer, setAudioModeAsync }));

const store = new Map<string, string>();
jest.mock('../preferences', () => ({
  PREF_KEYS: { sounds: 'ui-sounds' },
  readPreference: (key: string) => store.get(key) ?? null,
  writePreference: (key: string, value: string) => {
    store.set(key, value);
  },
}));

import { parseSoundsEnabled, playSound, setSoundsEnabled } from '../sounds';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('parseSoundsEnabled', () => {
  it('is on unless the saved value is exactly "0"', () => {
    expect(parseSoundsEnabled(null)).toBe(true);
    expect(parseSoundsEnabled('1')).toBe(true);
    expect(parseSoundsEnabled('')).toBe(true);
    expect(parseSoundsEnabled('0')).toBe(false);
  });
});

describe('playSound', () => {
  beforeEach(() => {
    play.mockClear();
    seekTo.mockClear();
    createAudioPlayer.mockClear();
    store.clear();
    setSoundsEnabled(true);
  });

  it('plays the sound from the start when sounds are on', async () => {
    playSound('complete');
    await settle();
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('reuses the player for the same sound', async () => {
    playSound('unlock');
    await settle();
    playSound('unlock');
    await settle();
    expect(play).toHaveBeenCalledTimes(2);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it('stays silent and saves the choice when sounds are off', async () => {
    setSoundsEnabled(false);
    expect(store.get('ui-sounds')).toBe('0');
    playSound('complete');
    await settle();
    expect(play).not.toHaveBeenCalled();
  });

  it('ignores a failure in the audio library', async () => {
    play.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    expect(() => playSound('complete')).not.toThrow();
    await settle();
  });
});
