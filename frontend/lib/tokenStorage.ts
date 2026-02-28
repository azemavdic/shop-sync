/**
 * Platform-aware token storage for persistent auth.
 * - iOS/Android: SecureStore (encrypted, keychain/keystore)
 * - Web: AsyncStorage (SecureStore not available)
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'shopsyncx_token';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export async function getStoredToken(): Promise<string | null> {
  try {
    if (isNative) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    if (isNative) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Storage failed - token won't persist
  }
}

export async function removeStoredToken(): Promise<void> {
  try {
    if (isNative) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore
  }
}
