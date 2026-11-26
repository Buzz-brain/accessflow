import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePreferences } from '@/src/features/accessibility/context/PreferencesContext';
import { useThemeMode } from './ThemeModeContext';
import { createTheme } from './tokens';
import type { Theme } from '@/src/types/theme';

const AppThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  const { preferences } = usePreferences();
  const theme = useMemo(
    () => createTheme(mode, preferences.highContrastEnabled, preferences.textScale),
    [mode, preferences.highContrastEnabled, preferences.textScale]
  );

  return <AppThemeContext.Provider value={theme}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);
  if (!theme) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return theme;
}
