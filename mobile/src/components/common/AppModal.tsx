import { useCallback, useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { IconButton } from './IconButton';

interface AppModalProps {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  closable?: boolean;
}

export function AppModal({ visible, title, description, children, onClose, closable = true }: AppModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(420);
  const backdrop = useSharedValue(0);

  const animateIn = useCallback(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 240 });
    backdrop.value = withTiming(1, { duration: 180 });
  }, [backdrop, translateY]);

  const animateOut = useCallback(() => {
    translateY.value = withTiming(420, { duration: 170 });
    backdrop.value = withTiming(0, { duration: 150 });
  }, [backdrop, translateY]);

  useEffect(() => {
    if (visible) animateIn();
    else animateOut();
  }, [visible, animateIn, animateOut]);

  const requestClose = useCallback(() => {
    if (!closable) return;
    animateOut();
    setTimeout(onClose, 180);
  }, [animateOut, closable, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none" onRequestClose={requestClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle, { backgroundColor: theme.colors.overlay }]}>
          <Pressable style={styles.fill} onPress={requestClose} accessibilityLabel="Close dialog" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom + 20, 24)
            }
          ]}
          accessible
          accessibilityRole="dialog"
          accessibilityLabel={title}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              {description ? (
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>
              ) : null}
            </View>
            {closable ? <IconButton icon={X} label="Close" onPress={requestClose} variant="surface" size={38} /> : null}
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  fill: { flex: 1 },
  backdrop: { position: 'absolute', inset: 0 },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: '#D8E1DC', alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  heading: { flex: 1, gap: 5 },
  title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  description: { fontSize: 13, lineHeight: 18 }
});
