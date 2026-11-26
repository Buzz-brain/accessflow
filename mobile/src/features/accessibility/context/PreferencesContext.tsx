import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toApiError } from '@/src/api/client';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import {
  getPreferences,
  resetPreferences as resetPreferencesRequest,
  updatePreferences as updatePreferencesRequest
} from '@/src/features/accessibility/services/preferences.service';
import type { AccessibilityPreferences, PreferenceUpdate } from '@/src/types/models';
import type { ApiSuccess } from '@/src/types/api';

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  voiceGuidanceEnabled: true,
  voiceSpeed: 1,
  vibrationEnabled: true,
  vibrationIntensity: 50,
  gestureSensitivity: 'medium',
  privacyMode: false,
  highContrastEnabled: false,
  textScale: 1,
  simplifiedNavigation: false,
  preferredAccessibilityMode: 'balanced',
  updatedAt: new Date(0).toISOString()
};

interface PreferencesContextValue {
  preferences: AccessibilityPreferences;
  loading: boolean;
  updatePreference: (update: PreferenceUpdate) => Promise<ApiSuccess<AccessibilityPreferences> | null>;
  resetAllPreferences: () => Promise<ApiSuccess<AccessibilityPreferences> | null>;
  lastError: string | null;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (status !== 'signedIn') {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    setLoading(true);
    getPreferences()
      .then((response) => {
        if (active && response.data) setPreferences(response.data);
      })
      .catch((error) => {
        if (active) setLastError(toApiError(error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status]);

  const updatePreference = useCallback(async (update: PreferenceUpdate) => {
    const previous = preferences;
    setPreferences((current) => ({ ...current, ...update }));
    setLastError(null);
    try {
      const response = await updatePreferencesRequest(update);
      if (response.data) setPreferences(response.data);
      return response;
    } catch (error) {
      setPreferences(previous);
      setLastError(toApiError(error).message);
      return null;
    }
  }, [preferences]);

  const resetAllPreferences = useCallback(async () => {
    setLastError(null);
    try {
      const response = await resetPreferencesRequest();
      if (response.data) setPreferences(response.data);
      return response;
    } catch (error) {
      setLastError(toApiError(error).message);
      return null;
    }
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, loading, updatePreference, resetAllPreferences, lastError }),
    [preferences, loading, updatePreference, resetAllPreferences, lastError]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
