import { describe, expect, it } from '@jest/globals';

import { fromBase64, toBase64, utf8Decode, utf8Encode } from '../bytes';

describe('base64', () => {
  it('matches the standard encoding for known examples', () => {
    const cases: [string, string][] = [
      ['', ''],
      ['f', 'Zg=='],
      ['fo', 'Zm8='],
      ['foo', 'Zm9v'],
      ['foob', 'Zm9vYg=='],
      ['fooba', 'Zm9vYmE='],
      ['foobar', 'Zm9vYmFy'],
    ];
    for (const [text, encoded] of cases) {
      expect(toBase64(utf8Encode(text))).toBe(encoded);
      expect(utf8Decode(fromBase64(encoded) as Uint8Array)).toBe(text);
    }
  });

  it('agrees with Node for random bytes of every length', () => {
    for (let length = 0; length < 70; length += 1) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + length * 11) % 256);
      const expected = Buffer.from(bytes).toString('base64');
      expect(toBase64(bytes)).toBe(expected);
      expect(Array.from(fromBase64(expected) as Uint8Array)).toEqual(Array.from(bytes));
    }
  });

  it('rejects text that is not base64', () => {
    expect(fromBase64('abc')).toBeNull();
    expect(fromBase64('ab*d')).toBeNull();
    expect(fromBase64('=abc')).toBeNull();
    expect(fromBase64('a===')).toBeNull();
  });
});

describe('UTF-8', () => {
  const samples = [
    '',
    'plain ascii',
    'café über',
    'Yorùbá: ọ̀gọ̀nà',
    '€100 — “quote”',
    '🙏 emoji 📖',
    'line one\nline two\r\n',
  ];

  it('round-trips text and agrees with Node', () => {
    for (const text of samples) {
      const bytes = utf8Encode(text);
      expect(Array.from(bytes)).toEqual(Array.from(Buffer.from(text, 'utf8')));
      expect(utf8Decode(bytes)).toBe(text);
    }
  });

  it('handles a very large text', () => {
    const text = 'Paragraph é🙏. '.repeat(20000);
    expect(utf8Decode(utf8Encode(text))).toBe(text);
  });

  it('rejects bytes that are not valid UTF-8', () => {
    expect(utf8Decode(Uint8Array.from([0xff]))).toBeNull();
    expect(utf8Decode(Uint8Array.from([0xc3]))).toBeNull();
    expect(utf8Decode(Uint8Array.from([0xe2, 0x82]))).toBeNull();
    expect(utf8Decode(Uint8Array.from([0xc3, 0x28]))).toBeNull();
    expect(utf8Decode(Uint8Array.from([0xed, 0xa0, 0x80]))).toBeNull();
  });
});
