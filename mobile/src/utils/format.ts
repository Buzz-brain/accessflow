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

export function transactionTitle(transaction: Transaction) {
  if (transaction.transactionType === 'deposit') return 'Deposit';
  if (transaction.transactionType === 'withdrawal') return 'Withdrawal';
  return transaction.direction === 'credit' ? 'Transfer received' : 'Transfer sent';
}

export function transactionSubtitle(transaction: Transaction) {
  return transaction.narration || transaction.reference;
}

export function isMoneyMoving(status: TransactionStatus) {
  return status === 'successful';
}
