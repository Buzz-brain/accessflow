import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeftRight, Bell, CreditCard, ReceiptText, ShieldCheck, Wallet } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { Card } from '@/src/components/common/Card';
import { IconButton } from '@/src/components/common/IconButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { AppModal } from '@/src/components/common/AppModal';
import { Button } from '@/src/components/common/Button';
import { DashboardSkeleton } from '@/src/components/common/Skeleton';
import { BalanceCard } from '@/src/components/banking/BalanceCard';
import { QuickActions } from '@/src/components/banking/QuickActions';
import { TransactionRow } from '@/src/components/banking/TransactionRow';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { getBalance } from '@/src/features/dashboard/services/account.service';
import { getTransactions } from '@/src/features/transactions/services/transaction.service';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { toApiError } from '@/src/api/client';
import { firstName } from '@/src/utils/format';
import { formatKobo } from '@/src/utils/money';
import type { BalanceSummary, Transaction } from '@/src/types/models';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, account, refreshAccount } = useAuth();
  const { announce } = useFeedback();
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      await refreshAccount();
      const [balanceResponse, transactionsResponse] = await Promise.all([
        getBalance(),
        getTransactions({ page: 1, limit: 4 })
      ]);
      if (balanceResponse.data) setBalance(balanceResponse.data);
      if (transactionsResponse.data) setRecent(transactionsResponse.data);
    } catch (loadError) {
      setError(toApiError(loadError).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshAccount]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const toggleBalance = () => {
    const next = !hidden;
    setHidden(next);
    if (!next && balance) {
      announce(`Available balance ${formatKobo(balance.balanceKobo, balance.currency)}.`, {
        sensitive: true,
        type: 'info',
        force: true
      });
    } else {
      announce('Balance hidden.', { type: 'info' });
    }
  };

  const displayBalance = balance ?? (account
    ? {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        bankName: account.bankName,
        currency: account.currency,
        balance: account.balance,
        balanceKobo: account.balanceKobo
      }
    : null);

  return (
    <Screen scroll={false} edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingTitle, { color: theme.colors.text, fontSize: theme.typography.heading }]}>
              {greeting()}, {firstName(user?.fullName ?? 'there')}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.body }]}>
              Welcome back!
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon={Bell}
              label="Notifications"
              onPress={() => setNotificationsVisible(true)}
              variant="surface"
              size={42}
            />
          </View>
        </View>

        {loading && !displayBalance ? (
          <DashboardSkeleton />
        ) : error && !displayBalance ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : displayBalance ? (
          <>
            <BalanceCard
              balanceKobo={displayBalance.balanceKobo}
              currency={displayBalance.currency}
              accountNumber={displayBalance.accountNumber}
              bankName={displayBalance.bankName}
              hidden={hidden}
              onToggleHidden={toggleBalance}
            />

            <View style={styles.section}>
              <QuickActions
                actions={[
                  { label: 'Transfer', icon: ArrowLeftRight, onPress: () => router.push('/transfer'), featured: true },
                  { label: 'History', icon: ReceiptText, onPress: () => router.push('/transactions') },
                  { label: 'Account', icon: CreditCard, onPress: () => router.push('/account') },
                  { label: 'Accessibility', icon: ShieldCheck, onPress: () => router.push('/accessibility') }
                ]}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Recent Transactions" actionLabel="See all" onAction={() => router.push('/transactions')} />
              {loading ? (
                <View style={styles.inlineLoading}>
                  <Text style={[styles.inlineLoadingText, { color: theme.colors.textSecondary }]}>Refreshing activity…</Text>
                </View>
              ) : recent.length ? (
                <Card padded={false} style={styles.transactionCard}>
                  <View style={styles.transactionList}>
                    {recent.map((transaction, index) => (
                      <View key={transaction.id}>
                        <TransactionRow
                          transaction={transaction}
                          currency={displayBalance.currency}
                          compact
                          onPress={() => router.push(`/transactions/${transaction.id}`)}
                        />
                        {index < recent.length - 1 ? (
                          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </Card>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No activity yet"
                  message="Your completed transfers and deposits will appear here."
                  actionLabel="Send your first transfer"
                  onAction={() => router.push('/transfer')}
                />
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      <AppModal
        visible={notificationsVisible}
        title="Notifications"
        description="You're all caught up. New transfers and account activity will appear here."
        onClose={() => setNotificationsVisible(false)}
      >
        <Button label="Done" onPress={() => setNotificationsVisible(false)} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  headerLeft: { flex: 1, gap: 4 },
  greetingTitle: { fontWeight: '700', letterSpacing: -0.4 },
  greetingSubtitle: { fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { marginTop: 24 },
  transactionCard: { overflow: 'hidden', marginTop: 10 },
  transactionList: { paddingHorizontal: 16, paddingVertical: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
  inlineLoading: { paddingVertical: 22, alignItems: 'center' },
  inlineLoadingText: { fontSize: 12 }
});
