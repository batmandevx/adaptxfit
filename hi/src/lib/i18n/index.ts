'use client';

/**
 * AdaptiFit v2 lightweight i18n layer.
 *
 * Post-merge integration: mount the provider once around the routed app shell
 * (for example in `src/app/layout.tsx` or around the section renderer in
 * `src/app/page.tsx`):
 *
 * ```tsx
 * <I18nProvider>
 *   <AppSections />
 *   <AccessibilityWidget />
 * </I18nProvider>
 * ```
 *
 * The provider subscribes to the persisted accessibility-store locale, so no
 * locale prop is required. Components call `const t = useT()` and render
 * `t('namespace.key', { value })`. Missing translations fall back to English.
 */

import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import {
  DEFAULT_LOCALE,
  type Locale,
  type TranslationDictionary,
  type TranslationParams,
} from './types';
import { en } from './dicts/en';
import { hi } from './dicts/hi';
import { es } from './dicts/es';
import { fr } from './dicts/fr';
import { ta } from './dicts/ta';

export type TranslationKey = keyof typeof en;
export type TranslationInput = TranslationKey | (string & {});
export type TranslateFn = (key: TranslationInput, params?: TranslationParams) => string;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  hi,
  es,
  fr,
  ta,
};

const SPEECH_LOCALES: Record<Locale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  ta: 'ta-IN',
};

/**
 * BCP-47 speech tag for Web Speech API SpeechRecognition and TTS.
 * `voice-input.tsx` will consume this mapping after the Pillar C merge.
 */
export function speechLocale(locale: Locale): string {
  return SPEECH_LOCALES[locale] ?? SPEECH_LOCALES[DEFAULT_LOCALE];
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Translate outside React when needed; falls back from the selected locale to English. */
export function translate(locale: Locale, key: TranslationInput, params?: TranslationParams): string {
  const template = dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? String(key);
  return interpolate(template, params);
}

const I18nContext = createContext<I18nContextValue | null>(null);

const englishFallback: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAccessibilityStore((state) => state.locale);
  const setLocale = useAccessibilityStore((state) => state.setLocale);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale]
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? englishFallback;
}

export function useT(): TranslateFn {
  return useI18n().t;
}

export { DEFAULT_LOCALE, LOCALE_OPTIONS, LOCALES } from './types';
export type { Locale, LocaleOption, TranslationDictionary, TranslationParams } from './types';
