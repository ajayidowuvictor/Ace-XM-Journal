"""Makes the three soft sounds in assets/sounds. Run: python3 scripts/make_sounds.py

Plain sine notes with a quick fade-in and a smooth fade-out (no clicks), 44.1 kHz, 16-bit, mono.
  complete.wav  two quick rising notes, played when a task or habit is finished
  unlock.wav    one short soft note, played when the app unlocks
  chime.wav     three gentle rising notes, used as the reminder notification sound
"""

import math
import struct
import wave

RATE = 44100


def note(freq, start, length, peak, decay):
    """A sine note (with a quiet second harmonic) that starts at `start` seconds."""
    samples = {}
    count = int(length * RATE)
    for i in range(count):
        t = i / RATE
        attack = min(1.0, t / 0.006)
        release = min(1.0, (length - t) / 0.03)
        env = attack * release * math.exp(-t / decay)
        value = math.sin(2 * math.pi * freq * t) + 0.18 * math.sin(2 * math.pi * freq * 2 * t)
        samples[int(start * RATE) + i] = peak * env * value
    return samples


def mix(notes, total):
    out = [0.0] * int(total * RATE)
    for n in notes:
        for index, value in n.items():
            if index < len(out):
                out[index] += value
    return out


def write(path, data, ceiling=0.6):
    top = max(abs(v) for v in data) or 1.0
    scale = min(1.0, ceiling / top)  # never louder than 60% of full scale
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(v * scale * 32767)) for v in data))


G5, C6, E6 = 783.99, 1046.50, 1318.51
C5, E5 = 523.25, 659.25

write("assets/sounds/complete.wav", mix([note(G5, 0.0, 0.40, 0.45, 0.11), note(C6, 0.09, 0.45, 0.40, 0.13)], 0.55))
write("assets/sounds/unlock.wav", mix([note(C6, 0.0, 0.30, 0.30, 0.09)], 0.32))
write("assets/sounds/chime.wav", mix([note(C5, 0.0, 0.7, 0.55, 0.22), note(E5, 0.18, 0.7, 0.5, 0.22), note(G5, 0.36, 0.9, 0.5, 0.28)], 1.3))
