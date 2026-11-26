import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const ONBOARDING_KEY = 'accessflow.onboarding.completed';

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => {
        if (active) setCompleted(value === 'true');
      })
      .catch(() => {
        if (active) setCompleted(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    setCompleted(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  return { completed, completeOnboarding };
}
