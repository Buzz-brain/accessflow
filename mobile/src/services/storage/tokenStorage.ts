import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'accessflow.auth.token';
const TOKEN_FALLBACK_KEY = 'accessflow.auth.token.fallback';
const REMEMBER_KEY = 'accessflow.auth.remember';

let memoryToken: string | null = null;

async function canUseSecureStore() {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function writePersistedToken(token: string) {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await AsyncStorage.removeItem(TOKEN_FALLBACK_KEY);
      return;
    } catch {
      await AsyncStorage.setItem(TOKEN_FALLBACK_KEY, token);
      return;
    }
  }
  await AsyncStorage.setItem(TOKEN_FALLBACK_KEY, token);
}

async function readPersistedToken() {
  if (await canUseSecureStore()) {
    try {
      const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (secureToken) return secureToken;
    } catch {
      return AsyncStorage.getItem(TOKEN_FALLBACK_KEY);
    }
  }
  return AsyncStorage.getItem(TOKEN_FALLBACK_KEY);
}

async function removePersistedToken() {
  const operations: Promise<unknown>[] = [AsyncStorage.removeItem(TOKEN_FALLBACK_KEY)];
  if (await canUseSecureStore()) {
    operations.push(SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined));
  }
  await Promise.all(operations);
}

export async function setAuthToken(token: string, remember: boolean) {
  memoryToken = token;
  await AsyncStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
  if (remember) await writePersistedToken(token);
  else await removePersistedToken();
}

export async function getAuthToken() {
  if (memoryToken) return memoryToken;
  const remembered = await AsyncStorage.getItem(REMEMBER_KEY);
  if (remembered !== 'true') return null;
  memoryToken = await readPersistedToken();
  return memoryToken;
}

export async function clearAuthToken() {
  memoryToken = null;
  await Promise.all([removePersistedToken(), AsyncStorage.removeItem(REMEMBER_KEY)]);
}

export async function shouldRememberSession() {
  return (await AsyncStorage.getItem(REMEMBER_KEY)) === 'true';
}
