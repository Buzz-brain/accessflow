import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { TransactionStatus } from '@/src/types/models';
import { statusLabel } from '@/src/utils/format';

const statuses: Record<TransactionStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  initiated: 'info',
  pending_confirmation: 'warning',
  confirmed: 'info',
  processing: 'info',
  successful: 'success',
  failed: 'error',
  cancelled: 'neutral'
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const theme = useAppTheme();
  const tone = statuses[status] ?? 'neutral';
  const palette = {
    success: { bg: theme.colors.successSurface, fg: theme.colors.success },
    warning: { bg: theme.colors.warningSurface, fg: theme.colors.warning },
    error: { bg: theme.colors.errorSurface, fg: theme.colors.error },
    info: { bg: theme.colors.infoSurface, fg: theme.colors.info },
    neutral: { bg: theme.colors.surfaceMuted, fg: theme.colors.textSecondary }
  }[tone];

  return (
    <View
      style={[styles.badge, { backgroundColor: palette.bg }]}
      accessible
      accessibilityLabel={`Status: ${statusLabel(status)}`}
    >
      <Text style={[styles.text, { color: palette.fg, fontSize: theme.typography.caption }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontWeight: '600' }
});
