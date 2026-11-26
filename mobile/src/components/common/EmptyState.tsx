import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.container} accessible accessibilityRole="text" accessibilityLabel={`${title}. ${message}`}>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
          <Icon size={28} color={theme.colors.primary} strokeWidth={1.9} />
        </View>
      ) : null}
      <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.section }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary, fontSize: theme.typography.body }]}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 42, paddingHorizontal: 24 },
  iconWrap: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontWeight: '600', textAlign: 'center' },
  message: { lineHeight: 20, textAlign: 'center', marginTop: 8 },
  action: { marginTop: 18, width: '100%', alignItems: 'center' }
});
