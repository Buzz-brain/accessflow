import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Building2, CreditCard, Landmark, ShieldCheck, Volume2 } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { BalanceCard } from '@/src/components/banking/BalanceCard';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { formatAccountNumber, formatKobo } from '@/src/utils/money';

export default function AccountScreen() {
  const theme = useAppTheme();
  const { account, refreshAccount } = useAuth();
  const { announce } = useFeedback();
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      await refreshAccount();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load account details');
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

  const rows = account
    ? [
        { label: 'Account name', value: account.accountName, icon: CreditCard },
        { label: 'Account number', value: formatAccountNumber(account.accountNumber), icon: Landmark },
        { label: 'Bank', value: account.bankName, icon: Building2 },
        { label: 'Account type', value: account.accountType, icon: ShieldCheck },
        { label: 'Currency', value: account.currency, icon: CreditCard }
      ]
    : [];

  return (
    <Screen scroll={false} edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.colors.primary} />
        }
      >
        <AppHeader title="Account" subtitle="Your AccessFlow account details" showBack />
        {loading && !account ? (
          <View style={styles.skeletonStack}>
            <Skeleton height={188} radius={28} />
            <Skeleton height={260} radius={20} />
          </View>
        ) : error && !account ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : account ? (
          <>
            <View style={styles.section}>
              <BalanceCard
                balanceKobo={account.balanceKobo}
                currency={account.currency}
                accountNumber={account.accountNumber}
                bankName={account.bankName}
                hidden={hidden}
                onToggleHidden={() => {
                  const next = !hidden;
                  setHidden(next);
                  if (!next) {
                    announce(`Available balance ${formatKobo(account.balanceKobo, account.currency)}.`, {
                      sensitive: true,
                      force: true
                    });
                  }
                }}
              />
            </View>

            <View style={styles.section}>
              <Card padded={false} style={styles.details}>
                {rows.map((row, index) => (
                  <Pressable
                    key={row.label}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.label}: ${row.value}`}
                    onPress={() => announce(`${row.label}: ${row.value}`, { sensitive: row.label.includes('number'), force: true })}
                    style={[
                      styles.row,
                      index === rows.length - 1 && styles.lastRow,
                      { borderBottomColor: theme.colors.border }
                    ]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryLight }]}>
                      <row.icon size={18} color={theme.colors.primary} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                        {row.label}
                      </Text>
                      <Text style={[styles.rowValue, { color: theme.colors.text, fontSize: theme.typography.body }]}>
                        {row.value}
                      </Text>
                    </View>
                    <Volume2 size={18} color={theme.colors.primary} />
                  </Pressable>
                ))}
              </Card>
            </View>

            <View style={styles.note}>
              <ShieldCheck size={17} color={theme.colors.primary} />
              <Text style={[styles.noteText, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                This account is part of the AccessFlow research prototype.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 30, gap: 6 },
  section: { marginTop: 18 },
  skeletonStack: { gap: 16, marginTop: 18 },
  details: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  lastRow: { borderBottomWidth: 0 },
  iconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  rowLabel: { fontWeight: '600' },
  rowValue: { fontWeight: '600' },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 20, paddingHorizontal: 6 },
  noteText: { flex: 1, lineHeight: 18 }
});
