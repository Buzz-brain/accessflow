import type { Theme, ThemeColors, ThemeMode } from '@/src/types/theme';

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
const radius = { small: 10, input: 14, card: 20, feature: 28, sheet: 32, pill: 999 };

const lightColors: ThemeColors = {
  primary: '#009E60',
  primaryDark: '#006B48',
  primaryLight: '#E9F6EF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F4F7F5',
  text: '#101B16',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  border: '#E7EEEA',
  success: '#10B981',
  successSurface: '#ECFDF5',
  warning: '#7A4B00',
  warningSurface: '#FFF3DC',
  error: '#EF4444',
  errorSurface: '#FEF2F2',
  info: '#1F5FA8',
  infoSurface: '#EAF2FD',
  overlay: 'rgba(0, 30, 16, 0.5)',
  skeleton: '#E7EEEA'
};

const darkColors: ThemeColors = {
  primary: '#2BC48A',
  primaryDark: '#087F5B',
  primaryLight: '#123B2E',
  background: '#0F1712',
  surface: '#19231E',
  surfaceElevated: '#223029',
  surfaceMuted: '#202C26',
  text: '#F4F8F6',
  textSecondary: '#A9BCB2',
  textOnPrimary: '#07120D',
  border: '#2D3C35',
  success: '#46D9A0',
  successSurface: '#153B2D',
  warning: '#F0B95C',
  warningSurface: '#433419',
  error: '#FF7A7A',
  errorSurface: '#462323',
  info: '#79ADF2',
  infoSurface: '#1B304A',
  overlay: 'rgba(0, 0, 0, 0.72)',
  skeleton: '#26332D'
};

const highContrastLight: Partial<ThemeColors> = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F2',
  text: '#000000',
  textSecondary: '#1D2A25',
  border: '#17211D',
  primary: '#005C40',
  primaryDark: '#003D2B',
  primaryLight: '#E4F3EC',
  success: '#005C40',
  successSurface: '#E6F6EE',
  error: '#B00020',
  errorSurface: '#FDEBEC',
  info: '#004A99',
  infoSurface: '#EAF2FD',
  warning: '#7A4B00',
  warningSurface: '#FFF3DC'
};

const highContrastDark: Partial<ThemeColors> = {
  background: '#000000',
  surface: '#0B100D',
  surfaceMuted: '#151D18',
  text: '#FFFFFF',
  textSecondary: '#E6F5EF',
  border: '#FFFFFF',
  primary: '#5BFFC1',
  primaryDark: '#2BC48A',
  error: '#FF9C9C',
  info: '#A8D1FF',
  warning: '#FFD27A'
};

export function createTheme(mode: ThemeMode, highContrast: boolean, textScale: number): Theme {
  const base = mode === 'dark' ? darkColors : lightColors;
  const overrides = highContrast
    ? mode === 'dark'
      ? highContrastDark
      : highContrastLight
    : {};
  const scale = Math.max(1, Math.min(2, textScale));
  const fontFamily = 'IBMPlexSans_400Regular';

  return {
    mode,
    highContrast,
    colors: { ...base, ...overrides },
    typography: {
      display: Math.round(30 * scale),
      heading: Math.round(22 * scale),
      section: Math.round(17 * scale),
      body: Math.round(15 * scale),
      secondary: Math.round(13 * scale),
      caption: Math.round(11 * scale),
      financial: Math.round(30 * scale),
      financialLarge: Math.round(36 * scale),
      fontFamily,
      fontFamilyBold: 'IBMPlexSans_700Bold'
    },
    spacing,
    radius,
    shadows: {
      card: {
        shadowColor: mode === 'dark' ? '#000000' : '#12382B',
        shadowOpacity: mode === 'dark' ? 0.24 : 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4
      },
      raised: {
        shadowColor: mode === 'dark' ? '#000000' : '#12382B',
        shadowOpacity: mode === 'dark' ? 0.32 : 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8
      }
    }
  };
}
