import { brand, darkColors, lightColors, type ColorTokens } from '../tokens';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('brand colours', () => {
  it('match the colours sampled from the logo', () => {
    expect(brand.navy).toBe('#2D3684');
    expect(brand.green).toBe('#43B54B');
    expect(brand.red).toBe('#E92026');
  });
});

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as [string, ColorTokens][])('%s theme text contrast (WCAG AA 4.5:1)', (_name, c) => {
  it.each([
    ['text on background', c.text, c.background],
    ['text on surface', c.text, c.surface],
    ['muted text on background', c.textMuted, c.background],
    ['primary on background', c.primary, c.background],
    ['onPrimary on primary', c.onPrimary, c.primary],
    ['success on background', c.success, c.background],
    ['danger on background', c.danger, c.background],
  ])('%s', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
