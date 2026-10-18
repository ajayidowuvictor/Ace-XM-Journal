import { PREF_KEYS, readPreference, writePreference } from './preferences';

/** True unless the person turned sounds off. Only an explicit "0" turns them off. */
export function parseSoundsEnabled(value: string | null): boolean {
  return value !== '0';
}

let enabled: boolean | null = null;

export function soundsEnabled(): boolean {
  if (enabled === null) {
    try {
      enabled = parseSoundsEnabled(readPreference(PREF_KEYS.sounds));
    } catch {
      return true;
    }
  }
  return enabled;
}

export function setSoundsEnabled(value: boolean): void {
  enabled = value;
  try {
    writePreference(PREF_KEYS.sounds, value ? '1' : '0');
  } catch {
    // The choice still applies until the app closes.
  }
}

type Player = { seekTo: (seconds: number) => Promise<void>; play: () => void; volume: number };

const SOUNDS = {
  complete: require('../../assets/sounds/complete.wav'),
  unlock: require('../../assets/sounds/unlock.wav'),
} as const;

export type SoundName = keyof typeof SOUNDS;

const players = new Map<SoundName, Player>();
let modeSet = false;

/**
 * Plays a short, soft sound. It never throws, does nothing when sounds are off, and follows the
 * phone's silent mode and volume. The audio library is loaded only when a sound is first needed.
 */
export function playSound(name: SoundName): void {
  if (!soundsEnabled()) return;
  void (async () => {
    try {
      const audio = await import('expo-audio');
      if (!modeSet) {
        modeSet = true;
        await audio.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
      }
      let player = players.get(name);
      if (!player) {
        player = audio.createAudioPlayer(SOUNDS[name]) as Player;
        player.volume = 0.7;
        players.set(name, player);
      }
      await player.seekTo(0);
      player.play();
    } catch {
      // Sound is a nicety; ignore any failure.
    }
  })();
}
