import type { Transaction, TransactionStatus } from '@/src/types/models';

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function initials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const statusLabels: Record<TransactionStatus, string> = {
  initiated: 'Started',
  pending_confirmation: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  processing: 'Processing',
  successful: 'Successful',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

export function statusLabel(status: TransactionStatus) {
  return statusLabels[status] ?? status.replaceAll('_', ' ');
}

const DEFAULT_NARRATION = 'Transfer from AccessFlow';

const counterpartyFirstName = (transaction: Transaction) =>
  transaction.counterpartyName ? firstName(transaction.counterpartyName) : null;

export function transactionTitle(transaction: Transaction) {
  const name = counterpartyFirstName(transaction);
  if (transaction.transactionType === 'deposit') return name ? `Money added from ${name}` : 'Money added';
  if (transaction.transactionType === 'withdrawal') return 'Cash withdrawal';
  if (transaction.direction === 'credit') return name ? `Money received from ${name}` : 'Money received';
  return name ? `Transfer to ${name}` : 'Transfer sent';
}

export function transactionSubtitle(transaction: Transaction) {
  if (transaction.status === 'pending_confirmation') return 'Ready for confirmation · no money moved';
  const bankName = transaction.counterpartyBankName ?? (transaction.transactionType === 'deposit' ? 'AccessFlow' : null);
  const last4 = transaction.counterpartyAccountLast4;
  const details = [bankName, last4 ? `•••• ${last4}` : null].filter(Boolean);
  const narration = transaction.narration && transaction.narration !== DEFAULT_NARRATION ? transaction.narration : null;
  if (details.length) return narration ? `${details.join(' · ')} · ${narration}` : details.join(' · ');
  return narration || transaction.reference;
}

export function isMoneyMoving(status: TransactionStatus) {
  return status === 'successful';
}
