import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useFeedback } from '@/src/services/feedback/FeedbackProvider';

export function useScreenGuidance(title: string, purpose: string, primaryAction?: string) {
  const { announceScreen, stopSpeech } = useFeedback();

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => announceScreen(title, purpose, primaryAction), 180);
      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    }, [announceScreen, stopSpeech, title, purpose, primaryAction])
  );
}
