import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const columns = 4;
  const gap = 8;
  const actionWidth = containerWidth > 0 ? (containerWidth - gap * (columns - 1)) / columns : '100%';

  return (
    <View style={styles.row} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          android_ripple={{ color: theme.colors.primaryLight, borderless: true }}
          style={({ pressed }) => [
            styles.action,
            {
              width: actionWidth,
              opacity: pressed ? 0.82 : 1
            }
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentSurface }]}>
            <action.icon size={21} color={theme.colors.primary} strokeWidth={2.1} />
          </View>
          <Text style={[styles.label, { color: theme.colors.text }]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 6 },
  iconWrap: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' }
});
