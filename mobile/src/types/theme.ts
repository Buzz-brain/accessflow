export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accentSurface: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  error: string;
  errorSurface: string;
  info: string;
  infoSurface: string;
  overlay: string;
  skeleton: string;
}

export interface ThemeTypography {
  display: number;
  heading: number;
  section: number;
  body: number;
  secondary: number;
  caption: number;
  financial: number;
  financialLarge: number;
  fontFamily: string;
  fontFamilyBold: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeRadius {
  small: number;
  input: number;
  card: number;
  feature: number;
  sheet: number;
  pill: number;
}

export interface Theme {
  mode: ThemeMode;
  highContrast: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: {
    card: { shadowColor: string; shadowOpacity: number; shadowRadius: number; shadowOffset: { width: number; height: number }; elevation: number };
    raised: { shadowColor: string; shadowOpacity: number; shadowRadius: number; shadowOffset: { width: number; height: number }; elevation: number };
  };
}
