import { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { BrandMark } from '@/src/components/common/BrandMark';
import { scaleFontSize } from '@/src/components/common/AppText';

export function SplashScreen() {
  const theme = useAppTheme();

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    return () => {
      StatusBar.setBarStyle('dark-content');
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.primary }]} accessible accessibilityLabel="AccessFlow, Banking without barriers">
      <View style={styles.orbA} />
      <View style={styles.orbB} />
      <Animated.View entering={ZoomIn.duration(700).damping(16)} style={styles.mark}>
        <View style={[styles.markDisc, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
          <BrandMark size={92} />
        </View>
      </Animated.View>
      <Animated.Text entering={FadeInUp.delay(280).duration(600)} style={styles.wordmark}>
        AccessFlow
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(420).duration(600)} style={styles.tagline}>
        Banking without barriers.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbA: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(255,255,255,0.06)', top: -120, right: -130 },
  orbB: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(91,255,193,0.14)', bottom: -120, left: -100 },
  mark: { marginBottom: 28 },
  markDisc: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  wordmark: { color: '#FFFFFF', fontSize: scaleFontSize(30), fontWeight: '700', letterSpacing: -0.8, fontFamily: 'Poppins_700Bold' },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: scaleFontSize(15), marginTop: 10, fontFamily: 'Poppins_400Regular' }
});
