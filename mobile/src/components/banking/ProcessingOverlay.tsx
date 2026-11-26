import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { BrandMark } from '@/src/components/common/BrandMark';

export function ProcessingOverlay({ visible, message = 'Processing your transfer securely' }: { visible: boolean; message?: string }) {
  const theme = useAppTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 850 }), withTiming(1, { duration: 850 })),
      -1,
      false
    );
  }, [scale, visible]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={[styles.root, { backgroundColor: theme.colors.overlay }]} accessible accessibilityRole="alert" accessibilityLabel={message}>
        <Animated.View style={animatedStyle}>
          <BrandMark size={84} />
        </Animated.View>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>{message}</Text>
        <Text style={styles.subtitle}>Please keep the app open. Do not submit the transfer again.</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 },
  title: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, textAlign: 'center', lineHeight: 19 }
});
