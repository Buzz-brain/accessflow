import { apiGet, apiPost } from '@/src/api/client';
import { endpoints } from '@/src/api/endpoints';
import type { Transaction, TransferReviewData } from '@/src/types/models';

export type TransactionListData = Transaction[];

export async function getTransactions(params: {
  page?: number;
  limit?: number;
  type?: 'transfer' | 'deposit' | 'withdrawal';
}) {
  return apiGet<TransactionListData>(endpoints.transactions.list, {
    page: params.page,
    limit: params.limit,
    type: params.type
  });
}

export async function getTransaction(id: string) {
  return apiGet<Transaction>(endpoints.transactions.detail(id));
}

export async function reviewTransfer(input: {
  recipientAccountNumber: string;
  amount: string;
  narration: string;
  idempotencyKey: string;
}) {
  return apiPost<TransferReviewData>(endpoints.transactions.review, input, {
    'Idempotency-Key': input.idempotencyKey
  });
}

export async function confirmTransfer(id: string) {
  return apiPost<{ transaction: Transaction }>(endpoints.transactions.confirm(id), { confirmed: true });
}

export async function cancelTransfer(id: string, reason?: string) {
  return apiPost<{ transaction: Transaction }>(endpoints.transactions.cancel(id), reason ? { reason } : {});
}
