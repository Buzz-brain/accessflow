import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePreferences } from '@/src/features/accessibility/context/PreferencesContext';
import type { AccessibilityFeedback, FeedbackType } from '@/src/types/api';
import {
  buildScreenGuidance,
  resolveGuidance,
  type GuidanceHaptic,
  type GuidanceKind,
  type LastAnnouncement
} from '@/src/services/feedback/spokenGuidance';

interface AnnounceOptions {
  type?: FeedbackType;
  kind?: GuidanceKind;
  financial?: boolean;
  sensitive?: boolean;
  highPriority?: boolean;
  force?: boolean;
  key?: string;
  haptic?: GuidanceHaptic;
  forceSpeech?: boolean;
}

interface FeedbackContextValue {
  announce: (message: string, options?: AnnounceOptions) => void;
  announceFeedback: (feedback?: AccessibilityFeedback, options?: AnnounceOptions) => void;
  announceScreen: (title: string, purpose: string, primaryAction?: string) => void;
  announceValidation: (message: string) => void;
  announceFinancial: (message: string, options?: Omit<AnnounceOptions, 'financial' | 'kind'>) => void;
  announceProgress: (message: string) => void;
  stopSpeech: () => void;
  previewVoice: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const kindForFeedbackType = (type?: FeedbackType): GuidanceKind => {
  if (type === 'error') return 'validation';
  if (type === 'success') return 'result';
  return 'general';
};

const hapticForFeedbackType = (type?: FeedbackType): GuidanceHaptic => {
  if (type === 'error') return 'error';
  if (type === 'success') return 'success';
  return 'selection';
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const lastAnnouncement = useRef<LastAnnouncement | null>(null);
  const speechUnlocked = useRef(Platform.OS !== 'web');
  const pendingSpeech = useRef<{ text: string; rate: number } | null>(null);

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isScreenReaderEnabled()
      .then((enabled) => {
        if (active) setScreenReaderEnabled(enabled);
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      if (active) setScreenReaderEnabled(enabled);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const speakNow = useCallback((text: string, rate: number) => {
    void Speech.stop();
    void Speech.speak(text, {
      language: Platform.OS === 'web' ? 'en-US' : 'en-NG',
      rate,
      pitch: Platform.OS === 'ios' ? 1 : 1.02
    });
  }, []);

  const speak = useCallback(
    (text: string, rate: number) => {
      if (!speechUnlocked.current) {
        pendingSpeech.current = { text, rate };
        return;
      }
      speakNow(text, rate);
    },
    [speakNow]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const unlock = () => {
      speechUnlocked.current = true;
      void Speech.resume();
      const pending = pendingSpeech.current;
      pendingSpeech.current = null;
      if (pending) speakNow(pending.text, pending.rate);
    };
    const options: AddEventListenerOptions = { capture: true, once: true };

    window.addEventListener('pointerdown', unlock, options);
    window.addEventListener('keydown', unlock, options);

    return () => {
      window.removeEventListener('pointerdown', unlock, options);
      window.removeEventListener('keydown', unlock, options);
    };
  }, [speakNow]);

  const vibrate = useCallback(
    (kind: GuidanceHaptic) => {
      if (Platform.OS === 'web' || !preferences.vibrationEnabled || preferences.vibrationIntensity === 0) return;
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
    pendingSpeech.current = null;
    void Speech.stop();
  }, []);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const now = Date.now();
      const decision = resolveGuidance(
        {
          message,
          kind: options.kind ?? kindForFeedbackType(options.type),
          financial: options.financial,
          sensitive: options.sensitive,
          highPriority: options.highPriority,
          force: options.force,
          key: options.key,
          haptic: options.haptic ?? hapticForFeedbackType(options.type),
          forceSpeech: options.forceSpeech
        },
        {
          voiceGuidanceEnabled: preferences.voiceGuidanceEnabled,
          financialAnnouncementsEnabled: preferences.financialAnnouncementsEnabled,
          privacyMode: preferences.privacyMode,
          voiceSpeed: preferences.voiceSpeed,
          screenReaderEnabled
        },
        lastAnnouncement.current,
        now
      );

      if (!decision.shouldAnnounce) return;
      lastAnnouncement.current = { key: decision.dedupeKey, at: now };

      if (decision.useScreenReader) void AccessibilityInfo.announceForAccessibility(decision.text);
      if (decision.useSpeech) speak(decision.text, decision.rate);
      if (decision.haptic) vibrate(decision.haptic);
    },
    [
      preferences.financialAnnouncementsEnabled,
      preferences.privacyMode,
      preferences.voiceGuidanceEnabled,
      preferences.voiceSpeed,
      screenReaderEnabled,
      speak,
      vibrate
    ]
  );

  const announceFeedback = useCallback(
    (feedback?: AccessibilityFeedback, options: AnnounceOptions = {}) => {
      if (!feedback?.announce) return;
      announce(feedback.announcement, {
        ...options,
        type: feedback.type,
        highPriority: feedback.priority === 'high' || options.highPriority,
        force: feedback.priority === 'high' || options.force,
        haptic: options.haptic ?? hapticForFeedbackType(feedback.type)
      });
    },
    [announce]
  );

  const announceScreen = useCallback(
    (title: string, purpose: string, primaryAction?: string) => {
      announce(buildScreenGuidance(title, purpose, primaryAction), { kind: 'navigation', key: `screen:${title}` });
    },
    [announce]
  );

  const announceValidation = useCallback(
    (message: string) => {
      announce(message, { kind: 'validation', highPriority: true, haptic: 'error' });
    },
    [announce]
  );

  const announceFinancial = useCallback(
    (message: string, options: Omit<AnnounceOptions, 'financial' | 'kind'> = {}) => {
      announce(message, { ...options, kind: 'financial', financial: true, sensitive: true });
    },
    [announce]
  );

  const announceProgress = useCallback(
    (message: string) => {
      announce(message, { kind: 'progress' });
    },
    [announce]
  );

  const previewVoice = useCallback(() => {
    stopSpeech();
    if (preferences.voiceGuidanceEnabled) {
      speak(
        'Voice guidance is on. AccessFlow will announce important banking updates.',
        Math.max(0.5, Math.min(2, preferences.voiceSpeed))
      );
    }
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [preferences.voiceGuidanceEnabled, preferences.voiceSpeed, speak, stopSpeech]);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      announce,
      announceFeedback,
      announceScreen,
      announceValidation,
      announceFinancial,
      announceProgress,
      stopSpeech,
      previewVoice
    }),
    [announce, announceFeedback, announceScreen, announceValidation, announceFinancial, announceProgress, stopSpeech, previewVoice]
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider');
  return value;
}
