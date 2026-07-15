import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  focusIndicators: boolean;
  largerTouchTargets: boolean;
  ttsEnabled: boolean;
  voiceSpeed: number;
  isOpen: boolean;
  hasVisited: boolean;
  // actions
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleDyslexiaFont: () => void;
  toggleFocusIndicators: () => void;
  toggleLargerTouchTargets: () => void;
  toggleTts: () => void;
  setVoiceSpeed: (speed: number) => void;
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
      largerTouchTargets: false,
      ttsEnabled: false,
      voiceSpeed: 1.0,
      isOpen: false,
      hasVisited: false,

      setFontSize: (size) => set({ fontSize: size }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
      toggleDyslexiaFont: () => set((s) => ({ dyslexiaFont: !s.dyslexiaFont })),
      toggleFocusIndicators: () => set((s) => ({ focusIndicators: !s.focusIndicators })),
      toggleLargerTouchTargets: () => set((s) => ({ largerTouchTargets: !s.largerTouchTargets })),
      toggleTts: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
      setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
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
          largerTouchTargets: false,
          ttsEnabled: false,
          voiceSpeed: 1.0,
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
        largerTouchTargets: state.largerTouchTargets,
        ttsEnabled: state.ttsEnabled,
        voiceSpeed: state.voiceSpeed,
        hasVisited: state.hasVisited,
      }),
    }
  )
);
