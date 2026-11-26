import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

export function useNetworkStatus() {
  const netInfo = useNetInfo();
  const [isOnline, setIsOnline] = useState<boolean | null>(netInfo.isConnected ?? null);

  useEffect(() => {
    setIsOnline(netInfo.isConnected ?? null);
  }, [netInfo.isConnected]);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected ?? null);
    return state.isConnected ?? null;
  }, []);

  return { isOnline, refresh, isChecking: netInfo.type === 'unknown' };
}
