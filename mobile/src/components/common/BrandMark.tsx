import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface BrandMarkProps {
  size?: number;
  monochrome?: boolean;
}

export function BrandMark({ size = 48, monochrome = false }: BrandMarkProps) {
  const theme = useAppTheme();
  const background = monochrome ? 'transparent' : theme.colors.primary;
  const foreground = monochrome ? theme.colors.primary : theme.colors.textOnPrimary;

  return (
    <View
      style={[styles.mark, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}
      accessible
      accessibilityLabel="AccessFlow logo"
    >
      <View style={[styles.ring, { borderColor: monochrome ? theme.colors.primary : theme.colors.primaryLight }]} />
      <Text style={[styles.letters, { color: foreground, fontSize: Math.min(size * 0.3, 28) }]}>AF</Text>
      <View style={[styles.flow, { backgroundColor: monochrome ? theme.colors.primary : theme.colors.primaryLight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: '76%', height: '76%', borderRadius: 999, borderWidth: 1.5, opacity: 0.72 },
  letters: { fontWeight: '700', letterSpacing: -1, zIndex: 2 },
  flow: { position: 'absolute', bottom: '19%', width: '34%', height: 2.5, borderRadius: 2 }
});
