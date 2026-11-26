import { Redirect } from 'expo-router';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { SplashScreen } from '@/src/screens/SplashScreen';

export default function IndexRoute() {
  const { status } = useAuth();
  const { completed } = useOnboarding();

  if (status === 'bootstrapping' || completed === null) {
    return <SplashScreen />;
  }

  if (!completed) return <Redirect href="/onboarding" />;
  if (status === 'signedIn') return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
