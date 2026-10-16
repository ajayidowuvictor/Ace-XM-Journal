const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i += 1) LOOKUP[ALPHABET[i]] = i;

/** Bytes as base64 text. Written out here so it does not depend on the phone's own helpers. */
export function toBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    parts.push(
      ALPHABET[(triple >> 18) & 63],
      ALPHABET[(triple >> 12) & 63],
      i + 1 < bytes.length ? ALPHABET[(triple >> 6) & 63] : '=',
      i + 2 < bytes.length ? ALPHABET[triple & 63] : '=',
    );
  }
  return parts.join('');
}

/** Base64 text back to bytes, or null if the text is not valid base64. */
export function fromBase64(text: string): Uint8Array | null {
  if (text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) return null;
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((text.length / 4) * 3 - padding);
  let out = 0;
  for (let i = 0; i < text.length; i += 4) {
    const c0 = LOOKUP[text[i]];
    const c1 = LOOKUP[text[i + 1]];
    const c2 = text[i + 2] === '=' ? 0 : LOOKUP[text[i + 2]];
    const c3 = text[i + 3] === '=' ? 0 : LOOKUP[text[i + 3]];
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (out < bytes.length) bytes[out++] = (triple >> 16) & 255;
    if (out < bytes.length) bytes[out++] = (triple >> 8) & 255;
    if (out < bytes.length) bytes[out++] = triple & 255;
  }
  return bytes;
}

/** Text as UTF-8 bytes (handles every character, including emoji). */
export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      }
    }
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    } else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
    }
  }
  return Uint8Array.from(out);
}

/** UTF-8 bytes back to text. Returns null if the bytes are not valid UTF-8. */
export function utf8Decode(bytes: Uint8Array): string | null {
  const chunks: string[] = [];
  let units: number[] = [];
  const flush = () => {
    if (units.length > 0) {
      chunks.push(String.fromCharCode(...units));
      units = [];
    }
  };

  let i = 0;
  while (i < bytes.length) {
    const first = bytes[i];
    let code: number;
    let extra: number;
    if (first < 0x80) {
      code = first;
      extra = 0;
    } else if (first >= 0xc2 && first < 0xe0) {
      code = first & 0x1f;
      extra = 1;
    } else if (first >= 0xe0 && first < 0xf0) {
      code = first & 0x0f;
      extra = 2;
    } else if (first >= 0xf0 && first < 0xf5) {
      code = first & 0x07;
      extra = 3;
    } else {
      return null;
    }
    for (let k = 1; k <= extra; k += 1) {
      const next = bytes[i + k];
      if (next === undefined || (next & 0xc0) !== 0x80) return null;
      code = (code << 6) | (next & 63);
    }
    i += extra + 1;
    if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return null;
    if (code >= 0x10000) {
      const shifted = code - 0x10000;
      units.push(0xd800 + (shifted >> 10), 0xdc00 + (shifted & 0x3ff));
    } else {
      units.push(code);
    }
    // Build the string in pieces so very large texts never overflow the argument limit.
    if (units.length >= 8192) flush();
  }
  flush();
  return chunks.join('');
}
