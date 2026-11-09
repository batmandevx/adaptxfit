import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/types';

interface AccessibilityState {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  largerTouchTargets: boolean;
  ttsEnabled: boolean;
  voiceSpeed: number;
  locale: Locale;
  isOpen: boolean;
  hasVisited: boolean;
  // actions
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleDyslexiaFont: () => void;
  toggleFocusIndicators: () => void;
  toggleKeyboardNavigation: () => void;
  toggleLargerTouchTargets: () => void;
  toggleTts: () => void;
  setVoiceSpeed: (speed: number) => void;
  setLocale: (locale: Locale) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  markVisited: () => void;
  resetAll: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      dyslexiaFont: false,
      focusIndicators: false,
      keyboardNavigation: false,
      largerTouchTargets: false,
      ttsEnabled: false,
      voiceSpeed: 1.0,
      locale: DEFAULT_LOCALE,
      isOpen: false,
      hasVisited: false,

      setFontSize: (size) => set({ fontSize: size }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
      toggleDyslexiaFont: () => set((s) => ({ dyslexiaFont: !s.dyslexiaFont })),
      toggleFocusIndicators: () => set((s) => ({ focusIndicators: !s.focusIndicators })),
      toggleKeyboardNavigation: () => set((s) => ({ keyboardNavigation: !s.keyboardNavigation })),
      toggleLargerTouchTargets: () => set((s) => ({ largerTouchTargets: !s.largerTouchTargets })),
      toggleTts: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
      setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
      setLocale: (locale) => set({ locale }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      markVisited: () => set({ hasVisited: true }),
      resetAll: () =>
        set({
          fontSize: 'medium',
          highContrast: false,
          reducedMotion: false,
          dyslexiaFont: false,
          focusIndicators: false,
          keyboardNavigation: false,
          largerTouchTargets: false,
          ttsEnabled: false,
          voiceSpeed: 1.0,
          locale: DEFAULT_LOCALE,
        }),
    }),
    {
      name: 'adaptifit-accessibility',
      partialize: (state) => ({
        fontSize: state.fontSize,
        highContrast: state.highContrast,
        reducedMotion: state.reducedMotion,
        dyslexiaFont: state.dyslexiaFont,
        focusIndicators: state.focusIndicators,
        keyboardNavigation: state.keyboardNavigation,
        largerTouchTargets: state.largerTouchTargets,
        ttsEnabled: state.ttsEnabled,
        voiceSpeed: state.voiceSpeed,
        locale: state.locale,
        hasVisited: state.hasVisited,
      }),
    }
  )
);
