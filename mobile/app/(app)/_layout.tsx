import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Accessibility, ArrowLeftRight, House, ReceiptText, UserRound } from 'lucide-react-native';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { SplashScreen } from '@/src/screens/SplashScreen';

export default function AppTabLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { status } = useAuth();

  if (status === 'bootstrapping') return <SplashScreen />;
  if (status === 'signedOut') return <Redirect href="/login" />;

  const iconColor = (focused: boolean) => (focused ? theme.colors.primary : theme.colors.textSecondary);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          elevation: 0
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'IBMPlexSans_600SemiBold',
          marginTop: 3
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarHideOnKeyboard: true
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => <House size={22} color={iconColor(focused)} strokeWidth={focused ? 2.5 : 2} />
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarAccessibilityLabel: 'Transactions tab',
          tabBarIcon: ({ color, focused }) => <ReceiptText size={22} color={iconColor(focused)} strokeWidth={focused ? 2.5 : 2} />
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: 'Transfer',
          tabBarAccessibilityLabel: 'Transfer money tab',
          tabBarIcon: ({ color, focused }) => <ArrowLeftRight size={22} color={iconColor(focused)} strokeWidth={focused ? 2.5 : 2} />
        }}
      />
      <Tabs.Screen
        name="accessibility"
        options={{
          title: 'Accessibility',
          tabBarAccessibilityLabel: 'Accessibility centre tab',
          tabBarIcon: ({ color, focused }) => <Accessibility size={22} color={iconColor(focused)} strokeWidth={focused ? 2.5 : 2} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ color, focused }) => <UserRound size={22} color={iconColor(focused)} strokeWidth={focused ? 2.5 : 2} />
        }}
      />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}
