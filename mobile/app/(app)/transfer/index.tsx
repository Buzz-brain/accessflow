import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { ArrowRight, CircleCheck, CircleX, ShieldCheck, TriangleAlert, X } from 'lucide-react-native';
import { Screen } from '@/src/components/common/Screen';
import { AppHeader } from '@/src/components/common/AppHeader';
import { Card } from '@/src/components/common/Card';
import { Button } from '@/src/components/common/Button';
import { Input } from '@/src/components/forms/Input';
import { AppModal } from '@/src/components/common/AppModal';
import { ErrorState } from '@/src/components/common/ErrorState';
import { TransferStepIndicator } from '@/src/components/banking/TransferStepIndicator';
import { ReviewDetailsCard } from '@/src/components/banking/ReviewDetailsCard';
import { AmountKeypad } from '@/src/components/banking/AmountKeypad';
import { ProcessingOverlay } from '@/src/components/banking/ProcessingOverlay';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';
import { cancelTransfer, confirmTransfer, reviewTransfer } from '@/src/features/transactions/services/transaction.service';
import { toApiError, type ApiError } from '@/src/api/client';
import { createIdempotencyKey } from '@/src/utils/ids';
import { formatAccountNumber, formatKobo, parseNairaInput } from '@/src/utils/money';
import { formatDateTime } from '@/src/utils/dates';
import type { Transaction, TransferReviewData } from '@/src/types/models';

type Step = 'recipient' | 'amount' | 'review' | 'success' | 'failure';

const recipientSchema = z.object({
  recipientAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter the 10-digit recipient account number')
});

export default function TransferScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { account, refreshAccount } = useAuth();
  const { announce, announceFeedback } = useFeedback();
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [narration, setNarration] = useState('Transfer from AccessFlow');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<TransferReviewData | null>(null);
  const [resultTransaction, setResultTransaction] = useState<Transaction | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const idempotencyKey = useRef(createIdempotencyKey());
  const submitting = useRef(false);

  const resetTransfer = useCallback(() => {
    idempotencyKey.current = createIdempotencyKey();
    setRecipient('');
    setAmountInput('');
    setNarration('Transfer from AccessFlow');
    setRecipientError(null);
    setAmountError(null);
    setReviewData(null);
    setResultTransaction(null);
    setFailureMessage(null);
    setStep('recipient');
    submitting.current = false;
  }, []);

  const handleRecipientContinue = () => {
    const parsed = recipientSchema.safeParse({ recipientAccountNumber: recipient });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Check the account number';
      setRecipientError(message);
      announce(message, { type: 'error', force: true });
      return;
    }
    if (account && recipient.trim() === account.accountNumber) {
      const message = 'You cannot transfer to your own account.';
      setRecipientError(message);
      announce(message, { type: 'error', force: true });
      return;
    }
    setRecipientError(null);
    setStep('amount');
    announce('Enter the transfer amount.', { type: 'info' });
  };

  const handleKeypad = (key: string) => {
    setAmountError(null);
    setAmountInput((current) => {
      if (key === 'delete') return current.slice(0, -1);
      if (key === '.' && (current.includes('.') || current.length === 0)) return current;
      if (current.includes('.') && current.split('.')[1].length >= 2) return current;
      if (current.replace('.', '').length >= 12) return current;
      return current + key;
    });
  };

  const handleReview = async () => {
    if (submitting.current) return;
    const kobo = parseNairaInput(amountInput);
    if (!kobo || kobo > 100000000000) {
      const message = 'Enter an amount between ₦0.01 and ₦1,000,000,000.';
      setAmountError(message);
      announce(message, { type: 'error', force: true });
      return;
    }
    if (!narration.trim()) {
      setAmountError('Add a short description for this transfer.');
      return;
    }
    submitting.current = true;
    setReviewLoading(true);
    setAmountError(null);
    try {
      const response = await reviewTransfer({
        recipientAccountNumber: recipient.trim(),
        amount: (kobo / 100).toFixed(2),
        narration: narration.trim(),
        idempotencyKey: idempotencyKey.current
      });
      if (!response.data) throw new Error('Transfer review was incomplete.');
      setReviewData(response.data);
      setStep('review');
      announceFeedback(response.accessibilityFeedback, { sensitive: true, force: true });
    } catch (error) {
      const apiError = toApiError(error);
      setAmountError(apiError.message);
      if (apiError.feedback) announceFeedback(apiError.feedback, { force: true });
      else announce(apiError.message, { type: 'error', force: true });
    } finally {
      setReviewLoading(false);
      submitting.current = false;
    }
  };

  const handleConfirm = async () => {
    if (!reviewData || submitting.current) return;
    submitting.current = true;
    setProcessing(true);
    try {
      const response = await confirmTransfer(reviewData.transaction.id);
      if (response.data) setResultTransaction(response.data.transaction);
      await refreshAccount();
      setStep('success');
      announceFeedback(response.accessibilityFeedback, { sensitive: true, force: true });
    } catch (error) {
      const apiError = toApiError(error) as ApiError;
      setFailureMessage(apiError.message);
      setStep('failure');
      if (apiError.feedback) announceFeedback(apiError.feedback, { sensitive: true, force: true });
      else announce(apiError.message, { type: 'error', force: true });
    } finally {
      setProcessing(false);
      submitting.current = false;
    }
  };

  const handleCancelReview = async () => {
    if (!reviewData || cancelling) return;
    setCancelling(true);
    try {
      const response = await cancelTransfer(reviewData.transaction.id, 'Cancelled from mobile app');
      announceFeedback(response.accessibilityFeedback, { force: true });
      setCancelModalVisible(false);
      resetTransfer();
      router.replace('/home');
    } catch (error) {
      const apiError = toApiError(error);
      announce(apiError.message, { type: 'error', force: true });
    } finally {
      setCancelling(false);
    }
  };

  const stepIndex = step === 'recipient' ? 0 : step === 'amount' ? 1 : 2;
  const currency = account?.currency ?? 'NGN';
  const kobo = parseNairaInput(amountInput);

  return (
    <Screen scroll={false} edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader
          title={step === 'review' ? 'Review Transfer' : 'Transfer Money'}
          centerTitle
          showBack={step === 'recipient' || step === 'amount'}
        />

        {step === 'recipient' || step === 'amount' || step === 'review' ? (
          <TransferStepIndicator current={stepIndex} />
        ) : null}

        {step === 'recipient' ? (
          <View style={styles.stepBody}>
            <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: theme.typography.heading }]}>Enter Recipient</Text>
            <Input
              label="Recipient Account Number"
              placeholder="0200000000"
              value={recipient}
              onChangeText={(value) => {
                setRecipient(value.replace(/\D/g, '').slice(0, 10));
                setRecipientError(null);
              }}
              keyboardType="number-pad"
              maxLength={10}
              error={recipientError}
            />
            <Card style={[styles.infoCard, { backgroundColor: theme.colors.warningSurface }]}>
              <TriangleAlert size={18} color={theme.colors.warning} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                Tip: Double-check the account number before proceeding.
              </Text>
            </Card>
            <Button label="Find Account" onPress={handleRecipientContinue} variant="secondary" size="large" />
            <Button label="Continue" onPress={handleRecipientContinue} size="large" />
          </View>
        ) : null}

        {step === 'amount' ? (
          <View style={styles.stepBody}>
            <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: theme.typography.heading }]}>Enter Amount</Text>
            <View style={[styles.amountDisplay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.amountValue, { color: theme.colors.text, fontSize: theme.typography.financialLarge }]}>
                {kobo ? formatKobo(kobo, currency) : '₦0'}
              </Text>
              <Text style={[styles.amountKobo, { color: theme.colors.textSecondary, fontSize: theme.typography.body }]}>
                {kobo ? 'Tap Next to review' : 'Enter an amount in naira'}
              </Text>
              <Text style={[styles.availableBalance, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                Available balance: {formatKobo(account?.balanceKobo ?? 0, currency)}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {[
                { label: 'N5k', value: '5000' },
                { label: 'N10k', value: '10000' },
                { label: 'N25k', value: '25000' },
                { label: 'N50k', value: '50000' }
              ].map((chip) => (
                <Pressable
                  key={chip.label}
                  onPress={() => {
                    setAmountInput(chip.value);
                    setAmountError(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`₦${chip.label.replace('N', '')}`}
                  style={({ pressed }) => [
                    styles.chip,
                    amountInput === chip.value
                      ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      : {},
                    { opacity: pressed ? 0.82 : 1 }
                  ]}
                >
                  <Text style={[styles.chipText, { color: amountInput === chip.value ? theme.colors.primaryDark : theme.colors.text }]}>
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Input
              label="Description"
              placeholder="What is this transfer for?"
              value={narration}
              onChangeText={setNarration}
              maxLength={200}
              description="This will be visible to the recipient in their transaction history."
            />
            {amountError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error, fontSize: theme.typography.secondary }]}>
                {amountError}
              </Text>
            ) : null}
            <AmountKeypad onPress={handleKeypad} />
            <View style={styles.amountActions}>
              <Button
                label="Back"
                onPress={() => setStep('recipient')}
                variant="outline"
                fullWidth={false}
              />
              <Button
                label="Next"
                onPress={() => void handleReview()}
                loading={reviewLoading}
                fullWidth={false}
              />
            </View>
          </View>
        ) : null}

        {step === 'review' && reviewData ? (
          <View style={styles.stepBody}>
            <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: theme.typography.heading }]}>Review before confirming</Text>
            <Text style={[styles.stepCopy, { color: theme.colors.textSecondary, fontSize: theme.typography.body }]}>
              No money has moved yet. Check every detail, then confirm deliberately.
            </Text>
            <ReviewDetailsCard review={reviewData.review} currency={currency} />
            <Card style={[styles.warningCard, { backgroundColor: theme.colors.warningSurface }]}>
              <TriangleAlert size={18} color={theme.colors.warning} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                This is your last chance to edit or cancel. Confirming completes the transfer immediately.
              </Text>
            </Card>
            <Button label="Confirm transfer" onPress={() => void handleConfirm()} icon={ShieldCheck} size="large" />
            <View style={styles.reviewActions}>
              <Button label="Edit details" onPress={() => setStep('amount')} variant="outline" />
              <Button label="Cancel review" onPress={() => setCancelModalVisible(true)} variant="destructive" icon={X} />
            </View>
          </View>
        ) : null}

        {step === 'success' && resultTransaction ? (
          <View style={styles.resultBody}>
            <View style={[styles.resultIcon, { backgroundColor: theme.colors.successSurface }]}>
              <CircleCheck size={52} color={theme.colors.success} strokeWidth={1.8} />
            </View>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Transfer Successful!!</Text>
            <Text style={[styles.resultAmount, { color: theme.colors.text }]}>
              {formatKobo(resultTransaction.amountKobo, currency)}
            </Text>
            <Text style={[styles.resultCopy, { color: theme.colors.textSecondary }]}>
              Sent to {reviewData?.review.recipientName} · {formatAccountNumber(reviewData?.review.recipientAccountNumber ?? '')}
            </Text>
            <Card style={styles.resultCard}>
              <InfoRow label="Reference" value={resultTransaction.reference} />
              <InfoRow label="Date" value={formatDateTime(resultTransaction.createdAt)} />
              <InfoRow label="Status" value="Successful" />
            </Card>
            <Button label="Done" onPress={() => router.replace('/home')} size="large" />
          </View>
        ) : null}

        {step === 'failure' ? (
          <View style={styles.resultBody}>
            <View style={[styles.resultIcon, { backgroundColor: theme.colors.errorSurface }]}>
              <CircleX size={52} color={theme.colors.error} strokeWidth={1.8} />
            </View>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Transfer not completed</Text>
            <Text style={[styles.resultCopy, { color: theme.colors.textSecondary }]}>{failureMessage}</Text>
            <ErrorState
              title="What would you like to do?"
              message="You can start a new transfer or return to your dashboard. Check your balance before retrying."
            />
            <Button label="Start a new transfer" onPress={resetTransfer} icon={ArrowRight} size="large" />
            <Button label="Back to home" onPress={() => router.replace('/home')} variant="outline" />
          </View>
        ) : null}
      </ScrollView>

      <ProcessingOverlay visible={processing} />

      <AppModal
        visible={cancelModalVisible}
        title="Cancel this review?"
        description="Cancelling will end this review. No money has moved."
        onClose={() => setCancelModalVisible(false)}
      >
        <Button label="Keep reviewing" onPress={() => setCancelModalVisible(false)} variant="secondary" />
        <View style={styles.modalSpacer} />
        <Button label="Cancel transfer" onPress={() => void handleCancelReview()} loading={cancelling} variant="destructive" />
      </AppModal>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  stepBody: { marginTop: 24, gap: 18 },
  stepTitle: { fontWeight: '700', letterSpacing: -0.4 },
  stepCopy: { lineHeight: 20, marginTop: -10 },
  infoCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, lineHeight: 18 },
  amountDisplay: { borderWidth: 1, borderRadius: 28, paddingVertical: 32, alignItems: 'center', gap: 8 },
  amountValue: { fontWeight: '700', letterSpacing: -1.2 },
  amountKobo: {},
  availableBalance: { marginTop: 6 },
  error: { fontWeight: '600' },
  amountActions: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: '#E7EEEA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '600' },
  reviewActions: { flexDirection: 'row', gap: 10 },
  warningCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  resultBody: { alignItems: 'center', marginTop: 34, gap: 14 },
  resultIcon: { width: 110, height: 110, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  resultAmount: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  resultCopy: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  resultCard: { width: '100%', marginTop: 8, paddingVertical: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 12 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  modalSpacer: { height: 10 }
});
