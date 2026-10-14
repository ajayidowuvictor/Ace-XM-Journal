/**
 * ACE XM JOURNAL design tokens.
 * Brand colours are sampled from the owner's logo (see docs/BRAND.md).
 * Text pairs below are checked for WCAG AA contrast (4.5:1) in tokens.test.ts.
 */

export const brand = {
  navy: '#2D3684',
  green: '#43B54B',
  red: '#E92026',
  charcoal: '#474444',
} as const;

export type ColorTokens = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  success: string;
  danger: string;
  border: string;
};

export const lightColors: ColorTokens = {
  background: '#FAF9F7',
  surface: '#FFFFFF',
  text: '#1F1E1E',
  textMuted: '#5A5757',
  primary: brand.navy,
  onPrimary: '#FFFFFF',
  success: '#1F7A2A',
  danger: '#C41A20',
  border: '#E3E1DE',
};

export const darkColors: ColorTokens = {
  background: '#12141F',
  surface: '#1B1E2E',
  text: '#F2F2F5',
  textMuted: '#B4B6C4',
  primary: '#8E98E6',
  onPrimary: '#12141F',
  success: brand.green,
  danger: '#FF6B70',
  border: '#2C3045',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

/** Minimum touch target size in points (accessibility). */
export const minTouchTarget = 44;
