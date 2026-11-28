import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/src/components/common/AppText';
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
import { lookupRecipient } from '@/src/features/dashboard/services/account.service';
import { toApiError, type ApiError } from '@/src/api/client';
import { createIdempotencyKey } from '@/src/utils/ids';
import { formatKobo, parseNairaInput } from '@/src/utils/money';
import { formatKoboForSpeech } from '@/src/services/feedback/spokenGuidance';
import { formatDateTime } from '@/src/utils/dates';
import type { RecipientLookup, Transaction, TransferReviewData } from '@/src/types/models';

const accessflowLogo = require('../../../temp-assets/accessflow-logo.png');
const MIN_PROCESSING_DISPLAY_MS = 1600;

type Step = 'recipient' | 'amount' | 'review' | 'success' | 'failure';

const recipientSchema = z.object({
  recipientAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter the 10-digit recipient account number')
});

const applyAmountKey = (current: string, key: string) => {
  if (key === 'delete') return current.slice(0, -1);
  if (key === '.' && (current.includes('.') || current.length === 0)) return current;
  if (current.includes('.') && current.split('.')[1].length >= 2) return current;
  if (current.replace('.', '').length >= 12) return current;
  return current + key;
};

const sanitizeAmountInput = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...fractions] = cleaned.split('.');
  return fractions.length ? `${whole}.${fractions.join('').slice(0, 2)}` : whole;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'AF';

export default function TransferScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { account, refreshAccount } = useAuth();
  const { announce, announceFeedback, announceFinancial } = useFeedback();
  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [recipientSelected, setRecipientSelected] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [narration, setNarration] = useState('Transfer from AccessFlow');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [recipientMatch, setRecipientMatch] = useState<RecipientLookup | null>(null);
  const [recipientLookupLoading, setRecipientLookupLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<TransferReviewData | null>(null);
  const [resultTransaction, setResultTransaction] = useState<Transaction | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing your transfer securely');
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const ownAccountNumber = account?.accountNumber;
  const currency = account?.currency ?? 'NGN';
  const recipientInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const idempotencyKey = useRef(createIdempotencyKey());
  const submitting = useRef(false);
  const lookupSequence = useRef(0);

  const resetTransfer = useCallback(() => {
    lookupSequence.current += 1;
    idempotencyKey.current = createIdempotencyKey();
    setRecipient('');
    setRecipientSelected(false);
    setAmountInput('');
    setNarration('Transfer from AccessFlow');
    setRecipientError(null);
    setRecipientMatch(null);
    setRecipientLookupLoading(false);
    setAmountError(null);
    setReviewData(null);
    setResultTransaction(null);
    setFailureMessage(null);
    setStep('recipient');
    submitting.current = false;
  }, []);

  useEffect(() => {
    const sequence = ++lookupSequence.current;
    const value = recipient.trim();
    const parsed = recipientSchema.safeParse({ recipientAccountNumber: value });
    setRecipientMatch(null);
    setRecipientSelected(false);

    if (!parsed.success) {
      setRecipientLookupLoading(false);
      return;
    }

    if (ownAccountNumber && value === ownAccountNumber) {
      setRecipientError('You cannot transfer to your own account.');
      setRecipientLookupLoading(false);
      return;
    }

    const controller = new AbortController();
    setRecipientLookupLoading(true);
    announce('Finding recipient.', { kind: 'progress', key: 'transfer:recipient:lookup' });

    const timeout = setTimeout(async () => {
      try {
        const response = await lookupRecipient(value, controller.signal);
        if (sequence !== lookupSequence.current || controller.signal.aborted) return;
        if (!response.data) throw new Error('Recipient lookup was incomplete.');
        setRecipientError(null);
        setRecipientMatch(response.data);
        setRecipientSelected(false);
        announce(
          `Recipient found: ${response.data.recipientName} at ${response.data.bankName}. Select the recipient below the account number to continue.`,
          { highPriority: true, key: 'transfer:recipient:found' }
        );
      } catch (error) {
        if (sequence !== lookupSequence.current || controller.signal.aborted) return;
        const apiError = toApiError(error);
        const message =
          apiError.code === 'RECIPIENT_NOT_FOUND'
            ? 'We could not find that account number. Check the digits or enter a different recipient.'
            : apiError.message;
        setRecipientError(message);
        announce(message, { type: 'error', highPriority: true, force: true });
      } finally {
        if (sequence === lookupSequence.current) setRecipientLookupLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [recipient, ownAccountNumber, announce]);

  useEffect(() => {
    if (step === 'recipient') {
      announce('Step 1 of 4. Enter the ten digit recipient account number.', {
        kind: 'navigation',
        key: 'transfer:step:recipient'
      });
      return;
    }

    if (step === 'amount') {
      announce('Step 2 of 4. Enter the amount in naira using the field or keypad.', {
        kind: 'navigation',
        key: 'transfer:step:amount'
      });
      if (account) {
        announceFinancial(`Available balance is ${formatKoboForSpeech(account.balanceKobo, currency)}.`, {
          key: 'transfer:available:balance'
        });
      }
      return;
    }

    if (step === 'review' && reviewData) {
      const feeKobo = reviewData.review.feeKobo ?? 0;
      const totalDebitKobo = reviewData.review.totalDebitKobo ?? reviewData.review.amountKobo;
      announce('Step 3 of 4. Review the details. No money has moved yet.', {
        kind: 'navigation',
        key: 'transfer:step:review'
      });
      announceFinancial(
        `Transfer fee ${formatKoboForSpeech(feeKobo, currency)}. Total debit ${formatKoboForSpeech(totalDebitKobo, currency)}.`,
        { highPriority: true, key: 'transfer:review:totals' }
      );
      return;
    }

    if (step === 'success' && resultTransaction) {
      announce('Step 4 of 4. Transfer successful. Choose Done to return home.', {
        type: 'success',
        highPriority: true,
        force: true,
        key: 'transfer:success'
      });
      announceFinancial(`${formatKoboForSpeech(resultTransaction.amountKobo, currency)} sent.`, {
        highPriority: true,
        key: 'transfer:success:amount'
      });
      if (resultTransaction.newBalanceKobo !== null) {
        announceFinancial(`Your new balance is ${formatKoboForSpeech(resultTransaction.newBalanceKobo, currency)}.`, {
          highPriority: true,
          key: 'transfer:success:balance'
        });
      }
      return;
    }

    if (step === 'failure') {
      announce('Transfer not completed. Choose start a new transfer or back to home.', {
        type: 'error',
        highPriority: true,
        force: true,
        key: 'transfer:failure'
      });
    }
  }, [step, account, currency, reviewData, resultTransaction, announce, announceFinancial]);

  const handleRecipientContinue = () => {
    const parsed = recipientSchema.safeParse({ recipientAccountNumber: recipient });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Check the account number';
      setRecipientError(message);
      announce(message, { type: 'error', force: true });
      return;
    }
    if (ownAccountNumber && recipient.trim() === ownAccountNumber) {
      const message = 'You cannot transfer to your own account.';
      setRecipientError(message);
      announce(message, { type: 'error', force: true });
      return;
    }
    if (!recipientMatch || recipientMatch.accountNumber !== recipient.trim() || recipientLookupLoading || !recipientSelected) {
      const message = recipientLookupLoading
        ? 'Wait for the recipient details to load.'
        : !recipientSelected
          ? 'Select the recipient below the account number before continuing.'
          : 'Confirm the recipient details before continuing.';
      setRecipientError(message);
      announce(message, { type: 'error', force: true });
      return;
    }
    setRecipientError(null);
    setStep('amount');
    announce('Enter the transfer amount.', { type: 'info' });
  };

  const handleSelectRecipient = () => {
    if (!recipientMatch) return;
    setRecipientSelected(true);
    setRecipientError(null);
    announce(
      `Recipient selected: ${recipientMatch.recipientName} at ${recipientMatch.bankName}.`,
      { type: 'success', highPriority: true, key: 'transfer:recipient:selected' }
    );
  };

  const announceAmount = (value: string) => {
    const kobo = parseNairaInput(value);
    if (kobo) {
      announceFinancial(`Amount ${formatKoboForSpeech(kobo, currency)}.`, { key: 'transfer:amount:entry' });
    }
  };

  const handleKeypad = (key: string) => {
    const next = applyAmountKey(amountInput, key);
    if (next === amountInput) return;
    setAmountError(null);
    setAmountInput(next);
    announceAmount(next);
  };

  const handleAmountText = (value: string) => {
    const next = sanitizeAmountInput(value).slice(0, 14);
    setAmountError(null);
    setAmountInput(next);
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
    announce('Reviewing your transfer. No money will move yet.', { kind: 'progress' });
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
    const startedAt = Date.now();
    setProcessingMessage('Processing your transfer securely');
    setProcessing(true);
    announce('Confirmation received. Processing your transfer. Do not submit it again.', {
      kind: 'progress',
      highPriority: true
    });
    try {
      const response = await confirmTransfer(reviewData.transaction.id);
      if (response.data) setResultTransaction(response.data.transaction);
      await refreshAccount();
      setProcessingMessage('Transfer completed');
      const remaining = MIN_PROCESSING_DISPLAY_MS - (Date.now() - startedAt);
      if (remaining > 0) await new Promise<void>((resolve) => setTimeout(resolve, remaining));
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
      setProcessingMessage('Processing your transfer securely');
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
  const kobo = parseNairaInput(amountInput);

  return (
    <Screen scroll={false} edges={['top', 'bottom']} style={{ backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 'recipient' || step === 'amount' || step === 'review' ? (
          <AppHeader
            title={step === 'review' ? 'Review Transfer' : 'Transfer Money'}
            centerTitle
            showBack={step === 'recipient' || step === 'amount'}
            onBack={step === 'amount' ? () => setStep('recipient') : undefined}
          />
        ) : null}

        {step === 'recipient' || step === 'amount' || step === 'review' ? (
          <TransferStepIndicator current={stepIndex} />
        ) : null}

        {step === 'recipient' ? (
          <View style={styles.stepBody}>
            <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: theme.typography.heading }]}>Enter Recipient</Text>
            <View style={styles.recipientFieldGroup}>
            <View style={styles.recipientInputLayer}>
            <Input
              ref={recipientInputRef}
              label="Recipient Account Number"
              placeholder="0200000000"
              variant="soft"
              labelMode="floating"
              value={recipient}
              onChangeText={(value) => {
                setRecipient(value.replace(/\D/g, '').slice(0, 10));
                setRecipientError(null);
                setRecipientSelected(false);
              }}
              keyboardType="number-pad"
              maxLength={10}
              description="Enter 10 digits. Recipient search starts automatically."
              error={recipientError}
            />
            </View>
            {!recipientMatch && !recipientError && (recipient.length > 0 || recipientLookupLoading) ? (
              <View
                style={[
                  styles.recipientAttachedOption,
                  styles.recipientAttachedLoader,
                  {
                    backgroundColor: theme.colors.primaryLight,
                    borderColor: theme.colors.primaryLight,
                    shadowColor: theme.colors.text,
                    shadowOpacity: 0.16,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4
                  }
                ]}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Search recipient"
              >
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.recipientSearchingText, { color: theme.colors.primaryDark, fontSize: theme.typography.secondary }]}>
                  Search recipient...
                </Text>
              </View>
            ) : null}
            {!recipientLookupLoading && recipientMatch && !recipientSelected ? (
              <Pressable
                onPress={handleSelectRecipient}
                accessibilityRole="button"
                accessibilityLabel={`Select recipient ${recipientMatch.recipientName} at ${recipientMatch.bankName}.`}
                accessibilityHint="Opens the recipient details."
                style={({ pressed }) => [
                  styles.recipientAttachedOption,
                  {
                    backgroundColor: theme.colors.primaryLight,
                    borderColor: theme.colors.primaryLight,
                    shadowColor: theme.colors.text,
                    shadowOpacity: 0.16,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4
                  },
                  pressed && styles.recipientAttachedOptionPressed
                ]}
              >
                <View style={styles.recipientAttachedRow}>
                  <View style={[styles.recipientAvatar, { borderColor: theme.colors.primary }]}>
                    <Text style={[styles.recipientAvatarText, { color: theme.colors.primary }]}>
                      {getInitials(recipientMatch.recipientName)}
                    </Text>
                  </View>
                  <View style={styles.recipientAttachedCopy}>
                    <Text style={[styles.recipientFieldValue, { color: theme.colors.text, fontSize: theme.typography.secondary }]} numberOfLines={1}>
                      {recipientMatch.recipientName}
                    </Text>
                    <View style={styles.recipientBankValueRow}>
                      <Image source={accessflowLogo} style={styles.bankLogo} resizeMode="contain" />
                      <Text style={[styles.recipientBankValue, { color: theme.colors.textSecondary, fontSize: theme.typography.caption }]} numberOfLines={1}>
                        {recipientMatch.bankName}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.recipientAttachedAction, { color: theme.colors.primary, fontSize: theme.typography.caption }]}>Select</Text>
                </View>
              </Pressable>
            ) : null}
            </View>
            {recipientError ? (
              <Card style={styles.recipientHelp}>
                <Text style={[styles.helpTitle, { color: theme.colors.text }]}>Choose what you would like to do</Text>
                <View style={styles.helpActions}>
                  <Button
                    label="Check number"
                    onPress={() => recipientInputRef.current?.focus()}
                    variant="secondary"
                    fullWidth={false}
                  />
                  <Button
                    label="Clear and try another"
                    onPress={() => {
                      setRecipient('');
                      setRecipientError(null);
                      recipientInputRef.current?.focus();
                    }}
                    variant="outline"
                    fullWidth={false}
                  />
                </View>
              </Card>
            ) : null}
            {!recipientLookupLoading && recipientMatch && recipientSelected ? (
              <View
                style={[
                  styles.recipientDisplay,
                  {
                    backgroundColor: theme.colors.primaryLight,
                    borderColor: theme.colors.primaryLight
                  }
                ]}
                accessible
                accessibilityLabel={`Recipient ${recipientMatch.recipientName}. Bank ${recipientMatch.bankName}.`}
              >
                <View style={styles.recipientIdentityRow}>
                  <View style={[styles.recipientAvatar, { borderColor: theme.colors.primary }]}>
                    <Text style={[styles.recipientAvatarText, { color: theme.colors.primary }]}>
                      {getInitials(recipientMatch.recipientName)}
                    </Text>
                  </View>
                  <Text style={[styles.recipientFieldValue, { color: theme.colors.text, fontSize: theme.typography.body }]} numberOfLines={1}>
                    {recipientMatch.recipientName}
                  </Text>
                </View>
                <View style={styles.recipientBankValueRow}>
                  <Image source={accessflowLogo} style={styles.bankLogo} resizeMode="contain" />
                  <Text style={[styles.recipientBankValue, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]} numberOfLines={1}>
                    {recipientMatch.bankName}
                  </Text>
                </View>
              </View>
            ) : null}
            <Card style={[styles.infoCard, { backgroundColor: theme.colors.warningSurface }]}>
              <TriangleAlert size={18} color={theme.colors.warning} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                Tip: Check the recipient name and bank before you continue.
              </Text>
            </Card>
            <Button
              label="Continue"
              onPress={handleRecipientContinue}
              size="large"
              disabled={!recipientMatch || !recipientSelected || recipientLookupLoading}
            />
          </View>
        ) : null}

        {step === 'amount' ? (
          <View style={styles.stepBody}>
            <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: theme.typography.heading }]}>Enter Amount</Text>
            <View style={[styles.amountDisplay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.amountInputRow}>
                <Text style={[styles.amountCurrency, { color: theme.colors.text, fontSize: Math.round(theme.typography.financialLarge * 0.8), paddingRight: 4 }]}>₦</Text>
                <TextInput
                  value={amountInput}
                  onChangeText={handleAmountText}
                  onBlur={() => announceAmount(amountInput)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={14}
                  returnKeyType="done"
                  selectTextOnFocus
                  accessible
                  accessibilityLabel="Amount in naira"
                  accessibilityHint="Type the amount directly, or use the keypad."
                  accessibilityValue={{ text: kobo ? formatKobo(kobo, currency) : 'No amount entered' }}
                  style={[styles.amountTextInput, { color: theme.colors.text, fontSize: theme.typography.heading }]}
                />
              </View>
              <Text style={[styles.availableBalance, { color: theme.colors.textSecondary, fontSize: theme.typography.secondary }]}>
                {account
                  ? `Available balance: ${formatKobo(account.balanceKobo, currency)}`
                  : 'Available balance is currently unavailable.'}
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
                    announceAmount(chip.value);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`₦${chip.label.replace('N', '')}`}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: theme.colors.primaryLight,
                      borderColor: amountInput === chip.value ? theme.colors.primary : theme.colors.primaryLight,
                      opacity: pressed ? 0.82 : 1
                    }
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
            />
            {amountError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: theme.colors.error, fontSize: theme.typography.secondary }]}>
                {amountError}
              </Text>
            ) : null}
            <AmountKeypad onPress={handleKeypad} />
            <Button
              label="Next"
              onPress={() => void handleReview()}
              loading={reviewLoading}
              size="large"
            />
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
              Sent to {reviewData?.review.recipientName} · {reviewData?.review.recipientBankName}
            </Text>
            <Card style={styles.resultCard}>
              <InfoRow label="Reference" value={resultTransaction.reference} />
              <InfoRow label="Date" value={formatDateTime(resultTransaction.createdAt)} />
              <InfoRow label="Status" value="Successful" />
            </Card>
            <View style={styles.resultActions}>
              <Button
                label="View details"
                onPress={() => router.replace(`/transactions/${resultTransaction.id}`)}
                variant="outline"
                size="large"
              />
              <Button label="Done" onPress={() => router.replace('/home')} size="large" />
            </View>
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

      <ProcessingOverlay
        visible={processing}
        message={processingMessage}
        success={processingMessage === 'Transfer completed'}
      />

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
  bankLogo: { width: 24, height: 24 },
  recipientFieldGroup: { gap: 0 },
  recipientInputLayer: { zIndex: 1 },
  recipientAttachedOption: { gap: 8, marginTop: 2, marginHorizontal: 8, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingLeft: 12, paddingRight: 14, paddingTop: 6, paddingBottom: 8, zIndex: 2 },
  recipientAttachedOptionPressed: { transform: [{ translateY: -1 }], shadowOpacity: 0.22, shadowRadius: 12, elevation: 6 },
  recipientAttachedLoader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipientSearchingText: { fontWeight: '600' },
  recipientAttachedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipientAttachedAction: { fontWeight: '700' },
  recipientAttachedCopy: { flex: 1, gap: 3 },
  recipientDisplay: { gap: 10, paddingLeft: 18, paddingRight: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  recipientIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipientAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  recipientAvatarText: { fontWeight: '700', fontSize: 13 },
  recipientFieldValue: { fontWeight: '600' },
  recipientBankValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recipientBankValue: { fontWeight: '600' },
  recipientHelp: { gap: 12 },
  helpTitle: { fontWeight: '600' },
  helpActions: { flexDirection: 'row', gap: 10 },
  infoCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, lineHeight: 18 },
  amountDisplay: { borderWidth: 1, borderRadius: 28, paddingVertical: 18, alignItems: 'center', gap: 6 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', gap: 2 },
  amountCurrency: { fontWeight: '700', letterSpacing: -1.2 },
  amountTextInput: { width: 64, textAlign: 'left', paddingVertical: 0, borderWidth: 0, outlineWidth: 0, fontWeight: '700', letterSpacing: -1.2 },
  availableBalance: { marginTop: 6 },
  error: { fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: '#E7EEEA', borderRadius: 14, minWidth: 58, paddingHorizontal: 4, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  reviewActions: { flexDirection: 'row', gap: 10 },
  warningCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  resultBody: { alignItems: 'center', marginTop: 34, gap: 14 },
  resultIcon: { width: 110, height: 110, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  resultAmount: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  resultCopy: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  resultCard: { width: '100%', marginTop: 8, paddingVertical: 6 },
  resultActions: { width: '100%', gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 12 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  modalSpacer: { height: 10 }
});
