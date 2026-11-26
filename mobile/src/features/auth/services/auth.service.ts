import { apiGet, apiPost } from '@/src/api/client';
import { endpoints } from '@/src/api/endpoints';
import type { Account, AccessibilityPreferences, SafeUser } from '@/src/types/models';

export interface LoginData {
  token: string;
  user: SafeUser;
  account: Account;
}

export interface RegisterData {
  user: SafeUser;
  account: Account;
  preferences: Pick<AccessibilityPreferences, 'voiceGuidanceEnabled' | 'privacyMode'>;
}

export interface MeData {
  user: SafeUser;
  account: Account;
}

export async function login(email: string, password: string) {
  return apiPost<LoginData>(endpoints.auth.login, { email, password });
}

export async function register(input: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  return apiPost<RegisterData>(endpoints.auth.register, input);
}

export async function getCurrentUser() {
  return apiGet<MeData>(endpoints.auth.me);
}
