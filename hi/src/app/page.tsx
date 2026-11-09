'use client';

/**
 * AdaptiFit v2 — Clinical Aurora application shell (shell.md).
 *
 * Structure: skip links → ambient layer → header → [sidebar | main] →
 * footer → overlays (mobile nav sheet, command palette, voice help,
 * accessibility widget, AI chat, PWA install, toasts).
 *
 * Functional wiring preserved from the previous shell:
 * - VoiceCommanderProvider + I18nProvider + MotionConfig nesting
 * - Voice Commander chrome registrations (system.help, system.back)
 * - Skip links → #main-content and #voice-commands
 * - #voice-commander-live-region aria-live region
 * - ?section=... deep-linking
 * - useAppStore activeSection/setActiveSection with aria-current="page"
 * - Header utility handlers (notifications, language → accessibility
 *   widget, voice settings, theme toggle, avatar → profile setup)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig, LayoutGroup } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAppStore, type AppSection } from '@/stores/app-store';
import { useAccessibilityStore } from '@/stores/accessibility-store';
import Dashboard from '@/components/features/dashboard';
import BodyScan from '@/components/features/body-scan';
import LiveCoach from '@/components/features/live-coach';
import ExerciseLibrary from '@/components/features/exercise-library';
import AdaptiveWorkout from '@/components/features/adaptive-workout';
import MindGym from '@/components/features/mind-gym';
import MoodMonitor from '@/components/features/mood-monitor';
import Nutrition from '@/components/features/nutrition';
import Community from '@/components/features/community';
import Wearable from '@/components/features/wearable';
import BreathingExercise from '@/components/features/breathing-exercise';
import CrisisSupport from '@/components/features/crisis-support';
import AIChat from '@/components/features/ai-chat';
import AccessibilityWidget from '@/components/features/accessibility-widget';
import ProfileSetup from '@/components/features/profile-setup';
import NotificationCenter from '@/components/features/notification-center';
import VoiceInput from '@/components/features/voice-input';
import VoiceSettings from '@/components/features/voice-settings';
import ToastProvider from '@/components/features/toast-provider';
import { VoiceCommanderProvider, useCommander } from '@/voice/use-commander';
import { I18nProvider } from '@/lib/i18n';
import { ANNOUNCER_REGION_ID, announce } from '@/voice/announcer';
import { describeCommands } from '@/voice/commander';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AmbientBackground,
  BodyHalo,
  BrandMark,
  GlassPanel,
  SectionHeader,
  useReduced,
  EASE,
  SPRING,
} from '@/components/ui/aurora';
import { cn } from '@/lib/utils';
import {
  Home as HomeIcon,
  LayoutDashboard,
  ScanSearch,
  Video,
  Dumbbell,
  Activity,
  Brain,
  Wind,
  HeartPulse,
  Apple,
  Users,
  Watch,
  ShieldAlert,
  Sparkles,
  Menu,
  Bell,
  Languages,
  AudioLines,
  Sun,
  Moon,
  CircleHelp,
  Search,
  Mic,
  WifiOff,
  ChevronRight,
  Accessibility as AccessibilityIcon,
  Pencil,
  type LucideIcon,
} from 'lucide-react';

/* ── Navigation model (shell.md §3.3 — exact labels, ids unchanged) ──────── */

interface NavItem {
  id: AppSection;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'home', label: 'Home', icon: HomeIcon },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Train',
    items: [
      { id: 'body-scan', label: 'Body Scan', icon: ScanSearch },
      { id: 'live-coach', label: 'Live Coach', icon: Video },
      { id: 'exercises', label: 'Exercises', icon: Dumbbell },
      { id: 'adaptive-workout', label: 'Adaptive Workout', icon: Activity },
    ],
  },
  {
    label: 'Mind',
    items: [
      { id: 'mind-gym', label: 'Mind Gym', icon: Brain },
      { id: 'breathing', label: 'Breathing', icon: Wind },
      { id: 'mood', label: 'Mood', icon: HeartPulse },
    ],
  },
  {
    label: 'Lifestyle',
    items: [
      { id: 'nutrition', label: 'Nutrition', icon: Apple },
      { id: 'community', label: 'Community', icon: Users },
      { id: 'wearable', label: 'Wearable', icon: Watch },
    ],
  },
  {
    label: 'Safety',
    items: [{ id: 'crisis', label: 'Crisis Support', icon: ShieldAlert }],
  },
];

const NAV_FLAT: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

const LOCALE_BADGES: Record<string, string> = {
  en: 'EN',
  hi: 'हिं',
  es: 'ES',
  fr: 'FR',
  ta: 'த',
};

/* ── Theme toggle — 180° icon rotation over 240ms; reduced = opacity only ── */

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const reduced = useReduced();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground',
          className,
        )}
        aria-label="Switch theme"
      >
        <Sun className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors duration-[120ms] hover:bg-surface-raised hover:text-foreground',
        className,
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -180 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 180 }}
          transition={{ duration: reduced ? 0.12 : 0.24, ease: EASE.standard }}
          className="flex"
        >
          {isDark ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/* ── Language quick-switch — opens the accessibility widget (UX-12) ──────── */

function HeaderLanguageButton() {
  const locale = useAccessibilityStore((s) => s.locale);
  return (
    <button
      type="button"
      className="flex h-11 items-center gap-1.5 rounded-full px-3 text-foreground-muted transition-colors duration-[120ms] hover:bg-surface-raised hover:text-foreground"
      aria-label="Change language"
      onClick={() => useAccessibilityStore.getState().setOpen(true)}
    >
      <Languages className="h-5 w-5" aria-hidden="true" />
      <span className="hidden text-xs font-semibold uppercase xl:inline">
        {LOCALE_BADGES[locale] ?? locale.toUpperCase()}
      </span>
    </button>
  );
}

/* ── Assistive typing line (shell.md §5.3) ───────────────────────────────── */

const TYPING_PREFIX = 'Today it can help you';
const TYPING_PHRASES = [
  'rebuild strength safely.',
  'train with voice guidance.',
  'track pain and recovery.',
  'find a calmer rhythm.',
];
const TYPING_STATIC =
  'Today it can help you rebuild strength safely, train with voice guidance, track pain and recovery, and find a calmer rhythm.';

function AssistiveTypingLine({ startDelay = 650 }: { startDelay?: number }) {
  const reduced = useReduced();
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [reduced, startDelay]);

  useEffect(() => {
    if (reduced || !started) return;
    const currentText = TYPING_PHRASES[textIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentText.length) {
            setCharIndex(charIndex + 1);
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % TYPING_PHRASES.length);
        }
      },
      isDeleting ? 30 : 80,
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, reduced, started]);

  return (
    <p className="text-lg leading-[30px] text-foreground-muted">
      {/* Screen readers always get the full static sentence */}
      <span className="sr-only">{TYPING_STATIC}</span>
      <span aria-hidden="true">
        {TYPING_PREFIX}{' '}
        {reduced ? (
          TYPING_STATIC.slice(TYPING_PREFIX.length + 1)
        ) : (
          <>
            {TYPING_PHRASES[textIndex].substring(0, charIndex)}
            <span className="typing-cursor-bar" />
          </>
        )}
      </span>
    </p>
  );
}

/* ── Count-up metric (shell.md §6.2 — 700ms, reduced renders final) ──────── */

function CountUp({ target, active }: { target: number; active: boolean }) {
  const reduced = useReduced();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 700, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, target]);

  return <>{value}</>;
}

/* ── Nav item (shell.md §3.4 / design.md §10.4) ──────────────────────────── */

function NavItemButton({
  item,
  active,
  onSelect,
  size = 'sidebar',
  entranceDelay = 0,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (id: AppSection) => void;
  size?: 'sidebar' | 'sheet';
  entranceDelay?: number;
}) {
  const reduced = useReduced();
  const Icon = item.icon;
  const isSheet = size === 'sheet';

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduced
          ? { duration: 0.14, ease: 'linear', delay: entranceDelay }
          : { duration: 0.24, ease: EASE.careOut, delay: entranceDelay }
      }
    >
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-[16px] px-3 text-left transition-transform duration-[120ms] hover:translate-x-0.5',
          isSheet ? 'min-h-14' : 'min-h-[52px]',
          active
            ? 'nav-item-active'
            : 'border border-transparent hover:bg-surface-raised focus-visible:bg-surface-raised',
        )}
      >
      {/* 3px left rail — shared layout on desktop, instant when reduced */}
      {active &&
        (reduced || isSheet ? (
          <span
            aria-hidden="true"
            className="absolute left-0 top-[14px] h-6 w-[3px] rounded-full bg-primary"
          />
        ) : (
          <motion.span
            layoutId="active-nav-rail"
            transition={SPRING.soft}
            aria-hidden="true"
            className="absolute left-0 top-[14px] h-6 w-[3px] rounded-full bg-primary"
          />
        ))}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl transition-colors duration-[120ms]',
          active
            ? 'bg-primary-soft text-primary'
            : 'text-foreground-muted group-hover:text-primary',
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 2} />
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 text-[15px] font-semibold leading-snug',
          active
            ? 'text-foreground'
            : 'text-foreground-muted group-hover:text-foreground',
        )}
      >
        {item.label}
      </span>
      <ChevronRight
        aria-hidden="true"
        className={cn(
          'h-4 w-4 shrink-0 transition-opacity duration-[120ms]',
          active
            ? 'text-primary opacity-100'
            : 'text-foreground-subtle opacity-0 group-hover:opacity-100',
        )}
      />
      </button>
    </motion.div>
  );
}

/* ── Desktop sidebar (shell.md §3) ───────────────────────────────────────── */

function SidebarNav({
  activeSection,
  onSelect,
}: {
  activeSection: AppSection;
  onSelect: (id: AppSection) => void;
}) {
  const profileSetupComplete = useAppStore((s) => s.profileSetupComplete);
  const completion = profileSetupComplete ? 100 : 80;

  return (
    <aside
      aria-label="Primary navigation"
      className="sticky top-[72px] hidden h-[calc(100svh-72px)] w-[280px] shrink-0 flex-col border-r border-border/80 lg:flex"
      style={{
        background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col pb-5 pl-5 pr-4 pt-5">
        {/* Brand mini panel (shell.md §3.2) — informational, not clickable */}
        <div className="mb-5 flex h-16 items-center gap-3 rounded-[18px] border border-border bg-surface-raised px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
              Care mode
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              Adaptive Recovery
            </p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
          >
            <Sparkles className="h-4 w-4" />
          </span>
        </div>

        <ScrollArea className="min-h-0 flex-1 -mr-2 pr-2">
          <nav aria-label="Sections">
            <LayoutGroup>
              {NAV_GROUPS.map((group, gi) => (
                <div key={group.label} className="mt-3 first:mt-0">
                  <p className="mb-2 mt-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item, ii) => (
                      <NavItemButton
                        key={item.id}
                        item={item}
                        active={activeSection === item.id}
                        onSelect={onSelect}
                        entranceDelay={gi * 0.04 + ii * 0.03}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </LayoutGroup>
          </nav>
        </ScrollArea>

        {/* Sidebar footer (shell.md §3.5) */}
        <div className="mt-4 border-t border-border/80 pt-4">
          <div className="glass-panel rounded-[18px] p-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
              >
                <AccessibilityIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Access first</p>
                <p className="mt-0.5 text-xs leading-[18px] text-foreground-muted">
                  Tune motion, contrast, text, and voice.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => useAccessibilityStore.getState().setOpen(true)}
              className="btn-aurora-secondary mt-3 flex h-11 w-full items-center justify-center rounded-[14px] text-sm font-semibold"
            >
              Open settings
            </button>
          </div>

          <button
            type="button"
            onClick={() => useAppStore.getState().setProfileSetupOpen(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left hover:bg-surface-raised"
            aria-label={`Profile ${completion}% complete — open profile setup`}
          >
            <ProfileRing percent={completion} size={36} />
            <span className="text-sm font-medium text-foreground-muted">
              Profile {completion}%
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* Small SVG progress ring (design.md §10.10 — value always shown as text) */
function ProfileRing({ percent, size = 36 }: { percent: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${percent}%`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="color-mix(in srgb, var(--border) 45%, transparent)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - percent / 100)}
      />
    </svg>
  );
}

/* ── Mobile navigation sheet (shell.md §4) ───────────────────────────────── */

function MobileNavSheet({
  activeSection,
  onSelect,
  onOpenSearch,
  onOpenVoiceHelp,
  onVoiceTranscription,
}: {
  activeSection: AppSection;
  onSelect: (id: AppSection) => void;
  onOpenSearch: () => void;
  onOpenVoiceHelp: () => void;
  onVoiceTranscription: (text: string) => void;
}) {
  const userName = useAppStore((s) => s.userName);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="glass-overlay w-[min(360px,calc(100vw-48px))] gap-0 rounded-r-[28px] border-r border-r-border-strong p-0 sm:max-w-none [&>button]:hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <BrandMark size={32} />
              <span className="font-display text-lg font-bold text-foreground">
                AdaptiFit v2
              </span>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                aria-label="Close navigation"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </SheetClose>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-4">
              {/* Full-width search row */}
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={onOpenSearch}
                  className="flex h-12 w-full items-center gap-3 rounded-[14px] border border-border bg-surface px-4 text-sm text-foreground-subtle"
                >
                  <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">Search or say what you need…</span>
                </button>
              </SheetClose>

              {/* Profile strip */}
              <div className="mt-4 flex items-center gap-3 rounded-[18px] bg-surface-raised p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary-soft text-sm font-bold text-primary">
                    {userName?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  Ready when you are, {userName || 'friend'}.
                </p>
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => useAppStore.getState().setProfileSetupOpen(true)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground-muted hover:bg-surface hover:text-foreground"
                    aria-label="Edit profile"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                </SheetClose>
              </div>

              {/* Grouped nav */}
              <nav aria-label="Sections" className="mt-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="mt-3 first:mt-0">
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-subtle">
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <SheetClose asChild key={item.id}>
                          <div>
                            <NavItemButton
                              item={item}
                              active={activeSection === item.id}
                              onSelect={onSelect}
                              size="sheet"
                            />
                          </div>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="my-4 border-t border-border/80" />

              {/* Quick controls */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex h-12 items-center justify-between rounded-[14px] border border-border bg-surface px-3">
                  <span className="text-sm font-medium text-foreground-muted">Theme</span>
                  <ThemeToggle />
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => useAccessibilityStore.getState().setOpen(true)}
                    className="flex h-12 items-center gap-2 rounded-[14px] border border-border bg-surface px-3 text-sm font-medium text-foreground-muted hover:bg-surface-raised"
                  >
                    <Languages className="h-4 w-4" aria-hidden="true" />
                    Language
                  </button>
                </SheetClose>
                <div className="flex h-12 items-center gap-2 rounded-[14px] border border-border bg-surface px-3">
                  <AudioLines className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                  <span className="flex-1 text-sm font-medium text-foreground-muted">Voice</span>
                  <VoiceInput onTranscription={onVoiceTranscription} size="sm" />
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={onOpenVoiceHelp}
                    className="flex h-12 items-center gap-2 rounded-[14px] border border-border bg-surface px-3 text-sm font-medium text-foreground-muted hover:bg-surface-raised"
                  >
                    <CircleHelp className="h-4 w-4" aria-hidden="true" />
                    Help
                  </button>
                </SheetClose>
              </div>

              {/* Accessibility card */}
              <div className="glass-panel mt-4 rounded-[18px] p-4">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
                  >
                    <AccessibilityIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Access first</p>
                    <p className="mt-0.5 text-xs leading-[18px] text-foreground-muted">
                      Tune motion, contrast, text, and voice.
                    </p>
                  </div>
                </div>
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => useAccessibilityStore.getState().setOpen(true)}
                    className="btn-aurora-primary mt-3 flex h-11 w-full items-center justify-center rounded-[14px] text-sm font-semibold"
                  >
                    Open accessibility settings
                  </button>
                </SheetClose>
              </div>

              {/* Footer meta */}
              <p className="mt-4 flex items-center gap-2 px-1 text-xs text-foreground-subtle">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                Offline ready · AdaptiFit v2
              </p>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Command palette (shell.md §2.2 center search) ───────────────────────── */

function CommandPalette({
  open,
  onOpenChange,
  onSelect,
  onOpenVoiceHelp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: AppSection) => void;
  onOpenVoiceHelp: () => void;
}) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search exercises, commands, or help…" />
      <CommandList>
        <CommandEmpty>No help topics found. Try “voice”, “camera”, or “offline”.</CommandEmpty>
        <CommandGroup heading="Sections">
          {NAV_FLAT.map((item) => (
            <CommandItem
              key={item.id}
              value={item.label}
              onSelect={() => run(() => onSelect(item.id))}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="toggle theme"
            onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            Toggle theme
          </CommandItem>
          <CommandItem
            value="accessibility settings"
            onSelect={() => run(() => useAccessibilityStore.getState().setOpen(true))}
          >
            <AccessibilityIcon className="h-4 w-4" aria-hidden="true" />
            Accessibility settings
          </CommandItem>
          <CommandItem value="voice command help" onSelect={() => run(onOpenVoiceHelp)}>
            <Mic className="h-4 w-4" aria-hidden="true" />
            Voice command help
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/* ── Home hero (shell.md §5) ─────────────────────────────────────────────── */

function HeroWord({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const reduced = useReduced();
  return (
    <motion.span
      className="inline-block will-change-transform"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.14 : 0.42,
        delay: reduced ? 0 : 0.12 + index * 0.036,
        ease: reduced ? 'linear' : EASE.careOut,
      }}
    >
      {children}
    </motion.span>
  );
}

const TRUST_CHIPS: { icon: LucideIcon; label: string }[] = [
  { icon: ScanSearch, label: 'Body-aware' },
  { icon: Mic, label: 'Voice-first' },
  { icon: WifiOff, label: 'Offline ready' },
  { icon: Languages, label: '5 languages' },
];

function TrustStrip({ className }: { className?: string }) {
  const reduced = useReduced();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduced ? 0.14 : 0.32,
        delay: reduced ? 0 : 0.88,
        ease: reduced ? 'linear' : EASE.standard,
      }}
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible lg:pb-0',
        className,
      )}
      role="list"
      aria-label="Product capabilities"
    >
      {TRUST_CHIPS.map((chip) => (
        <span
          key={chip.label}
          role="listitem"
          className="glass-overlay flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground"
        >
          <chip.icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {chip.label}
        </span>
      ))}
    </motion.div>
  );
}

function HeroSection({ onNavigate }: { onNavigate: (section: AppSection) => void }) {
  const reduced = useReduced();

  const fadeUp = (delay: number, duration = 0.32) =>
    reduced
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.14, ease: 'linear' as const },
        }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration, delay, ease: EASE.careOut },
        };

  return (
    <section aria-label="Introduction">
      <motion.div
        className="hero-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.14 : 0.5, ease: 'linear' }}
      >
        <div className="hero-grid grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-12 xl:p-14">
          {/* Left: message and actions (7 columns).
              Headline font is container-aware (cqw) so line 1
              “Fitness that adapts” never wraps inside the 7-col track;
              the spec's 6.4vw clamp is unreachable within the 280px
              sidebar shell at 1024–1440px, so cqw preserves the intent. */}
          <div className="@container lg:col-span-7">
            {/* Status pill */}
            <motion.p
              {...fadeUp(0.08, 0.28)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary-soft px-4 text-sm font-semibold text-primary"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Accessibility-first adaptive coaching
              <span aria-hidden="true" className="hidden h-4 w-px bg-primary/30 sm:inline-block" />
              <span className="hidden font-medium sm:inline">Voice • Camera • Recovery</span>
            </motion.p>

            {/* Headline — word-level stagger, glow underline on “every body” */}
            <h1
              aria-label="Fitness that adapts to every body."
              className="mt-6 font-display text-display-hero font-bold tracking-tight text-foreground lg:text-[clamp(36px,10.4cqw,84px)]"
            >
              <span aria-hidden="true">
                <span className="block lg:whitespace-nowrap">
                  <HeroWord index={0}>Fitness</HeroWord>{' '}
                  <HeroWord index={1}>that</HeroWord>{' '}
                  <HeroWord index={2}>adapts</HeroWord>
                </span>
                <span className="block lg:whitespace-nowrap">
                  <HeroWord index={3}>to</HeroWord>{' '}
                  <HeroWord index={4}>
                    <span className="hero-underline">every body</span>.
                  </HeroWord>
                </span>
              </span>
            </h1>

            {/* Assistive typing line */}
            <motion.div {...fadeUp(0.5, 0.24)} className="mt-5 min-h-[30px]">
              <AssistiveTypingLine startDelay={650} />
            </motion.div>

            {/* Supporting copy */}
            <motion.p
              {...fadeUp(0.62)}
              className="mt-4 max-w-[620px] text-lg leading-8 text-foreground-muted"
            >
              AdaptiFit combines camera-guided movement, adaptive workouts,
              recovery tracking, and multilingual voice support in one calm
              companion built around your abilities.
            </motion.p>

            {/* Primary actions */}
            <motion.div {...fadeUp(0.74)} className="mt-8 flex flex-wrap items-center gap-3">
              <motion.span
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0.14, ease: 'linear' }
                    : { duration: 0.32, delay: 0.74, ease: EASE.careOut }
                }
              >
                <button
                  type="button"
                  onClick={() => onNavigate('live-coach')}
                  className="btn-aurora-primary inline-flex h-[52px] items-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
                >
                  <Video className="h-5 w-5" aria-hidden="true" />
                  Start Adaptive Session
                </button>
              </motion.span>
              <motion.span
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0.14, ease: 'linear' }
                    : { duration: 0.32, delay: 0.81, ease: EASE.careOut }
                }
              >
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="btn-aurora-secondary inline-flex h-[52px] items-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
                >
                  <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                  View My Recovery
                </button>
              </motion.span>
              <button
                type="button"
                onClick={() => onNavigate('body-scan')}
                className="inline-flex h-11 items-center rounded-[14px] px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Take a 2-minute body scan
              </button>
            </motion.div>

            {/* Trust strip — desktop wraps; mobile scrolls (rendered below halo) */}
            <TrustStrip className="mt-10 hidden lg:flex" />
          </div>

          {/* Right: Body Halo (5 columns) */}
          <div className="lg:col-span-5">
            <BodyHalo className="max-h-[360px] lg:max-h-none" />
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-10 lg:hidden">
          <TrustStrip />
        </div>
      </motion.div>
    </section>
  );
}

/* ── “Your care loop” (shell.md §6.1) ────────────────────────────────────── */

const CARE_LOOP: {
  step: string;
  title: string;
  body: string;
  section: AppSection;
  icon: LucideIcon;
}[] = [
  {
    step: 'Scan',
    title: 'Map what your body needs today.',
    body: 'Body Scan and wearable signals turn pain, mobility, and energy into context.',
    section: 'body-scan',
    icon: ScanSearch,
  },
  {
    step: 'Adapt',
    title: 'Your plan meets you where you are.',
    body: 'Workouts, coaching cues, meals, and cognitive sessions adjust to your profile.',
    section: 'adaptive-workout',
    icon: Activity,
  },
  {
    step: 'Recover',
    title: 'Progress becomes visible and encouraging.',
    body: 'Dashboards, mood trends, and community support help every small win count.',
    section: 'dashboard',
    icon: HeartPulse,
  },
];

function CareLoopSection({ onNavigate }: { onNavigate: (s: AppSection) => void }) {
  const reduced = useReduced();
  return (
    <section aria-labelledby="care-loop-title" className="mt-16 lg:mt-20">
      <SectionHeader
        eyebrow="How AdaptiFit works"
        title={
          <span id="care-loop-title">One loop for body, mind, and recovery.</span>
        }
        description="Move with guidance, check in honestly, and let the plan adapt around your energy, pain, and abilities."
      />
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {CARE_LOOP.map((card, i) => (
          <motion.div
            key={card.step}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={
              reduced
                ? { duration: 0.14, ease: 'linear' }
                : { duration: 0.42, delay: i * 0.07, ease: EASE.careOut }
            }
            whileHover={reduced ? undefined : { y: -4 }}
          >
            <GlassPanel
              interactive
              className="flex h-full flex-col gap-4 p-6"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"
              >
                <card.icon className="h-6 w-6" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {card.step}
              </p>
              <h3 className="text-[22px] font-bold leading-[30px] text-foreground">
                {card.title}
              </h3>
              <p className="text-[15px] leading-[26px] text-foreground-muted">{card.body}</p>
              <button
                type="button"
                onClick={() => onNavigate(card.section)}
                className="mt-auto inline-flex h-11 items-center gap-1 self-start rounded-[10px] text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Learn more
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Accessibility proof band (shell.md §6.2) ────────────────────────────── */

const PROOF_METRICS: { value: number | null; suffix: string; staticText?: string; label: string }[] = [
  { value: 44, suffix: 'px+', label: 'touch targets' },
  { value: null, suffix: '', staticText: 'AA', label: 'tested contrast' },
  { value: 5, suffix: '', label: 'UI languages' },
  { value: 0, suffix: '', label: 'required fine motor precision' },
];

function AccessProofBand() {
  const [inView, setInView] = useState(false);
  return (
    <motion.section
      aria-label="Accessibility commitments"
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, amount: 0.4 }}
      className="mt-16 lg:mt-20"
    >
      <GlassPanel radius="2xl" className="p-8 sm:p-10">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {PROOF_METRICS.map((m) => (
            <div key={m.label}>
              <p className="font-mono text-4xl font-semibold tabular-nums text-foreground">
                {m.staticText ?? (
                  <>
                    <CountUp target={m.value ?? 0} active={inView} />
                    {m.suffix}
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[620px] text-base text-foreground-muted">
            Designed for keyboard, voice, screen readers, reduced motion, large
            text, and real-world recovery.
          </p>
          <button
            type="button"
            onClick={() => useAccessibilityStore.getState().setOpen(true)}
            className="btn-aurora-secondary inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold"
          >
            <AccessibilityIcon className="h-4 w-4" aria-hidden="true" />
            Open accessibility settings
          </button>
        </div>
      </GlassPanel>
    </motion.section>
  );
}

/* ── Final home CTA (shell.md §6.3) ──────────────────────────────────────── */

function FinalCta({ onNavigate }: { onNavigate: (s: AppSection) => void }) {
  const reduced = useReduced();
  const openChat = () => {
    document
      .querySelector<HTMLButtonElement>('button[aria-label="Open AdaptiFit AI Chat"]')
      ?.click();
  };
  return (
    <motion.section
      aria-labelledby="final-cta-title"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        reduced
          ? { duration: 0.14, ease: 'linear' }
          : { duration: 0.42, ease: EASE.careOut }
      }
      className="relative mt-16 overflow-hidden rounded-[32px] border border-border bg-surface p-8 sm:p-12 lg:mt-20"
    >
      {/* Accent-soft wash on one side only — no full saturated gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-2/3"
        style={{
          background:
            'linear-gradient(90deg, color-mix(in srgb, var(--accent-soft) 65%, transparent), transparent)',
        }}
      />
      <div className="relative max-w-[620px]">
        <h2
          id="final-cta-title"
          className="font-display text-3xl font-bold text-foreground sm:text-4xl"
        >
          Start with one gentle step.
        </h2>
        <p className="mt-3 text-lg text-foreground-muted">
          You do not need to be ready. AdaptiFit will meet you where you are.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('body-scan')}
            className="btn-aurora-primary inline-flex h-[52px] items-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
          >
            <ScanSearch className="h-5 w-5" aria-hidden="true" />
            Begin Body Scan
          </button>
          <button
            type="button"
            onClick={openChat}
            className="btn-aurora-secondary inline-flex h-[52px] items-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Talk to AdaptiFit AI
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Footer (shell.md §7) ────────────────────────────────────────────────── */

function FooterLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  /* Real destinations are <button>s — tabbable, focus-visible, 44px target */
  return (
    <li>
      <button type="button" onClick={onClick} className="footer-link text-sm">
        {children}
      </button>
    </li>
  );
}

function SiteFooter({
  onNavigate,
  onOpenVoiceHelp,
}: {
  onNavigate: (s: AppSection) => void;
  onOpenVoiceHelp: () => void;
}) {
  const handleInstall = () => {
    try {
      localStorage.removeItem('adaptifit:pwa-install-dismissed:v1');
      announce('Install prompt reset. The install card appears at the bottom left when the app is installable.');
      window.location.reload();
    } catch {
      /* noop */
    }
  };

  return (
    <footer className="mt-16 border-t border-border pt-8">
      {/* Mobile crisis card (shell.md §7.2) */}
      <div className="mb-8 rounded-[18px] bg-danger-soft p-5 lg:hidden">
        <p className="text-sm font-semibold text-danger">Need urgent support?</p>
        <p className="mt-1 text-sm text-foreground">Get help now.</p>
        <button
          type="button"
          onClick={() => onNavigate('crisis')}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-[14px] bg-danger text-sm font-semibold text-danger-foreground"
        >
          Open support
        </button>
      </div>

      <nav aria-label="Footer">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <span className="font-display text-lg font-bold text-foreground">AdaptiFit</span>
            </div>
            <p className="mt-3 max-w-[300px] text-sm text-foreground-muted">
              Adaptive fitness and physiotherapy for every body.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
              Product
            </h3>
            <ul className="mt-2">
              <FooterLink onClick={() => onNavigate('dashboard')}>Dashboard</FooterLink>
              <FooterLink onClick={() => onNavigate('live-coach')}>Live Coach</FooterLink>
              <FooterLink onClick={() => onNavigate('exercises')}>Exercises</FooterLink>
              <FooterLink onClick={() => onNavigate('mind-gym')}>Mind Gym</FooterLink>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
              Support
            </h3>
            <ul className="mt-2">
              <FooterLink onClick={() => useAccessibilityStore.getState().setOpen(true)}>
                Accessibility
              </FooterLink>
              <FooterLink onClick={() => onNavigate('crisis')}>Crisis Support</FooterLink>
              <FooterLink onClick={handleInstall}>Install App</FooterLink>
              <FooterLink onClick={onOpenVoiceHelp}>Help</FooterLink>
            </ul>
          </div>
        </div>
      </nav>

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/80 pt-6 text-sm text-foreground-subtle">
        <span>© 2025 AdaptiFit</span>
        <span aria-hidden="true">·</span>
        <span>Privacy-first demo</span>
        <span aria-hidden="true">·</span>
        <span>WCAG AA target</span>
      </div>
    </footer>
  );
}

/* ── App shell ───────────────────────────────────────────────────────────── */

export default function Home() {
  const { activeSection, setActiveSection } = useAppStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [voiceHelpOpen, setVoiceHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReduced();
  const profileSetupComplete = useAppStore((s) => s.profileSetupComplete);

  // Section history for the voice "go back" command.
  const prevSectionRef = useRef<AppSection>('home');
  const navigate = useCallback(
    (section: AppSection) => {
      const current = useAppStore.getState().activeSection;
      if (current !== section) prevSectionRef.current = current;
      setActiveSection(section);
    },
    [setActiveSection],
  );

  const goBack = useCallback(() => {
    navigate(prevSectionRef.current);
  }, [navigate]);

  // Header condenses after 8px of scroll (shell.md §2.1)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // PWA shortcut deep-links (Pillar A): manifest shortcuts open
  // /?section=live-coach and /?section=mind-gym — honor them on first load.
  useEffect(() => {
    try {
      const section = new URLSearchParams(window.location.search).get('section');
      const valid: AppSection[] = [
        'home', 'dashboard', 'body-scan', 'live-coach', 'exercises',
        'adaptive-workout', 'mind-gym', 'breathing', 'mood', 'nutrition',
        'community', 'wearable', 'crisis',
      ];
      if (section && (valid as string[]).includes(section)) {
        setActiveSection(section as AppSection);
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // First-run: surface the real onboarding (profile setup) instead of dropping
  // users into a dashboard of sample data (B-05).
  useEffect(() => {
    try {
      const hasDeepLink = !!new URLSearchParams(window.location.search).get('section');
      const state = useAppStore.getState();
      if (!hasDeepLink && !state.profileSetupComplete && !state.profileSetupDismissed) {
        const timer = setTimeout(() => useAppStore.getState().setProfileSetupOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Announce section changes politely (shell.md §8)
  const firstSectionRef = useRef(true);
  useEffect(() => {
    if (firstSectionRef.current) {
      firstSectionRef.current = false;
      return;
    }
    const label = NAV_FLAT.find((i) => i.id === activeSection)?.label ?? activeSection;
    announce(`${label} section opened.`);
  }, [activeSection]);

  // Legacy voice navigation fallback — only runs for transcripts the Voice
  // Commander did NOT consume (voice-input routes through the commander first).
  const handleVoiceNavigation = useCallback(
    (text: string) => {
      const lower = text.toLowerCase().trim();
      const voiceCommands: Record<string, AppSection> = {
        'dashboard': 'dashboard',
        'home': 'home',
        'body scan': 'body-scan',
        'scan': 'body-scan',
        'live coach': 'live-coach',
        'coach': 'live-coach',
        'rep counter': 'live-coach',
        'reps': 'live-coach',
        'exercise': 'exercises',
        'exercises': 'exercises',
        'workout': 'exercises',
        'adaptive workout': 'adaptive-workout',
        'adaptive': 'adaptive-workout',
        'routine': 'adaptive-workout',
        'mind gym': 'mind-gym',
        'mind': 'mind-gym',
        'focus': 'mind-gym',
        'memory': 'mind-gym',
        'breathing': 'breathing',
        'breathe': 'breathing',
        'mood': 'mood',
        'emotions': 'mood',
        'nutrition': 'nutrition',
        'food': 'nutrition',
        'diet': 'nutrition',
        'community': 'community',
        'forum': 'community',
        'wearable': 'wearable',
        'device': 'wearable',
        'watch': 'wearable',
        'crisis': 'crisis',
        'emergency': 'crisis',
        'support': 'crisis',
      };
      for (const [keyword, section] of Object.entries(voiceCommands)) {
        if (lower.includes(keyword)) {
          navigate(section);
          return;
        }
      }
    },
    [navigate],
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'body-scan': return <BodyScan />;
      case 'live-coach': return <LiveCoach />;
      case 'exercises': return <ExerciseLibrary />;
      case 'adaptive-workout': return <AdaptiveWorkout />;
      case 'mind-gym': return <MindGym />;
      case 'breathing': return <BreathingExercise />;
      case 'mood': return <MoodMonitor />;
      case 'nutrition': return <Nutrition />;
      case 'community': return <Community />;
      case 'wearable': return <Wearable />;
      case 'crisis': return <CrisisSupport />;
      default:
        return (
          <>
            <HeroSection onNavigate={navigate} />
            <CareLoopSection onNavigate={navigate} />
            <AccessProofBand />
            <FinalCta onNavigate={navigate} />
          </>
        );
    }
  };

  return (
    <VoiceCommanderProvider onNavigate={navigate}>
    <I18nProvider>
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip links (shell.md §1.1) */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only"
      >
        Skip to main content
      </a>
      <a
        href="#voice-commands"
        className="skip-link skip-link--secondary sr-only focus:not-sr-only"
      >
        Skip to voice commands
      </a>

      {/* Screen-reader live region owned by the Voice Commander announcer */}
      <div
        id={ANNOUNCER_REGION_ID}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <AmbientBackground />

      {/* Header (shell.md §2) */}
      <header className="header-shell sticky top-0 z-40" data-scrolled={scrolled}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:h-[72px] lg:gap-4">
            {/* Left: menu (mobile) + logo + version badge */}
            <div className="flex min-w-0 items-center gap-1.5">
              <MobileNavSheet
                activeSection={activeSection}
                onSelect={navigate}
                onOpenSearch={() => setCommandOpen(true)}
                onOpenVoiceHelp={() => setVoiceHelpOpen(true)}
                onVoiceTranscription={handleVoiceNavigation}
              />
              <button
                type="button"
                aria-label="AdaptiFit — home"
                onClick={() => navigate('home')}
                className="flex min-w-0 items-center gap-2.5 rounded-[14px] px-1.5 py-1 text-left"
              >
                <BrandMark size={32} className="shrink-0 lg:hidden" />
                <BrandMark size={36} className="hidden shrink-0 lg:block" />
                <span className="truncate font-display text-lg font-bold text-foreground lg:text-xl">
                  AdaptiFit
                </span>
                <span className="hidden h-6 shrink-0 items-center rounded-full bg-accent-soft px-2 text-[11px] font-bold uppercase tracking-wide text-accent sm:inline-flex">
                  v2
                </span>
              </button>
            </div>

            {/* Center: command/search pill (desktop) */}
            <div className="hidden justify-center lg:flex">
              <button
                type="button"
                className="cmd-pill"
                onClick={() => setCommandOpen(true)}
                aria-label="Search exercises, commands, or help"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="cmd-pill-placeholder">
                  Search exercises, commands, or help…
                </span>
                <kbd className="flex h-5 shrink-0 items-center rounded-[6px] border border-border px-1.5 font-mono text-xs text-foreground-subtle">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right: utility controls (shell.md §2.2/§2.3) */}
            <div className="flex items-center gap-0.5 justify-self-end sm:gap-1">
              {/* Search icon button (tablet, ≥560px <1024px) */}
              <button
                type="button"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground min-[560px]:flex lg:hidden"
                aria-label="Search"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Voice commands (ASR) — skip-link target */}
              <div
                id="voice-commands"
                tabIndex={-1}
                className="hidden items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus-ring lg:flex"
              >
                <VoiceInput onTranscription={handleVoiceNavigation} size="sm" />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors duration-[120ms] hover:bg-surface-raised hover:text-foreground"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notifications, 3 unread"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  <motion.span
                    aria-hidden="true"
                    initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={reduced ? { duration: 0.12 } : { ...SPRING.snappy, duration: 0.18 }}
                    className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground"
                  >
                    3
                  </motion.span>
                </button>
                <NotificationCenter
                  isOpen={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                />
              </div>

              <HeaderLanguageButton />

              {/* Voice settings (desktop; lives in sheet on mobile) */}
              <button
                type="button"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground lg:flex"
                onClick={() => setVoiceSettingsOpen(true)}
                aria-label="Voice and speech settings"
              >
                <AudioLines className="h-5 w-5" aria-hidden="true" />
              </button>

              <span className="hidden lg:flex">
                <ThemeToggle />
              </span>

              {/* Help (desktop; lives in sheet on mobile) */}
              <button
                type="button"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground lg:flex"
                onClick={() => setVoiceHelpOpen(true)}
                aria-label="Voice command help — list of voice commands"
              >
                <CircleHelp className="h-5 w-5" aria-hidden="true" />
              </button>

              <VoiceSettings isOpen={voiceSettingsOpen} onClose={() => setVoiceSettingsOpen(false)} />

              {/* Avatar → profile setup */}
              <button
                type="button"
                aria-label="Edit your profile and accessibility needs"
                className="relative ml-1 rounded-full"
                onClick={() => useAppStore.getState().setProfileSetupOpen(true)}
              >
                <Avatar
                  className={cn(
                    'h-10 w-10 transition-shadow',
                    profileSetupComplete && 'ring-2 ring-primary',
                  )}
                >
                  <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary">
                    A
                  </AvatarFallback>
                </Avatar>
                {!profileSetupComplete && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-accent"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Frame: sidebar + content (shell.md §1.2) */}
      <div className="mx-auto flex w-full max-w-[1440px] items-start">
        <SidebarNav activeSection={activeSection} onSelect={navigate} />
        <div className="min-w-0 flex-1">
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-[calc(100svh-64px)] px-4 pb-28 pt-6 outline-none sm:px-6 lg:min-h-[calc(100svh-72px)] lg:px-6 lg:pb-12 xl:px-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: reduced ? 0.14 : 0.32, ease: EASE.careOut }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
            <SiteFooter onNavigate={navigate} onOpenVoiceHelp={() => setVoiceHelpOpen(true)} />
          </main>
        </div>
      </div>

      {/* Command palette */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelect={navigate}
        onOpenVoiceHelp={() => setVoiceHelpOpen(true)}
      />

      {/* AI Chat */}
      <AIChat />

      {/* Accessibility Widget */}
      <AccessibilityWidget />

      {/* Profile Setup Dialog */}
      <ProfileSetup />

      {/* Toast Notifications */}
      <ToastProvider />

      {/* Voice Commander: system intent handlers (back/help) + help overlay */}
      <VoiceCommanderChrome
        onBack={goBack}
        helpOpen={voiceHelpOpen}
        setHelpOpen={setVoiceHelpOpen}
      />
    </div>
    </MotionConfig>
    </I18nProvider>
    </VoiceCommanderProvider>
  );
}

// ── Voice Commander chrome ─────────────────────────────────────────────────────
// Lives inside VoiceCommanderProvider so it can register system-intent handlers.
function VoiceCommanderChrome({
  onBack,
  helpOpen,
  setHelpOpen,
}: {
  onBack: () => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}) {
  const commander = useCommander();
  const registerHandler = commander?.registerHandler;

  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);
  const setHelpOpenRef = useRef(setHelpOpen);
  useEffect(() => { setHelpOpenRef.current = setHelpOpen; }, [setHelpOpen]);

  useEffect(() => {
    if (!registerHandler) return;
    const unsubs = [
      registerHandler('system.back', () => onBackRef.current()),
      registerHandler('system.help', () => setHelpOpenRef.current(true)),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [registerHandler]);

  // Speak a compact summary whenever the overlay opens (the full list is
  // visible on screen and browseable by screen readers in the dialog).
  useEffect(() => {
    if (helpOpen) {
      announce(
        'Voice commands. Workout: start workout, pause, next exercise, repeat that, stop. ' +
          'Logging: log water, I feel pain. General: go back, stop listening, help. ' +
          'You can also say any section name, like dashboard or live coach. Press Escape to close.',
        { speak: true, force: true },
      );
    }
  }, [helpOpen]);

  return <VoiceHelpOverlay open={helpOpen} onOpenChange={setHelpOpen} />;
}

// Help overlay — Radix Dialog gives us Esc-to-close and a focus trap for free.
function VoiceHelpOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const groups = describeCommands();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-overlay max-w-lg max-h-[85vh] overflow-y-auto motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" aria-hidden="true" /> Voice commands
          </DialogTitle>
          <DialogDescription>
            Tap the microphone and speak naturally. Every command is confirmed
            aloud and announced to your screen reader. Press Escape to close.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.category} aria-label={group.category}>
              <h3 className="mb-2 text-sm font-semibold text-primary">
                {group.category}
              </h3>
              <ul className="space-y-2">
                {group.commands.map((cmd) => (
                  <li key={cmd.description} className="text-sm">
                    <span className="font-medium">{cmd.description}</span>
                    <span className="block text-xs text-foreground-muted">
                      Say: {cmd.examples.map((e) => `“${e}”`).join(' or ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
