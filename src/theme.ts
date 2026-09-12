import { Platform } from 'react-native';

/** Warm, paper-like palette. Journal, not clinic. */
export const colors = {
  background: '#FBF7F1',
  card: '#FFFFFF',
  ink: '#2B2622',
  inkSoft: '#6F665F',
  inkFaint: '#A59C94',
  line: '#EAE2D8',
  accent: '#C9683F',
  accentSoft: '#F6E3D8',
  leaf: '#7C9A6E',
  leafSoft: '#E6EEE1',
  danger: '#B4483A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const fonts = {
  /** Serif headings give the journal feel. */
  heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#2B2622',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
  default: {},
});
