import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, CircleDollarSign, Info, Landmark, RefreshCw } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { Button } from '@/src/components/common/Button';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { StatusBadge } from '@/src/components/banking/StatusBadge';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { getTransaction } from '@/src/features/transactions/services/transaction.service';
import { toApiError } from '@/src/api/client';
import { formatDateTime } from '@/src/utils/dates';
import { formatNaira, formatSignedNaira } from '@/src/utils/money';
import { statusLabel, transactionTitle } from '@/src/utils/format';
import type { Transaction } from '@/src/types/models';

export default function TransactionDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getTransaction(id);
      setTransaction(response.data ?? null);
    } catch (loadError) {
      setError(toApiError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const isCredit = transaction
    ? transaction.direction === 'credit' || transaction.transactionType === 'deposit'
    : false;

  const rows = transaction
    ? [
        { label: 'Reference', value: transaction.reference, icon: CircleDollarSign },
        { label: 'Type', value: transaction.transactionType, icon: RefreshCw },
        { label: 'Status', value: statusLabel(transaction.status), icon: Info },
        { label: 'Description', value: transaction.narration, icon: Info },
        { label: 'Created', value: formatDateTime(transaction.createdAt), icon: CalendarDays },
        {
          label: 'Confirmed',
          value: transaction.confirmedAt ? formatDateTime(transaction.confirmedAt) : 'Not applicable',
          icon: CalendarDays
        },
        {
          label: 'Balance before',
          value: transaction.previousBalanceKobo === null ? '—' : formatNaira(transaction.previousBalance ?? 0),
          icon: Landmark
        },
        {
          label: 'Balance after',
          value: transaction.newBalanceKobo === null ? '—' : formatNaira(transaction.newBalance ?? 0),
          icon: Landmark
        },
        ...(transaction.failureReason ? [{ label: 'Failure reason', value: transaction.failureReason, icon: Info }] : [])
      ]
    : [];

  return (
    <Screen scroll={false} edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Transaction details" subtitle="Complete record from AccessFlow" showBack />
        {loading ? (
          <View style={styles.skeletonStack}>
            <Skeleton height={112} radius={22} />
            <Skeleton height={320} radius={20} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : transaction ? (
          <>
            <Card style={styles.summary} elevated>
              <Text style={[styles.eyebrow, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                {transactionTitle(transaction)}
              </Text>
              <Text style={[styles.amount, { color: isCredit ? theme.colors.success : theme.colors.text, fontSize: theme.typography.financialLarge }]}>
                {formatSignedNaira(transaction.amount, transaction.direction ?? (isCredit ? 'credit' : 'debit'))}
              </Text>
              <View style={styles.summaryMeta}>
                <StatusBadge status={transaction.status} />
                <Text style={[styles.date, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                  {formatDateTime(transaction.createdAt)}
                </Text>
              </View>
            </Card>

            <Card padded={false} style={styles.details}>
              {rows.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.row, index === rows.length - 1 && styles.lastRow, { borderBottomColor: theme.colors.border }]}
                >
                  <row.icon size={17} color={theme.colors.primary} />
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                      {row.label}
                    </Text>
                    <Text style={[styles.rowValue, { color: theme.colors.text, fontSize: theme.typography.body }]}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </Card>

            <Button label="Done" onPress={() => router.back()} variant="secondary" />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  summary: { marginTop: 18, gap: 10, alignItems: 'center', paddingVertical: 26 },
  eyebrow: { fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  amount: { fontWeight: '700', letterSpacing: -1 },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  date: {},
  details: { marginTop: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  lastRow: { borderBottomWidth: 0 },
  rowCopy: { flex: 1, gap: 4 },
  rowLabel: { fontWeight: '600' },
  rowValue: { fontWeight: '600', lineHeight: 20 },
  skeletonStack: { gap: 16, marginTop: 18 }
});
