'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accessibility,
  X,
  Type,
  Contrast,
  Move,
  BookOpen,
  Focus,
  Keyboard,
  Pointer,
  Volume2,
  Gauge,
  RotateCcw,
  Languages,
} from 'lucide-react';
import {
  LOCALE_OPTIONS,
  speechLocale,
  translate,
  useT,
  type Locale,
} from '@/lib/i18n';
import { useReduced } from '@/components/ui/aurora';

// ─── Panel Animation Variants ─────────────────────────────────────────────────

const panelVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    x: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const triggerVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20, delay: 0.5 },
  },
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
};

// Reduced-motion equivalents: opacity-only, 120–160ms (design.md §9.5).
const reducedPanelVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.14 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const reducedTriggerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.14, delay: 0.2 } },
  hover: {},
  tap: {},
};

// ─── Settings Row Component ───────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ icon, label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center shrink-0 [&>svg]:text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
          {description && (
            <p className="text-xs text-foreground-subtle leading-tight mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Switch with an explicit On/Off state label (features.md — accessibility-widget). */
function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-7 text-right text-xs font-semibold text-foreground-subtle" aria-hidden="true">
        {checked ? 'On' : 'Off'}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="data-[state=checked]:bg-primary"
      />
    </span>
  );
}

// ─── Section Header Component ─────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1">
      <span className="text-primary">{icon}</span>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
        {title}
      </h3>
    </div>
  );
}

// ─── Main Accessibility Widget ────────────────────────────────────────────────

export default function AccessibilityWidget() {
  const store = useAccessibilityStore();
  const t = useT();
  const reduced = useReduced();
  const languageRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [languageAnnouncement, setLanguageAnnouncement] = useState('');

  const selectLanguage = useCallback(
    (locale: Locale) => {
      const option = LOCALE_OPTIONS.find((item) => item.code === locale);
      const nativeName = option?.nativeName ?? locale;
      store.setLocale(locale);
      setLanguageAnnouncement(translate(locale, 'accessibility.language.changed', { language: nativeName }));

      if (store.ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          translate(locale, 'accessibility.language.changed', { language: nativeName })
        );
        utterance.lang = speechLocale(locale);
        utterance.rate = store.voiceSpeed;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    },
    [store]
  );

  const handleLanguageKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = Math.max(
        0,
        LOCALE_OPTIONS.findIndex((option) => option.code === store.locale)
      );
      let nextIndex = currentIndex;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % LOCALE_OPTIONS.length;
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + LOCALE_OPTIONS.length) % LOCALE_OPTIONS.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = LOCALE_OPTIONS.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      const nextLocale = LOCALE_OPTIONS[nextIndex].code;
      selectLanguage(nextLocale);
      requestAnimationFrame(() => languageRefs.current[nextIndex]?.focus());
    },
    [selectLanguage, store.locale]
  );

  // Apply root CSS classes based on store state
  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    // Font size class
    const fontClasses = ['a11y-font-small', 'a11y-font-medium', 'a11y-font-large'];
    fontClasses.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`a11y-font-${store.fontSize}`);

    // Toggle classes
    const toggleMap: Record<string, boolean> = {
      'a11y-high-contrast': store.highContrast,
      'a11y-reduced-motion': store.reducedMotion,
      'a11y-dyslexia-font': store.dyslexiaFont,
      'a11y-focus-indicators': store.focusIndicators,
      'a11y-large-touch': store.largerTouchTargets,
    };

    Object.entries(toggleMap).forEach(([cls, active]) => {
      if (active) {
        root.classList.add(cls);
      } else {
        root.classList.remove(cls);
      }
    });

    // Expose the in-app reduced-motion toggle to JS-driven (framer-motion)
    // animators, which don't read CSS media queries.
    if (store.reducedMotion) {
      root.dataset.reducedMotion = 'true';
    } else {
      delete root.dataset.reducedMotion;
    }
  }, [
    store.fontSize,
    store.highContrast,
    store.reducedMotion,
    store.dyslexiaFont,
    store.focusIndicators,
    store.largerTouchTargets,
  ]);

  // First visit (nothing persisted yet): seed the Reduced Motion preference
  // from the OS-level prefers-reduced-motion setting.
  useEffect(() => {
    try {
      if (
        window.localStorage.getItem('adaptifit-accessibility') === null &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        !useAccessibilityStore.getState().reducedMotion
      ) {
        useAccessibilityStore.getState().toggleReducedMotion();
      }
    } catch { /* storage/matchMedia unavailable — ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark as visited after first open
  const handleToggleOpen = useCallback(() => {
    store.toggleOpen();
    if (!store.hasVisited) {
      store.markVisited();
    }
  }, [store]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.isOpen) {
        store.setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  // Font size button style helper
  const fontSizeBtnClass = (size: 'small' | 'medium' | 'large') =>
    `min-h-11 min-w-11 px-3 py-1.5 rounded-[14px] text-xs font-medium transition-colors ${
      store.fontSize === size
        ? 'bg-primary text-primary-foreground'
        : 'bg-surface-raised text-foreground-muted hover:bg-primary-soft hover:text-primary'
    }`;

  return (
    <>
      {/* Floating Trigger Button — 56px FAB, right 24 / bottom 96 */}
      <motion.button
        variants={(reduced ? reducedTriggerVariants : triggerVariants) as typeof triggerVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        onClick={handleToggleOpen}
        className={`fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
          !store.hasVisited ? 'a11y-pulse-attention' : ''
        }`}
        style={{ boxShadow: 'var(--shadow-lg), var(--shadow-glow-primary)' }}
        aria-label={store.isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
        aria-expanded={store.isOpen}
        aria-haspopup="dialog"
      >
        <Accessibility className="w-6 h-6" />
      </motion.button>

      {/* Panel Overlay */}
      <AnimatePresence>
        {store.isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[55]"
              onClick={() => store.setOpen(false)}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              variants={(reduced ? reducedPanelVariants : panelVariants) as typeof panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-label="Accessibility Settings"
              aria-modal="true"
              className="fixed bottom-[168px] right-6 z-[60] w-[calc(100vw-3rem)] sm:w-[360px] glass-overlay rounded-[24px] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-soft">
                    <Accessibility className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Accessibility Settings
                    </h2>
                    <p className="text-xs text-foreground-subtle">
                      Customize your experience
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-primary-soft"
                  onClick={() => store.setOpen(false)}
                  aria-label="Close accessibility settings"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="max-h-[60vh]">
                <div className="px-4 pb-4 pt-1 space-y-1">
                  {/* ── Language / Coaching Locale ── */}
                  <SectionHeader
                    icon={<Languages className="w-3.5 h-3.5" />}
                    title={t('accessibility.language.title')}
                  />
                  <div className="pb-2">
                    <p className="text-xs text-muted-foreground pb-2">
                      {t('accessibility.language.description')}
                    </p>
                    <div
                      role="radiogroup"
                      aria-label={t('accessibility.language.title')}
                      onKeyDown={handleLanguageKeyDown}
                      className="grid grid-cols-1 gap-1.5"
                    >
                      {LOCALE_OPTIONS.map((option, index) => {
                        const selected = store.locale === option.code;
                        return (
                          <button
                            key={option.code}
                            ref={(element) => {
                              languageRefs.current[index] = element;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => selectLanguage(option.code)}
                            className={`flex min-h-11 items-center gap-2.5 rounded-[14px] border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                              selected
                                ? 'border-primary/50 bg-primary-soft text-primary'
                                : 'border-border/60 bg-surface-raised/60 text-foreground hover:border-primary/30 hover:bg-primary-soft/60'
                            }`}
                          >
                            <span aria-hidden="true" className="text-base leading-none">
                              {option.flag}
                            </span>
                            <span className="flex-1 font-medium">{option.nativeName}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.englishName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="sr-only" aria-live="polite">
                      {languageAnnouncement}
                    </p>
                  </div>

                  {/* ── Visual Settings ── */}
                  <SectionHeader
                    icon={<Contrast className="w-3.5 h-3.5" />}
                    title="Visual"
                  />

                  <SettingRow
                    icon={<Type className="w-3.5 h-3.5" />}
                    label="Font Size"
                    description="Adjust text size"
                  >
                    <div className="flex gap-1">
                      <button
                        className={fontSizeBtnClass('small')}
                        onClick={() => store.setFontSize('small')}
                        aria-label="Small font size"
                        aria-pressed={store.fontSize === 'small'}
                      >
                        S
                      </button>
                      <button
                        className={fontSizeBtnClass('medium')}
                        onClick={() => store.setFontSize('medium')}
                        aria-label="Medium font size"
                        aria-pressed={store.fontSize === 'medium'}
                      >
                        M
                      </button>
                      <button
                        className={fontSizeBtnClass('large')}
                        onClick={() => store.setFontSize('large')}
                        aria-label="Large font size"
                        aria-pressed={store.fontSize === 'large'}
                      >
                        L
                      </button>
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={<Contrast className="w-3.5 h-3.5" />}
                    label="High Contrast"
                    description="Increase visual contrast"
                  >
                    <ToggleSwitch
                      checked={store.highContrast}
                      onCheckedChange={store.toggleHighContrast}
                      label="Toggle high contrast mode"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<Move className="w-3.5 h-3.5" />}
                    label="Reduced Motion"
                    description="Disable animations"
                  >
                    <ToggleSwitch
                      checked={store.reducedMotion}
                      onCheckedChange={store.toggleReducedMotion}
                      label="Toggle reduced motion"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<BookOpen className="w-3.5 h-3.5" />}
                    label="Dyslexia Font"
                    description="Readable font style"
                  >
                    <ToggleSwitch
                      checked={store.dyslexiaFont}
                      onCheckedChange={store.toggleDyslexiaFont}
                      label="Toggle dyslexia-friendly font"
                    />
                  </SettingRow>

                  {/* ── Interaction Settings ── */}
                  <SectionHeader
                    icon={<Focus className="w-3.5 h-3.5" />}
                    title="Interaction"
                  />

                  <SettingRow
                    icon={<Focus className="w-3.5 h-3.5" />}
                    label="Focus Indicators"
                    description="Prominent focus rings"
                  >
                    <ToggleSwitch
                      checked={store.focusIndicators}
                      onCheckedChange={store.toggleFocusIndicators}
                      label="Toggle focus indicators"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<Keyboard className="w-3.5 h-3.5" />}
                    label="Keyboard Navigation"
                    description="Enhanced shortcuts"
                  >
                    <ToggleSwitch
                      checked={store.keyboardNavigation}
                      onCheckedChange={store.toggleKeyboardNavigation}
                      label="Toggle keyboard navigation enhancements"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<Pointer className="w-3.5 h-3.5" />}
                    label="Larger Touch Targets"
                    description="Bigger tap areas"
                  >
                    <ToggleSwitch
                      checked={store.largerTouchTargets}
                      onCheckedChange={store.toggleLargerTouchTargets}
                      label="Toggle larger touch targets"
                    />
                  </SettingRow>

                  {/* ── Screen Reader ── */}
                  <SectionHeader
                    icon={<Volume2 className="w-3.5 h-3.5" />}
                    title="Screen Reader"
                  />

                  <SettingRow
                    icon={<Volume2 className="w-3.5 h-3.5" />}
                    label="TTS for Page Content"
                    description="Read section titles aloud"
                  >
                    <ToggleSwitch
                      checked={store.ttsEnabled}
                      onCheckedChange={store.toggleTts}
                      label="Toggle text-to-speech"
                    />
                  </SettingRow>

                  {store.ttsEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: reduced ? 0.12 : 0.2 }}
                    >
                      <div className="flex items-center gap-3 py-2 pl-9">
                        <Gauge className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-foreground-subtle shrink-0">0.5x</span>
                          <Slider
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[store.voiceSpeed]}
                            onValueChange={(v) => store.setVoiceSpeed(v[0])}
                            aria-label="Voice speed"
                            className="flex-1"
                          />
                          <span className="text-xs text-foreground-subtle shrink-0">2.0x</span>
                        </div>
                        <span className="text-xs font-medium text-primary w-8 text-right">
                          {store.voiceSpeed.toFixed(1)}x
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Reset ── */}
                  <div className="pt-3 border-t border-border/60 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-11 rounded-[14px] text-xs hover:bg-danger-soft hover:text-danger hover:border-danger/40 transition-colors"
                      onClick={store.resetAll}
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5" />
                      Reset All Settings
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
