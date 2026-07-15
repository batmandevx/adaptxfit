import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccessibilitySettings, ColorVisionMode, ThemeMode } from '../types';
import { createDefaultAccessibility } from '../data/defaults';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../utils/storage';

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  toggle: (key: BooleanSettingKey) => void;
  setSetting: (key: BooleanSettingKey, value: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setColorVision: (mode: ColorVisionMode) => void;
  applyAll: (settings: AccessibilitySettings) => void;
  reset: () => void;
}

/** Keys of AccessibilitySettings whose value is a boolean (toggleable). */
export type BooleanSettingKey =
  | 'highContrast'
  | 'largeText'
  | 'reducedMotion'
  | 'dyslexiaFont'
  | 'simpleLanguage'
  | 'voiceGuidance'
  | 'captions'
  | 'soundCues';

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => ({
    ...createDefaultAccessibility(),
    ...(loadJSON<Partial<AccessibilitySettings>>(STORAGE_KEYS.accessibility) ?? {}),
  }));

  // Reflect settings onto the document root so CSS variables/themes respond
  // globally. Driven by data-attributes rather than colour alone.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.colorVision = settings.colorVision;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.dataset.text = settings.largeText ? 'large' : 'normal';
    root.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
    root.dataset.font = settings.dyslexiaFont ? 'dyslexic' : 'default';
    root.style.colorScheme = settings.theme;
    saveJSON(STORAGE_KEYS.accessibility, settings);
  }, [settings]);

  const toggle = useCallback((key: BooleanSettingKey) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setSetting = useCallback((key: BooleanSettingKey, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setColorVision = useCallback((mode: ColorVisionMode) => {
    setSettings((prev) => ({ ...prev, colorVision: mode }));
  }, []);

  const applyAll = useCallback((next: AccessibilitySettings) => {
    setSettings(next);
  }, []);

  const reset = useCallback(() => {
    setSettings(createDefaultAccessibility());
  }, []);

  const value = useMemo(
    () => ({ settings, toggle, setSetting, setTheme, toggleTheme, setColorVision, applyAll, reset }),
    [settings, toggle, setSetting, setTheme, toggleTheme, setColorVision, applyAll, reset],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
