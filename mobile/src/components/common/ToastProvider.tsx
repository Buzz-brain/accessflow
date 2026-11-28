import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { CircleCheck, CircleX, Info } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { FeedbackType } from '@/src/types/api';

interface ToastState {
  id: number;
  message: string;
  type: FeedbackType;
}

interface ToastContextValue {
  showToast: (message: string, type?: FeedbackType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useSharedValue(-140);
  const opacity = useSharedValue(0);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-140, { duration: 180 });
    opacity.value = withTiming(0, { duration: 180 });
    setTimeout(() => setToast(null), 190);
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, type: FeedbackType = 'info') => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ id: Date.now(), message, type });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 180 });
      timeoutRef.current = setTimeout(hideToast, 3400);
    },
    [hideToast, opacity, translateY]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value
  }));

  const colors = {
    success: { bg: theme.colors.successSurface, fg: theme.colors.success, Icon: CircleCheck },
    error: { bg: theme.colors.errorSurface, fg: theme.colors.error, Icon: CircleX },
    info: { bg: theme.colors.infoSurface, fg: theme.colors.info, Icon: Info }
  };
  const active = toast ? colors[toast.type] : colors.info;

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          style={[
            styles.container,
            animatedStyle,
            {
              top: insets.top + 12,
              backgroundColor: active.bg,
              borderColor: active.fg
            }
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${toast.type} notification: ${toast.message}`}
        >
          <active.Icon size={20} color={active.fg} strokeWidth={2.4} />
          <Text style={[styles.message, { color: theme.colors.text }]}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600'
  }
});
