import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler, toApiError, type ApiError } from '@/src/api/client';
import { endpoints } from '@/src/api/endpoints';
import { apiGet } from '@/src/api/client';
import { clearAuthToken, getAuthToken, setAuthToken } from '@/src/services/storage/tokenStorage';
import { getCurrentUser, login as loginRequest, register as registerRequest } from '@/src/features/auth/services/auth.service';
import { getAccount } from '@/src/features/dashboard/services/account.service';
import type { ApiSuccess } from '@/src/types/api';
import type { Account, SafeUser } from '@/src/types/models';
import type { LoginData, RegisterData } from '@/src/features/auth/services/auth.service';

type AuthStatus = 'bootstrapping' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  user: SafeUser | null;
  account: Account | null;
  sessionExpired: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<ApiSuccess<LoginData>>;
  register: (input: { fullName: string; email: string; phoneNumber: string; password: string }) => Promise<ApiSuccess<RegisterData>>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [user, setUser] = useState<SafeUser | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
    setAccount(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true);
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const bootstrap = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setStatus('signedOut');
        return;
      }
      const response = await getCurrentUser();
      if (response.data) {
        setUser(response.data.user);
        setAccount(response.data.account);
        setStatus('signedIn');
      } else {
        await logout();
      }
    } catch (error) {
      const apiError = toApiError(error) as ApiError;
      if (apiError.code === 'NETWORK_ERROR' || apiError.code === 'TIMEOUT') {
        setStatus('signedOut');
        return;
      }
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const response = await loginRequest(email, password);
    if (!response.data) throw new Error('Login response was incomplete.');
    await setAuthToken(response.data.token, remember);
    setUser(response.data.user);
    setAccount(response.data.account);
    setStatus('signedIn');
    return response;
  }, []);

  const register = useCallback(
    async (input: { fullName: string; email: string; phoneNumber: string; password: string }) => {
      const response = await registerRequest(input);
      await signIn(input.email, input.password, true);
      return response;
    },
    [signIn]
  );

  const refreshSession = useCallback(async () => {
    const response = await getCurrentUser();
    if (response.data) {
      setUser(response.data.user);
      setAccount(response.data.account);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    const response = await getAccount();
    if (response.data) setAccount(response.data);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      account,
      sessionExpired,
      signIn,
      register,
      logout,
      refreshSession,
      refreshAccount,
      dismissSessionExpired: () => setSessionExpired(false)
    }),
    [status, user, account, sessionExpired, signIn, register, logout, refreshSession, refreshAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export async function checkHealth() {
  return apiGet<{ status: string; environment: string; version: string }>(endpoints.health);
}
