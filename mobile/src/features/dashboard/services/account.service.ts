import { apiGet } from '@/src/api/client';
import { endpoints } from '@/src/api/endpoints';
import type { Account, BalanceSummary } from '@/src/types/models';

export async function getAccount() {
  return apiGet<Account>(endpoints.accounts.me);
}

export async function getBalance() {
  return apiGet<BalanceSummary>(endpoints.accounts.balance);
}
