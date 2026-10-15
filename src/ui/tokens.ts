/**
 * ACE XM JOURNAL design tokens.
 * Brand colours are sampled from the owner's logo (see docs/BRAND.md); docs/DESIGN.md explains the look.
 * Text pairs below are checked for WCAG AA contrast (4.5:1) in tokens.test.ts.
 */

export const brand = {
  navy: '#2D3684',
  green: '#43B54B',
  red: '#E92026',
  charcoal: '#474444',
} as const;

export type ColorTokens = {
  /** Screen background. */
  background: string;
  /** Cards and sheets that sit on the background. */
  surface: string;
  /** Quiet inset areas inside a card, such as text fields and segmented-control tracks. */
  surfaceMuted: string;
  /** The raised "thumb" of a selected segment. */
  thumb: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  /** Soft background behind primary-coloured text (tonal buttons, selected chips). */
  primaryTint: string;
  success: string;
  successTint: string;
  danger: string;
  dangerTint: string;
  onDanger: string;
  border: string;
};

export const lightColors: ColorTokens = {
  background: '#F4F5FA',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF6',
  thumb: '#FFFFFF',
  text: '#12152B',
  textMuted: '#565B75',
  primary: brand.navy,
  onPrimary: '#FFFFFF',
  primaryTint: '#E6E9F8',
  success: '#1B6E25',
  successTint: '#E2F2E3',
  danger: '#C41A20',
  dangerTint: '#FBE6E7',
  onDanger: '#FFFFFF',
  border: '#E1E3EE',
};

export const darkColors: ColorTokens = {
  background: '#0B0D17',
  surface: '#151829',
  surfaceMuted: '#1E2238',
  thumb: '#303656',
  text: '#F2F3F9',
  textMuted: '#A9ADC4',
  primary: '#8E98E6',
  onPrimary: '#0B0D17',
  primaryTint: '#242A52',
  success: brand.green,
  successTint: '#173222',
  danger: '#FF6B70',
  dangerTint: '#3A1A20',
  onDanger: '#0B0D17',
  border: '#262B45',
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
  sm: 10,
  md: 14,
  /** Buttons and text fields. */
  control: 16,
  lg: 20,
  /** Hero cards and sheets. */
  xl: 28,
  pill: 999,
} as const;

/** Screen-level layout numbers. */
export const layout = {
  gutter: 20,
  cardPadding: 20,
  maxWidth: 720,
} as const;

/** Inter, loaded in the root layout (see src/theme/useAppFonts.ts). */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  largeTitle: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.7,
  },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25 },
  secondary: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
} as const;

/** Soft, navy-tinted shadows. Dark mode uses hairline borders instead (see Card). */
export const shadows = {
  card: {
    shadowColor: '#1B2150',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  thumb: {
    shadowColor: '#1B2150',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
} as const;

/** Press feedback: a quick, small squeeze (never a fade). */
export const motion = {
  pressScale: 0.97,
  spring: { speed: 40, bounciness: 6 },
} as const;

/** Minimum touch target size in points (accessibility). */
export const minTouchTarget = 44;
