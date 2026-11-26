import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { usePreferences } from '@/src/features/accessibility/context/PreferencesContext';
import type { AccessibilityFeedback, FeedbackType } from '@/src/types/api';

type HapticKind = 'success' | 'error' | 'warning' | 'selection';

interface AnnounceOptions {
  type?: FeedbackType;
  sensitive?: boolean;
  force?: boolean;
  haptic?: HapticKind;
}

interface FeedbackContextValue {
  announce: (message: string, options?: AnnounceOptions) => void;
  announceFeedback: (feedback?: AccessibilityFeedback, options?: AnnounceOptions) => void;
  stopSpeech: () => void;
  previewVoice: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const lastAnnouncement = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  const vibrate = useCallback(
    (kind: HapticKind) => {
      if (!preferences.vibrationEnabled || preferences.vibrationIntensity === 0) return;
      const style =
        preferences.vibrationIntensity <= 33
          ? Haptics.ImpactFeedbackStyle.Light
          : preferences.vibrationIntensity <= 66
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy;

      if (kind === 'selection') {
        void Haptics.selectionAsync();
        return;
      }
      if (kind === 'error') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (kind === 'success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      void Haptics.impactAsync(style);
    },
    [preferences.vibrationEnabled, preferences.vibrationIntensity]
  );

  const stopSpeech = useCallback(() => {
    void Speech.stop();
  }, []);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const text = options.sensitive && preferences.privacyMode ? 'Sensitive information hidden.' : message;
      const now = Date.now();
      const repeated = lastAnnouncement.current.text === text && now - lastAnnouncement.current.at < 1200;
      if (repeated && !options.force) return;
      lastAnnouncement.current = { text, at: now };

      void AccessibilityInfo.announceForAccessibility(text);
      vibrate(options.haptic ?? (options.type === 'error' ? 'error' : 'selection'));

      if (preferences.voiceGuidanceEnabled) {
        void Speech.stop();
        void Speech.speak(text, {
          language: 'en-NG',
          rate: Math.max(0.5, Math.min(2, preferences.voiceSpeed)),
          pitch: Platform.OS === 'ios' ? 1 : 1.02
        });
      }
    },
    [preferences.privacyMode, preferences.voiceGuidanceEnabled, preferences.voiceSpeed, vibrate]
  );

  const announceFeedback = useCallback(
    (feedback?: AccessibilityFeedback, options: AnnounceOptions = {}) => {
      if (!feedback?.announcement) return;
      announce(feedback.announcement, {
        type: feedback.type,
        force: feedback.priority === 'high' || options.force,
        sensitive: options.sensitive,
        haptic: options.haptic ?? (feedback.type === 'error' ? 'error' : 'selection')
      });
    },
    [announce]
  );

  const previewVoice = useCallback(() => {
    void Speech.stop();
    if (preferences.voiceGuidanceEnabled) {
      void Speech.speak('Voice guidance is on. AccessFlow will announce important banking updates.', {
        language: 'en-NG',
        rate: preferences.voiceSpeed
      });
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [preferences.voiceGuidanceEnabled, preferences.voiceSpeed]);

  const value = useMemo<FeedbackContextValue>(
    () => ({ announce, announceFeedback, stopSpeech, previewVoice }),
    [announce, announceFeedback, stopSpeech, previewVoice]
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider');
  return value;
}
