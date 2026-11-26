import { apiGet, apiPost, apiPut } from '@/src/api/client';
import { endpoints } from '@/src/api/endpoints';
import type { AccessibilityPreferences, PreferenceUpdate } from '@/src/types/models';

export async function getPreferences() {
  return apiGet<AccessibilityPreferences>(endpoints.accessibility.preferences);
}

export async function updatePreferences(update: PreferenceUpdate) {
  return apiPut<AccessibilityPreferences>(endpoints.accessibility.preferences, update);
}

export async function resetPreferences() {
  return apiPost<AccessibilityPreferences>(endpoints.accessibility.reset);
}
