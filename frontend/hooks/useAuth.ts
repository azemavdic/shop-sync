import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';
import { config } from '../constants/config';

const TOKEN_KEY = 'shopsyncx_token';

export function useAuth() {
  const { token, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (mounted && storedToken && !token) {
          // Restore token immediately so other components can use it
          useAuthStore.setState({ token: storedToken });
          // Verify session with API
          const res = await fetch(`${config.apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const user = await res.json();
            useAuthStore.setState({
              isAuthenticated: true,
              user: { id: user.id, email: user.email, name: user.name },
            });
          } else {
            // Token invalid or expired - clear it
            useAuthStore.setState({ token: null });
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }
      } catch {
        // SecureStore or network error - ignore
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (token) {
      setIsLoading(false);
      return;
    }
    checkAuth();
    return () => { mounted = false; };
  }, [token]);

  return { isAuthenticated, isLoading };
}

export async function persistToken(t: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, t);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
