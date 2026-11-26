import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function Skeleton({ width = '100%', height = 14, radius = 8 }: { width?: number | string; height?: number; radius?: number }) {
  const theme = useAppTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.45, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.block,
        style,
        { width, height, borderRadius: radius, backgroundColor: theme.colors.skeleton }
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.stack}>
      <Skeleton width="58%" height={34} radius={12} />
      <Skeleton height={178} radius={26} />
      <View style={styles.row}>
        <Skeleton width="30%" height={72} radius={18} />
        <Skeleton width="30%" height={72} radius={18} />
        <Skeleton width="30%" height={72} radius={18} />
      </View>
      <Skeleton width="42%" height={18} />
      <Skeleton height={68} radius={16} />
      <Skeleton height={68} radius={16} />
    </View>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.listRow}>
          <Skeleton width={44} height={44} radius={14} />
          <View style={styles.listText}>
            <Skeleton width="62%" height={14} />
            <Skeleton width="40%" height={11} />
          </View>
          <Skeleton width={62} height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
  stack: { gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  listText: { flex: 1, gap: 8 }
});
