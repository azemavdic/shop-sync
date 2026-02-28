import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { config } from '../constants/config';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from '../lib/tokenStorage';

export function useAuth() {
  const { token, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        // Already have token in memory (e.g. from same session)
        if (token) {
          setIsLoading(false);
          return;
        }

        const storedToken = await getStoredToken();
        if (!storedToken) {
          setIsLoading(false);
          return;
        }

        // Restore token to store so API calls can use it
        useAuthStore.setState({ token: storedToken });

        // Verify session is still valid
        const res = await fetch(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!mounted) return;

        if (res.ok) {
          const user = await res.json();
          useAuthStore.setState({
            isAuthenticated: true,
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              name: user.name,
            },
          });
        } else {
          // Token expired or invalid - clear it
          useAuthStore.setState({ token: null, isAuthenticated: false, user: null });
          await removeStoredToken();
        }
      } catch {
        // Network or storage error - clear invalid token if we had one
        if (mounted) {
          const currentToken = useAuthStore.getState().token;
          if (currentToken) {
            useAuthStore.setState({ token: null, isAuthenticated: false, user: null });
            await removeStoredToken();
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { mounted = false; };
  }, []); // Run once on mount - token check is inside

  return { isAuthenticated, isLoading };
}

export async function persistToken(t: string) {
  await setStoredToken(t);
}

export async function clearToken() {
  await removeStoredToken();
}
