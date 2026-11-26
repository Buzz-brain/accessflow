import { StyleSheet, Text, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { formatAccountNumber, formatKobo } from '@/src/utils/money';
import { IconButton } from '@/src/components/common/IconButton';

interface BalanceCardProps {
  balanceKobo: number;
  currency: string;
  accountNumber: string;
  bankName: string;
  hidden: boolean;
  onToggleHidden: () => void;
}

export function BalanceCard({
  balanceKobo,
  currency,
  accountNumber,
  bankName,
  hidden,
  onToggleHidden
}: BalanceCardProps) {
  const theme = useAppTheme();
  const amount = hidden ? '••••••' : formatKobo(balanceKobo, currency);

  return (
    <View
      style={[styles.card, theme.shadows.raised, { backgroundColor: theme.colors.primary }]}
      accessible
      accessibilityLabel={hidden ? 'Account balance hidden' : `Available balance ${formatKobo(balanceKobo, currency)}`}
    >
      <View style={styles.glowA} />
      <View style={styles.glowB} />
      <View style={styles.top}>
        <View>
          <Text style={[styles.eyebrow, { fontSize: theme.typography.caption }]}>AVAILABLE BALANCE</Text>
          <Text style={[styles.amount, { fontSize: theme.typography.financialLarge }]}>{amount}</Text>
        </View>
        <IconButton
          icon={hidden ? EyeOff : Eye}
          label={hidden ? 'Show balance' : 'Hide balance'}
          onPress={onToggleHidden}
          variant="transparent"
          size={40}
          color="rgba(255,255,255,0.9)"
        />
      </View>
      <View style={styles.footer}>
        <View style={styles.accountChip}>
          <View style={styles.chipDot} />
          <Text style={[styles.accountNumber, { fontSize: theme.typography.secondary }]}>
            {formatAccountNumber(accountNumber)}
          </Text>
        </View>
        <Text style={[styles.bankName, { fontSize: theme.typography.secondary }]}>{bankName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between'
  },
  glowA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -120,
    right: -50
  },
  glowB: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(43,196,138,0.22)',
    bottom: -110,
    left: -40
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  eyebrow: { color: 'rgba(255,255,255,0.72)', fontWeight: '600', letterSpacing: 1.2 },
  amount: { color: '#FFFFFF', fontWeight: '700', letterSpacing: -0.8, marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, gap: 10 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#5BFFC1' },
  accountNumber: { color: '#FFFFFF', fontWeight: '600', letterSpacing: 0.5 },
  bankName: { color: 'rgba(255,255,255,0.74)', flexShrink: 1, textAlign: 'right' }
});
