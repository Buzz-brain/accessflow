import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { formatAccountNumber, formatKobo } from '@/src/utils/money';
import type { TransferReview } from '@/src/types/models';

export function ReviewDetailsCard({ review, currency = 'NGN' }: { review: TransferReview; currency?: string }) {
  const theme = useAppTheme();
  const rows = [
    { label: 'You are sending', value: formatKobo(review.amountKobo, currency), emphasis: true },
    { label: 'To', value: review.recipientName },
    { label: 'Account number', value: formatAccountNumber(review.recipientAccountNumber) },
    { label: 'From', value: review.senderName },
    { label: 'Your account', value: formatAccountNumber(review.senderAccountNumber) },
    { label: 'Description', value: review.narration },
    { label: 'Reference', value: review.reference }
  ];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          paddingHorizontal: 18
        }
      ]}
    >
      {rows.map((row) => (
        <View key={row.label} style={[styles.row, row.emphasis && styles.emphasisRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
            {row.label}
          </Text>
          <Text
            style={[
              styles.value,
              {
                color: row.emphasis ? theme.colors.primary : theme.colors.text,
                fontSize: row.emphasis ? theme.typography.heading : theme.typography.body
              },
              row.emphasis && styles.emphasis
            ]}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, paddingVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  emphasisRow: { paddingVertical: 18 },
  label: { flexShrink: 1 },
  value: { fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  emphasis: { fontWeight: '700' }
});
