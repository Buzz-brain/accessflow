import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  featured?: boolean;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const columns = 4;
  const gap = 10;
  const actionWidth = containerWidth > 0 ? (containerWidth - gap * (columns - 1)) / columns : '100%';

  return (
    <View style={styles.row} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          android_ripple={{ color: action.featured ? 'rgba(255,255,255,0.22)' : theme.colors.primaryLight, borderless: true }}
          style={({ pressed }) => [
            styles.action,
            theme.shadows.card,
            {
              width: actionWidth,
              backgroundColor: action.featured ? theme.colors.primary : theme.colors.surface,
              borderColor: action.featured ? theme.colors.primary : theme.colors.border,
              opacity: pressed ? 0.82 : 1
            }
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: action.featured ? 'rgba(255,255,255,0.2)' : theme.colors.primaryLight }
            ]}
          >
            <action.icon
              size={21}
              color={action.featured ? theme.colors.textOnPrimary : theme.colors.primary}
              strokeWidth={2.1}
            />
          </View>
          <Text
            style={[
              styles.label,
              { color: action.featured ? theme.colors.textOnPrimary : theme.colors.text }
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { minWidth: 0, minHeight: 110, borderRadius: 24, borderWidth: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', textAlign: 'center' }
});
