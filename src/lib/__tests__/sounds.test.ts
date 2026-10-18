import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { parseSoundsEnabled, playSound, setSoundsEnabled } from '../sounds';

const mockPlay = jest.fn(() => undefined);
const mockSeekTo = jest.fn((_seconds: number) => Promise.resolve());
const mockCreateAudioPlayer = jest.fn((_source: unknown) => ({
  play: () => mockPlay(),
  seekTo: (seconds: number) => mockSeekTo(seconds),
  volume: 1,
}));
const mockSetAudioModeAsync = jest.fn((_mode: unknown) => Promise.resolve());

jest.mock('expo-audio', () => ({
  createAudioPlayer: (source: unknown) => mockCreateAudioPlayer(source),
  setAudioModeAsync: (mode: unknown) => mockSetAudioModeAsync(mode),
}));

const mockStore = new Map<string, string>();
jest.mock('../preferences', () => ({
  PREF_KEYS: { sounds: 'ui-sounds' },
  readPreference: (key: string) => mockStore.get(key) ?? null,
  writePreference: (key: string, value: string) => {
    mockStore.set(key, value);
  },
}));

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
    mockPlay.mockClear();
    mockSeekTo.mockClear();
    mockCreateAudioPlayer.mockClear();
    mockStore.clear();
    setSoundsEnabled(true);
  });

  it('plays the sound from the start when sounds are on', async () => {
    playSound('complete');
    await settle();
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
    expect(mockSeekTo).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it('reuses the player for the same sound', async () => {
    playSound('unlock');
    await settle();
    playSound('unlock');
    await settle();
    expect(mockPlay).toHaveBeenCalledTimes(2);
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it('stays silent and saves the choice when sounds are off', async () => {
    setSoundsEnabled(false);
    expect(mockStore.get('ui-sounds')).toBe('0');
    playSound('complete');
    await settle();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('ignores a failure in the audio library', async () => {
    mockPlay.mockImplementationOnce(() => {
      throw new Error('no audio');
    });
    expect(() => playSound('complete')).not.toThrow();
    await settle();
  });
});
