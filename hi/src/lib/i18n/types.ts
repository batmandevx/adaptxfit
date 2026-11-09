export const LOCALES = ['en', 'hi', 'es', 'fr', 'ta'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export type TranslationParams = Record<string, string | number>;
export type TranslationDictionary = Record<string, string>;

export interface LocaleOption {
  code: Locale;
  englishName: string;
  nativeName: string;
  flag: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', englishName: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', englishName: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
];
