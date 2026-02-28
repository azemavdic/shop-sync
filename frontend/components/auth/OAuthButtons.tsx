import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../stores/authStore';
import { persistToken } from '../../hooks/useAuth';
import { loginWithGoogle, loginWithFacebook } from '../../services/auth.service';
import { useTranslation } from '../../i18n';
import { config } from '../../constants/config';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const facebookDiscovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

interface OAuthButtonsProps {
  onError?: (msg: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  loading?: boolean;
}

export function OAuthButtons({ onError, onLoadingChange, loading = false }: OAuthButtonsProps) {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'shopsyncx', path: 'redirect' });

  const [googleRequest, googleResponse, googlePrompt] = AuthSession.useAuthRequest(
    {
      clientId: config.googleClientId || 'placeholder',
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      usePKCE: true,
    },
    googleDiscovery
  );

  const [facebookRequest, facebookResponse, facebookPrompt] = AuthSession.useAuthRequest(
    {
      clientId: config.facebookAppId || 'placeholder',
      scopes: ['email', 'public_profile'],
      redirectUri,
      usePKCE: true,
    },
    facebookDiscovery
  );

  useEffect(() => {
    if (!googleResponse || googleResponse.type !== 'success' || !('params' in googleResponse)) return;
    const code = (googleResponse.params as { code?: string }).code;
    if (!code || !googleRequest?.codeVerifier) return;
    onLoadingChange?.(true);
    (async () => {
      try {
        const tokens = await AuthSession.exchangeCodeAsync(
          {
            clientId: config.googleClientId,
            code,
            redirectUri,
            extraParams: { code_verifier: googleRequest.codeVerifier },
          },
          googleDiscovery
        );
        const idToken = tokens.idToken;
        if (!idToken) throw new Error('Google did not return ID token');
        const res = await loginWithGoogle(idToken);
        setAuth(res.user, res.accessToken);
        await persistToken(res.accessToken);
        router.replace('/(tabs)');
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('loginFailed');
        onError?.(msg);
        if (msg.includes('fetch') || msg.includes('network')) {
          Alert.alert(t('connectionError'), t('connectionErrorMsg'));
        }
      } finally {
        onLoadingChange?.(false);
      }
    })();
  }, [googleResponse, googleRequest?.codeVerifier]);

  useEffect(() => {
    if (!facebookResponse || facebookResponse.type !== 'success' || !('params' in facebookResponse)) return;
    const code = (facebookResponse.params as { code?: string }).code;
    if (!code) return;
    onLoadingChange?.(true);
    (async () => {
      try {
        const res = await loginWithFacebook(code, redirectUri);
        setAuth(res.user, res.accessToken);
        await persistToken(res.accessToken);
        router.replace('/(tabs)');
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('loginFailed');
        onError?.(msg);
        if (msg.includes('fetch') || msg.includes('network')) {
          Alert.alert(t('connectionError'), t('connectionErrorMsg'));
        }
      } finally {
        onLoadingChange?.(false);
      }
    })();
  }, [facebookResponse]);

  return (
    <>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.oauthRow}>
        <TouchableOpacity
          style={styles.oauthBtn}
          onPress={() => {
            if (!config.googleClientId) {
              Alert.alert(t('oauthNotConfigured'), t('oauthGoogleSetup'));
              return;
            }
            if (googleRequest && !loading) googlePrompt();
          }}
          disabled={!googleRequest || loading}
        >
          <Ionicons name="logo-google" size={32} color="#4285F4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.oauthBtn}
          onPress={() => {
            if (!config.facebookAppId) {
              Alert.alert(t('oauthNotConfigured'), t('oauthFacebookSetup'));
              return;
            }
            if (facebookRequest && !loading) facebookPrompt();
          }}
          disabled={!facebookRequest || loading}
        >
          <Ionicons name="logo-facebook" size={32} color="#1877F2" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#4b5563',
  },
  dividerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  oauthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  oauthBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
});
