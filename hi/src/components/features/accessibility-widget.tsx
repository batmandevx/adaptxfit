'use client';

import { useEffect, useCallback } from 'react';
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
} from 'lucide-react';

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
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Section Header Component ─────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1">
      <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        {title}
      </h3>
    </div>
  );
}

// ─── Main Accessibility Widget ────────────────────────────────────────────────

export default function AccessibilityWidget() {
  const store = useAccessibilityStore();

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
  }, [
    store.fontSize,
    store.highContrast,
    store.reducedMotion,
    store.dyslexiaFont,
    store.focusIndicators,
    store.largerTouchTargets,
  ]);

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
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      store.fontSize === size
        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
        : 'bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
    }`;

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        variants={triggerVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        onClick={handleToggleOpen}
        className={`fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2 ${
          !store.hasVisited ? 'a11y-pulse-attention' : ''
        }`}
        aria-label={store.isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
        aria-expanded={store.isOpen}
        aria-haspopup="dialog"
      >
        <Accessibility className="w-5 h-5" />
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
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-label="Accessibility Settings"
              aria-modal="true"
              className="fixed bottom-36 right-6 z-[60] w-[calc(100vw-3rem)] sm:w-80 a11y-panel-glass rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-emerald-500/10 dark:border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Accessibility className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Accessibility Settings
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                      Customize your experience
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-emerald-500/10"
                  onClick={() => store.setOpen(false)}
                  aria-label="Close accessibility settings"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="max-h-[60vh]">
                <div className="px-4 pb-4 pt-1 space-y-1">
                  {/* ── Visual Settings ── */}
                  <SectionHeader
                    icon={<Contrast className="w-3.5 h-3.5" />}
                    title="Visual"
                  />

                  <SettingRow
                    icon={<Type className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
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
                    icon={<Contrast className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    label="High Contrast"
                    description="Increase visual contrast"
                  >
                    <Switch
                      checked={store.highContrast}
                      onCheckedChange={store.toggleHighContrast}
                      aria-label="Toggle high contrast mode"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<Move className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    label="Reduced Motion"
                    description="Disable animations"
                  >
                    <Switch
                      checked={store.reducedMotion}
                      onCheckedChange={store.toggleReducedMotion}
                      aria-label="Toggle reduced motion"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    label="Dyslexia Font"
                    description="Readable font style"
                  >
                    <Switch
                      checked={store.dyslexiaFont}
                      onCheckedChange={store.toggleDyslexiaFont}
                      aria-label="Toggle dyslexia-friendly font"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  {/* ── Interaction Settings ── */}
                  <SectionHeader
                    icon={<Focus className="w-3.5 h-3.5" />}
                    title="Interaction"
                  />

                  <SettingRow
                    icon={<Focus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    label="Focus Indicators"
                    description="Prominent focus rings"
                  >
                    <Switch
                      checked={store.focusIndicators}
                      onCheckedChange={store.toggleFocusIndicators}
                      aria-label="Toggle focus indicators"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<Keyboard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    label="Keyboard Navigation"
                    description="Enhanced shortcuts"
                  >
                    <Switch
                      checked={store.focusIndicators}
                      onCheckedChange={store.toggleFocusIndicators}
                      aria-label="Toggle keyboard navigation enhancements"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={<Pointer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    label="Larger Touch Targets"
                    description="Bigger tap areas"
                  >
                    <Switch
                      checked={store.largerTouchTargets}
                      onCheckedChange={store.toggleLargerTouchTargets}
                      aria-label="Toggle larger touch targets"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  {/* ── Screen Reader ── */}
                  <SectionHeader
                    icon={<Volume2 className="w-3.5 h-3.5" />}
                    title="Screen Reader"
                  />

                  <SettingRow
                    icon={<Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                    label="TTS for Page Content"
                    description="Read section titles aloud"
                  >
                    <Switch
                      checked={store.ttsEnabled}
                      onCheckedChange={store.toggleTts}
                      aria-label="Toggle text-to-speech"
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </SettingRow>

                  {store.ttsEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3 py-2 pl-9">
                        <Gauge className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground shrink-0">0.5x</span>
                          <Slider
                            min={0.5}
                            max={2}
                            step={0.1}
                            value={[store.voiceSpeed]}
                            onValueChange={(v) => store.setVoiceSpeed(v[0])}
                            aria-label="Voice speed"
                            className="flex-1 data-[state=checked]:bg-emerald-500"
                          />
                          <span className="text-[10px] text-muted-foreground shrink-0">2.0x</span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 w-8 text-right">
                          {store.voiceSpeed.toFixed(1)}x
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Reset ── */}
                  <div className="pt-3 border-t border-emerald-500/10 dark:border-emerald-500/10 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 dark:hover:text-rose-400 transition-colors"
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
