import { StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function NetworkBanner() {
  const { isOnline } = useNetworkStatus();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (isOnline !== false) return null;

  return (
    <View
      style={[styles.banner, { top: insets.top, backgroundColor: theme.colors.errorSurface }]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Network unavailable. Connect to the internet to use online banking features."
    >
      <WifiOff size={15} color={theme.colors.error} />
      <Text style={[styles.text, { color: theme.colors.error }]}>Offline — reconnect to continue</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', left: 12, right: 12, zIndex: 90, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 11, fontWeight: '600' }
});
