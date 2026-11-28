import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function SectionHeader({
  title,
  actionLabel,
  onAction
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.container} accessible accessibilityRole="header" accessibilityLabel={title}>
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.section }]}>{title}</Text>
      {onAction && actionLabel ? (
        <Pressable
          onPress={onAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.action}
        >
          <Text style={[styles.actionText, { color: theme.colors.primary, fontSize: theme.typography.secondary }]}>
            {actionLabel}
          </Text>
          <ChevronRight size={16} color={theme.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  title: { fontWeight: '600', letterSpacing: -0.2, flexShrink: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingLeft: 12 },
  actionText: { fontWeight: '600' }
});
