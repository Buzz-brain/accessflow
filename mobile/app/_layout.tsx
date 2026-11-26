import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useFonts, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/src/features/auth/context/AuthContext';
import { PreferencesProvider } from '@/src/features/accessibility/context/PreferencesContext';
import { FeedbackProvider } from '@/src/services/feedback/FeedbackProvider';
import { ThemeModeProvider, useThemeMode } from '@/src/theme/ThemeModeContext';
import { AppThemeProvider, useAppTheme } from '@/src/theme/ThemeProvider';
import { ToastProvider } from '@/src/components/common/ToastProvider';
import { NetworkBanner } from '@/src/components/common/NetworkBanner';
import { SessionExpiredDialog } from '@/src/components/common/SessionExpiredDialog';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppRuntime({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status, sessionExpired } = useAuth();
  const { ready: themeReady } = useThemeMode();
  const theme = useAppTheme();

  useEffect(() => {
    if (fontsLoaded && themeReady && status !== 'bootstrapping') {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, themeReady, status]);

  useEffect(() => {
    StatusBar.setBarStyle(theme.mode === 'dark' ? 'light-content' : 'dark-content');
  }, [theme.mode]);

  return (
    <>
      <NetworkBanner />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      <SessionExpiredDialog visible={sessionExpired} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeModeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <AppThemeProvider>
                <FeedbackProvider>
                  <ToastProvider>
                    <AppRuntime fontsLoaded={fontsLoaded} />
                  </ToastProvider>
                </FeedbackProvider>
              </AppThemeProvider>
            </PreferencesProvider>
          </AuthProvider>
        </ThemeModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
