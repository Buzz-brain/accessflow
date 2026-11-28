import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
import { useFocusEffect, useRouter } from 'expo-router';
import { Search, Wallet } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { Input } from '@/src/components/forms/Input';
import { Button } from '@/src/components/common/Button';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { ListSkeleton } from '@/src/components/common/Skeleton';
import { SegmentedControl, type SegmentOption } from '@/src/components/common/SegmentedControl';
import { TransactionRow } from '@/src/components/banking/TransactionRow';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { getTransactions } from '@/src/features/transactions/services/transaction.service';
import { useScreenGuidance } from '@/src/hooks/useScreenGuidance';
import { toApiError } from '@/src/api/client';
import { transactionDayLabel, transactionDayKey } from '@/src/utils/dates';
import type { PaginationMeta } from '@/src/types/api';
import type { Transaction } from '@/src/types/models';

type Filter = 'all' | 'credit' | 'debit';

const FILTERS: SegmentOption<Filter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Credit', value: 'credit' },
  { label: 'Debit', value: 'debit' }
];

export default function TransactionsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  useScreenGuidance('Transaction history', 'Review, filter and search your account activity.', 'Search transactions');
  const [items, setItems] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, mode: 'initial' | 'more' | 'refresh' = 'initial') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      try {
        const response = await getTransactions({
          page: nextPage,
          limit: 20
        });
        const nextItems = response.data ?? [];
        setItems((current) => (mode === 'more' ? [...current, ...nextItems] : nextItems));
        setMeta(response.meta ?? null);
        setPage(nextPage);
      } catch (loadError) {
        setError(toApiError(loadError).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void load(1, 'initial');
    }, [load])
  );

  const filteredItems = useMemo(() => {
    let list = items;
    if (filter === 'credit') {
      list = list.filter((item) => item.direction === 'credit' || item.transactionType === 'deposit');
    } else if (filter === 'debit') {
      list = list.filter((item) => item.direction === 'debit' || item.transactionType !== 'deposit');
    }
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) =>
      [item.reference, item.narration, item.transactionType, item.status, String(item.amount)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [items, query, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredItems.forEach((item) => {
      const key = transactionDayKey(item.createdAt);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([key, list]) => ({
      key,
      label: transactionDayLabel(list[0].createdAt),
      items: list
    }));
  }, [filteredItems]);

  return (
    <Screen scroll={false} edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(1, 'refresh')} tintColor={theme.colors.primary} />
        }
      >
        <AppHeader title="Transaction History" centerTitle />
        <Input
          label="Search transactions"
          labelMode="hidden"
          variant="filled"
          fieldSize="compact"
          placeholder="Search transactions..."
          leftAdornment={<Search size={18} color={theme.colors.textSecondary} />}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        <View style={styles.filter}>
          <SegmentedControl label="Filter transactions by type" options={FILTERS} value={filter} onChange={setFilter} />
        </View>

        {loading ? (
          <View style={styles.section}>
            <ListSkeleton rows={6} />
          </View>
        ) : error && !items.length ? (
          <ErrorState message={error} onRetry={() => void load(1, 'initial')} />
        ) : groups.length ? (
          <View style={styles.section}>
            {groups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={[styles.groupLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                  {group.label}
                </Text>
                <Card padded={false} style={styles.list}>
                  <View style={styles.transactionList}>
                    {group.items.map((item, index) => (
                      <View key={item.id}>
                        <TransactionRow
                          transaction={item}
                          onPress={() => router.push(`/transactions/${item.id}`)}
                        />
                        {index < group.items.length - 1 ? (
                          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </Card>
              </View>
            ))}

            {meta?.hasNextPage ? (
              <Button
                label={loadingMore ? 'Loading more…' : 'Load more'}
                onPress={() => void load(page + 1, 'more')}
                variant="secondary"
                loading={loadingMore}
              />
            ) : null}
          </View>
        ) : (
          <EmptyState
            icon={Wallet}
            title={query ? 'No matching activity' : 'No transactions yet'}
            message={query ? 'Try a different reference, description or amount.' : 'Your deposits and transfers will appear here.'}
            actionLabel={query ? 'Clear search' : undefined}
            onAction={query ? () => setQuery('') : undefined}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  filter: { marginTop: 16 },
  section: { marginTop: 22 },
  group: { marginBottom: 22 },
  groupLabel: { fontWeight: '600', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' },
  list: { overflow: 'hidden' },
  transactionList: { paddingHorizontal: 16, paddingVertical: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 56 }
});
