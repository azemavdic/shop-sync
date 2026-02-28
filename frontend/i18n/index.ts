import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { translations, type Locale, type TranslationKey } from './translations';

const LANG_KEY = 'shopsyncx_lang';

// In-memory fallback when storage is unavailable (e.g. web)
let memoryFallback: Locale = 'bs';

async function getStoredLocale(): Promise<Locale> {
  try {
    const stored = await SecureStore.getItemAsync(LANG_KEY);
    return stored === 'en' ? 'en' : 'bs';
  } catch {
    return memoryFallback;
  }
}

async function setStoredLocale(locale: Locale): Promise<void> {
  memoryFallback = locale;
  try {
    await SecureStore.setItemAsync(LANG_KEY, locale);
  } catch {
    // Persist failed - memory fallback for this session
  }
}

interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  isLoading: boolean;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'bs',
  isLoading: true,
  setLocale: async (locale: Locale) => {
    await setStoredLocale(locale);
    set({ locale });
  },
}));

export function initLanguage() {
  getStoredLocale()
    .then((locale) => {
      useLanguageStore.setState({ locale, isLoading: false });
    })
    .catch(() => {
      useLanguageStore.setState({ locale: 'bs', isLoading: false });
    });
}

export function useTranslation() {
  const locale = useLanguageStore((s) => s.locale);
  const t = (key: TranslationKey): string => {
    const value = translations[locale][key];
    return value ?? key;
  };
  const tWithParams = (key: TranslationKey, params: Record<string, string>): string => {
    let value = translations[locale][key] ?? key;
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return value;
  };
  return { t, tWithParams, locale };
}
