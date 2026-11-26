import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Landmark, Repeat2 } from 'lucide-react-native';
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
  const Icon =
    transaction.transactionType === 'deposit'
      ? Landmark
      : transaction.transactionType === 'withdrawal'
        ? ArrowUpRight
        : isCredit
          ? ArrowDownLeft
          : Repeat2;
  const toneBg = isCredit ? theme.colors.successSurface : theme.colors.surfaceMuted;
  const toneFg = isCredit ? theme.colors.success : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${transactionTitle(transaction)}, ${formatNaira(transaction.amount, currency)}, ${statusLabel(transaction.status)}, ${formatDate(transaction.createdAt)}`}
      android_ripple={{ color: theme.colors.primaryLight }}
      style={({ pressed }) => [styles.row, compact && styles.rowCompact, { opacity: onPress && pressed ? 0.82 : 1 }]}
    >
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact, { backgroundColor: toneBg }]}>
        <Icon size={20} color={toneFg} strokeWidth={2.1} />
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
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconWrapCompact: { width: 38, height: 38, borderRadius: 13 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontWeight: '600' },
  subtitle: {},
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  metaCompact: { marginTop: 0 },
  date: {},
  amount: { fontWeight: '600', textAlign: 'right', maxWidth: 132, flexShrink: 0 }
});
