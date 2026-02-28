import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { useAuthStore } from '../../stores/authStore';
import { persistToken } from '../../hooks/useAuth';
import { login } from '../../services/auth.service';
import { useTranslation } from '../../i18n';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    setError('');
    if (!email.trim()) {
      setError(t('errorEmailRequired'));
      return;
    }
    if (!password) {
      setError(t('errorPasswordRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      setAuth(res.user, res.accessToken);
      await persistToken(res.accessToken);
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('loginFailed');
      setError(msg);
      if (msg.includes('fetch') || msg.includes('network')) {
        Alert.alert(t('connectionError'), t('connectionErrorMsg'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>ShopSyncX</Text>
          <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('email')}
            placeholder={t('emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label={t('password')}
            placeholder={t('passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          {error ? <Text style={styles.formError}>{error}</Text> : null}
          <Button
            title={t('signIn')}
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <OAuthButtons onError={setError} onLoadingChange={setLoading} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('dontHaveAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <Text style={styles.link}>{t('signUp')}</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  form: {
    marginBottom: 32,
  },
  formError: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  link: {
    fontSize: 15,
    color: '#60a5fa',
    fontWeight: '600',
  },
});
