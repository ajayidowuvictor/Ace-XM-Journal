import { Platform } from 'react-native';

/**
 * Ace Notes design tokens.
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
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EBEBEF',
  thumb: '#FFFFFF',
  text: '#1D1D1F',
  textMuted: '#5F6168',
  primary: brand.navy,
  onPrimary: '#FFFFFF',
  primaryTint: '#E8EAF6',
  success: '#1B6E25',
  successTint: '#E2F2E3',
  danger: '#C41A20',
  dangerTint: '#FBE6E7',
  onDanger: '#FFFFFF',
  border: '#E3E3E8',
};

export const darkColors: ColorTokens = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceMuted: '#2C2C2E',
  thumb: '#48484A',
  text: '#F5F5F7',
  textMuted: '#A1A1A6',
  primary: '#9AA4F0',
  onPrimary: '#000000',
  primaryTint: '#262B52',
  success: brand.green,
  successTint: '#173222',
  danger: '#FF6B70',
  dangerTint: '#3A1A20',
  onDanger: '#000000',
  border: '#38383A',
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
  /** Text fields and the segmented control. Buttons are pills. */
  control: 16,
  /** Cards. */
  lg: 24,
  /** Hero cards and sheets. */
  xl: 32,
  pill: 999,
} as const;

/** Screen-level layout numbers. */
export const layout = {
  gutter: 24,
  cardPadding: 24,
  maxWidth: 720,
} as const;

/** Inter, loaded in the root layout (see src/theme/useAppFonts.ts). */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** The phone's own serif font. Used only for the reading view of verses and long texts. */
export const readingFont: string = Platform.select({ ios: 'Georgia', default: 'serif' });

export const typography = {
  largeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.1,
  },
  title: { fontFamily: fonts.semibold, fontSize: 30, lineHeight: 36, letterSpacing: -0.8 },
  heading: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25, letterSpacing: -0.1 },
  secondary: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
} as const;

/**
 * Cards are flat tiles: the white (or lifted black) surface against the page colour does the
 * work, as on apple.com. Only the raised "thumb" of a selected segment keeps a small shadow.
 */
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  thumb: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

/** Press feedback: a quick, small squeeze (never a fade). */
export const motion = {
  pressScale: 0.98,
  spring: { speed: 36, bounciness: 4 },
} as const;

/** Minimum touch target size in points (accessibility). */
export const minTouchTarget = 44;

/** The dim layer behind dialogs and sheets. */
export const scrim = 'rgba(0, 0, 0, 0.5)';

/**
 * How far the phone's "text size" setting may enlarge text. Normal text grows up to 1.8 times so
 * large text stays readable without breaking the layout. Symbols inside small fixed circles and
 * boxes grow only a little so they stay inside.
 */
export const maxFontScale = { normal: 1.8, glyph: 1.2 } as const;
