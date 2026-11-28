import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { PhosphorTransactionIcon, type PhosphorTransactionIconName } from './PhosphorTransactionIcon';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { formatNaira, formatSignedNaira } from '@/src/utils/money';
import { formatDate } from '@/src/utils/dates';
import { statusLabel, transactionTitle, transactionSubtitle } from '@/src/utils/format';
import { StatusBadge } from './StatusBadge';
import type { Transaction } from '@/src/types/models';

export function TransactionRow({
  transaction,
  onPress,
  currency = 'NGN',
  compact = false
}: {
  transaction: Transaction;
  onPress?: () => void;
  currency?: string;
  compact?: boolean;
}) {
  const theme = useAppTheme();
  const isCredit = transaction.direction === 'credit' || transaction.transactionType === 'deposit';
  const isPending = transaction.status === 'pending_confirmation';
  const isUnsuccessful = transaction.status === 'failed' || transaction.status === 'cancelled';
  const iconName: PhosphorTransactionIconName = isPending
    ? 'pending'
    : isUnsuccessful
      ? 'unsuccessful'
      : transaction.transactionType === 'deposit'
        ? 'deposit'
        : transaction.transactionType === 'withdrawal'
          ? 'withdrawal'
          : isCredit
            ? 'receive'
            : 'send';
  const palette = isPending
    ? { bg: theme.colors.warningSurface, fg: theme.colors.warning, border: theme.colors.warning }
    : isUnsuccessful
      ? { bg: theme.colors.errorSurface, fg: theme.colors.error, border: theme.colors.error }
      : isCredit
        ? { bg: theme.colors.successSurface, fg: theme.colors.success, border: theme.colors.success }
        : { bg: theme.colors.primaryLight, fg: theme.colors.primaryDark, border: theme.colors.primary };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${transactionTitle(transaction)}, ${formatNaira(transaction.amount, currency)}, ${transactionSubtitle(transaction)}, ${statusLabel(transaction.status)}, ${formatDate(transaction.createdAt)}`}
      android_ripple={{ color: theme.colors.primaryLight }}
      style={({ pressed }) => [styles.row, compact && styles.rowCompact, { opacity: onPress && pressed ? 0.82 : 1 }]}
    >
      <View
        style={[
          styles.iconWrap,
          compact && styles.iconWrapCompact,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            shadowColor: theme.colors.text,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2
          }
        ]}
      >
        <PhosphorTransactionIcon name={iconName} size={compact ? 22 : 26} color={palette.fg} />
      </View>
      <View style={styles.copy}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.body }]} numberOfLines={1}>
            {transactionTitle(transaction)}
          </Text>
          <Text
            style={[styles.amount, { color: isCredit ? theme.colors.success : theme.colors.text, fontSize: theme.typography.body }]}
            numberOfLines={1}
          >
            {formatSignedNaira(transaction.amount, transaction.direction ?? (isCredit ? 'credit' : 'debit'), currency)}
          </Text>
        </View>
        {!compact ? (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]} numberOfLines={1}>
            {transactionSubtitle(transaction)}
          </Text>
        ) : null}
        <View style={[styles.meta, compact && styles.metaCompact]}>
          <Text style={[styles.date, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
            {formatDate(transaction.createdAt)}
          </Text>
          {!compact ? <StatusBadge status={transaction.status} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 16, minHeight: 92 },
  rowCompact: { paddingVertical: 14, minHeight: 72 },
  iconWrap: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrapCompact: { width: 40, height: 40, borderRadius: 14 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontWeight: '600' },
  subtitle: {},
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  metaCompact: { marginTop: 0 },
  date: {},
  amount: { fontWeight: '600', textAlign: 'right', maxWidth: 132, flexShrink: 0 }
});
