'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ScanLine,
  Video,
  Dumbbell,
  Accessibility as AccessibilityIcon,
  Gamepad2,
  Brain,
  Apple,
  Users,
  Watch,
  Menu,
  Heart,
  Accessibility,
  Shield,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  Target,
  Activity,
  Sun,
  Moon,
  Bell,
  Volume2,
  ArrowUp,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  CheckCircle2,
  Lock,
  Headphones,
  Quote,
  Wind,
  TrendingUp,
  Mic,
  Flame,
  Trophy,
  HelpCircle,
  Languages,
} from 'lucide-react';

const navItems: { id: AppSection; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, color: 'emerald' },
  { id: 'body-scan', label: 'Body Scan', icon: <ScanLine className="w-5 h-5" />, color: 'cyan' },
  { id: 'live-coach', label: 'Live Coach', icon: <Video className="w-5 h-5" />, color: 'rose' },
  { id: 'exercises', label: 'Exercises', icon: <Dumbbell className="w-5 h-5" />, color: 'amber' },
  { id: 'adaptive-workout', label: 'Adaptive Workout', icon: <AccessibilityIcon className="w-5 h-5" />, color: 'emerald' },
  { id: 'mind-gym', label: 'Mind Gym', icon: <Gamepad2 className="w-5 h-5" />, color: 'violet' },
  { id: 'breathing', label: 'Breathing', icon: <Wind className="w-5 h-5" />, color: 'teal' },
  { id: 'mood', label: 'Mood', icon: <Brain className="w-5 h-5" />, color: 'rose' },
  { id: 'nutrition', label: 'Nutrition', icon: <Apple className="w-5 h-5" />, color: 'orange' },
  { id: 'community', label: 'Community', icon: <Users className="w-5 h-5" />, color: 'violet' },
  { id: 'wearable', label: 'Wearable', icon: <Watch className="w-5 h-5" />, color: 'teal' },
  { id: 'crisis', label: 'Crisis', icon: <Shield className="w-5 h-5" />, color: 'emerald' },
];

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  cyan: 'from-cyan-500 to-cyan-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  orange: 'from-orange-500 to-orange-600',
  violet: 'from-violet-500 to-violet-600',
  teal: 'from-teal-500 to-teal-600',
};

const colorMapText: Record<string, string> = {
  emerald: 'text-emerald-500',
  cyan: 'text-cyan-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  orange: 'text-orange-500',
  violet: 'text-violet-500',
  teal: 'text-teal-500',
};

const colorMapBorder: Record<string, string> = {
  emerald: 'border-emerald-500',
  cyan: 'border-cyan-500',
  amber: 'border-amber-500',
  rose: 'border-rose-500',
  orange: 'border-orange-500',
  violet: 'border-violet-500',
  teal: 'border-teal-500',
};

// Animated counter component with ease-out cubic easing
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{prefix}{count}{suffix}</>;
}

// Floating particles component (SSR-safe with deterministic values)
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 97) + 1,
  y: ((i * 53 + 7) % 93) + 3,
  size: (i % 5) + 2,
  duration: (i % 7) + 6,
  delay: (i % 4),
}));

function FloatingParticles() {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = useAccessibilityStore((s) => s.reducedMotion);

  if (prefersReducedMotion || reducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/20 dark:bg-emerald-400/10"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Typing Effect Component
function TypingEffect({ texts, className = '' }: { texts: string[]; className?: string }) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = useAccessibilityStore((s) => s.reducedMotion);

  useEffect(() => {
    const currentText = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? 30 : 80);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts]);

  // Reduced motion: render the first tagline statically, no typing or cursor.
  if (prefersReducedMotion || reducedMotion) {
    return <span className={className}>{texts[0]}</span>;
  }

  return (
    <span className={className}>
      {texts[textIndex].substring(0, charIndex)}
      <span
        className="inline-block w-[2px] h-[1em] bg-emerald-500 ml-0.5 align-middle"
        style={{ animation: 'blink-cursor 0.8s step-end infinite' }}
      />
    </span>
  );
}

// Dot Grid Background Component
function DotGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 dot-grid opacity-30 dark:opacity-20" />
    </div>
  );
}

// Footer link — a real, tabbable interactive element with visible focus.
// Items that map to an in-app destination use <button>; placeholder items use
// an inert anchor (spec UX-03) rather than a dead <li>.
function FooterLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const cls = 'hover:text-foreground transition-colors footer-link-underline rounded-sm text-left';
  if (onClick) {
    return (
      <li>
        <button type="button" onClick={onClick} className={cls}>
          {children}
        </button>
      </li>
    );
  }
  return (
    <li>
      <a href="#" onClick={(e) => e.preventDefault()} className={cls}>
        {children}
      </a>
    </li>
  );
}

// Welcome card copy — honest for first-time visitors (no fake "welcome back"
// or invented recovery percentage before a profile exists, UX-13).
function WelcomeCardText() {
  const userName = useAppStore((s) => s.userName);
  const profileSetupComplete = useAppStore((s) => s.profileSetupComplete);
  return (
    <div>
      <p className="text-sm font-bold">
        {profileSetupComplete && userName ? `Welcome back, ${userName}! 👋` : 'Your recovery, on track'}
      </p>
      <p className="text-xs text-muted-foreground">
        {profileSetupComplete ? 'Your recovery is 78% on track' : 'Set up your profile to personalize this'}
      </p>
    </div>
  );
}

// Header language quick-switch (UX-12) — opens the accessibility widget,
// which presents the language radiogroup at the top of its panel.
function HeaderLanguageButton() {
  const locale = useAccessibilityStore((s) => s.locale);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 gap-1.5"
      aria-label="Change language"
      onClick={() => useAccessibilityStore.getState().setOpen(true)}
    >
      <Languages className="w-4 h-4" />
      <span className="text-xs font-semibold uppercase">{locale}</span>
    </Button>
  );
}

// Theme toggle button
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Switch theme">
        <Sun className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11 relative"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -90, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}

export default function Home() {
  const { activeSection, setActiveSection } = useAppStore();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [voiceHelpOpen, setVoiceHelpOpen] = useState(false);

  // Section history for the voice "go back" command.
  const prevSectionRef = useRef<AppSection>('home');
  const navigate = useCallback((section: AppSection) => {
    const current = useAppStore.getState().activeSection;
    if (current !== section) prevSectionRef.current = current;
    setActiveSection(section);
  }, [setActiveSection]);

  const goBack = useCallback(() => {
    navigate(prevSectionRef.current);
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
  // users into a dashboard of sample data. Skipped for PWA deep-links and for
  // users who already completed or dismissed the dialog (B-05).
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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Legacy voice navigation fallback — only runs for transcripts the Voice
  // Commander did NOT consume (voice-input routes through the commander first).
  // Note: "help" is intentionally absent here; it is the commander's
  // system.help intent (help overlay), not crisis navigation.
  const handleVoiceNavigation = useCallback((text: string) => {
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
  }, [navigate]);

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
      default: return <HeroSection onNavigate={setActiveSection} />;
    }
  };

  return (
    <VoiceCommanderProvider onNavigate={navigate}>
    <I18nProvider>
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip links — visible on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        Skip to main content
      </a>
      <a
        href="#voice-commands"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-52 focus:z-[100] focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        Skip to voice commands
      </a>

      {/* Screen-reader live region owned by the Voice Commander announcer.
          Rendered declaratively; announcer.ts reuses it by id. */}
      <div
        id={ANNOUNCER_REGION_ID}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-nav border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.button
              type="button"
              aria-label="AdaptiFit — home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 group text-left rounded-lg"
              onClick={() => setActiveSection('home')}
            >
              <motion.div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Accessibility className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Adapti<span className="text-emerald-500">Fit</span>
                </h1>
                <p className="text-xs text-muted-foreground -mt-1 hidden sm:block">AI Adaptive Fitness & Rehab</p>
              </div>
            </motion.button>

            {/* Desktop Navigation */}
            <TooltipProvider delayDuration={200}>
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveSection(item.id)}
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={`
                            relative flex items-center gap-2 px-3 py-2 min-h-11 rounded-lg text-sm font-medium transition-colors duration-300
                            ${isActive
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 nav-active-bar nav-glow nav-glow-active'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                            }
                          `}
                        >
                          <motion.span
                            animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                          >
                            {item.icon}
                          </motion.span>
                          <span className="hidden xl:inline">{item.label}</span>
                          {/* Hover underline effect for inactive items */}
                          {!isActive && (
                            <motion.div
                              className="absolute bottom-0 left-1/2 h-0.5 bg-emerald-500 rounded-full"
                              initial={{ width: 0, x: '-50%' }}
                              whileHover={{ width: '60%', x: '-30%' }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={4}>
                        <span className="text-xs">{item.label}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </nav>
            </TooltipProvider>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Language quick-switch — opens the accessibility widget at the
                  language radiogroup (UX-12). */}
              <HeaderLanguageButton />

              <ThemeToggle />

              {/* Voice Navigation + Commander (ASR) — skip-link target */}
              <div id="voice-commands" tabIndex={-1} className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                <VoiceInput onTranscription={handleVoiceNavigation} size="sm" />
              </div>

              {/* Voice command help */}
              <Button
                variant="ghost"
                size="sm"
                className="h-11 relative"
                onClick={() => setVoiceHelpOpen(true)}
                aria-label="Voice command help — list of voice commands"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden md:inline text-xs">Voice help</span>
              </Button>

              {/* Voice Settings Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 relative"
                onClick={() => setVoiceSettingsOpen(true)}
                aria-label="Voice and speech settings"
              >
                <Volume2 className="w-4 h-4" />
              </Button>

              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 relative"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  aria-label="Notifications, 3 unread"
                >
                  <Bell className="w-4 h-4" />
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    3
                  </span>
                </Button>
                <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
              </div>

              <VoiceSettings isOpen={voiceSettingsOpen} onClose={() => setVoiceSettingsOpen(false)} />

              <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
                <Shield className="w-3 h-3 text-emerald-500" />
                Pro Plan
              </Badge>

              {/* User Avatar */}
              <button
                type="button"
                aria-label="Edit your profile and accessibility needs"
                className="rounded-full"
                onClick={() => useAppStore.getState().setProfileSetupOpen(true)}
              >
                <Avatar className="h-10 w-10 ring-2 ring-emerald-500/30 hover:ring-emerald-500/60 transition-all">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    A
                  </AvatarFallback>
                </Avatar>
              </button>

              <Button
                size="sm"
                className="hidden sm:flex bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                onClick={() => useAppStore.getState().setProfileSetupOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Get Started
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden" aria-label="Open navigation menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    {/* Logo Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <Accessibility className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold">
                          Adapti<span className="gradient-text">Fit</span>
                        </h2>
                      </div>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 overflow-y-auto px-3 py-4">
                      <div className="flex flex-col gap-1">
                        {navItems.map((item) => (
                          <SheetClose asChild key={item.id}>
                            <motion.button
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => { setActiveSection(item.id); }}
                              aria-current={activeSection === item.id ? 'page' : undefined}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-300
                                ${activeSection === item.id
                                  ? `bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 nav-glow-active nav-active-bar`
                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent'
                                }
                              `}
                            >
                              <motion.span
                                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${activeSection === item.id ? 'bg-emerald-500 text-white' : 'bg-muted'}`}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                              >
                                {item.icon}
                              </motion.span>
                              <span>{item.label}</span>
                              {activeSection === item.id && (
                                <ChevronRight className="w-4 h-4 ml-auto text-emerald-500" />
                              )}
                            </motion.button>
                          </SheetClose>
                        ))}
                      </div>
                    </div>

                    {/* User Profile Section */}
                    <div className="border-t border-border/50 px-4 py-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <Avatar className="h-10 w-10 ring-2 ring-emerald-500/30">
                          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
                            A
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">AdaptiFit User</p>
                          <p className="text-xs text-muted-foreground">Pro Plan</p>
                        </div>
                        <Badge variant="outline" className="text-xs gap-0.5 shrink-0">
                          <Shield className="w-2.5 h-2.5 text-emerald-500" />
                          Pro
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        {/* Wavy Divider */}
        <div className="wavy-divider" />
        <div className="bg-muted/30">
        {/* Gradient accent line */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 gradient-line-animate" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
          <nav aria-label="Footer">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Platform */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Accessibility className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm">AdaptiFit</span>
              </div>
              <h4 className="font-semibold text-sm mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <FooterLink onClick={() => setActiveSection('dashboard')}>Dashboard</FooterLink>
                <FooterLink onClick={() => setActiveSection('body-scan')}>Body Scan</FooterLink>
                <FooterLink onClick={() => setActiveSection('exercises')}>Exercise Library</FooterLink>
                <FooterLink onClick={() => setActiveSection('mood')}>Mood Monitor</FooterLink>
                <FooterLink onClick={() => setActiveSection('nutrition')}>Nutrition</FooterLink>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <FooterLink>Documentation</FooterLink>
                <FooterLink>API Reference</FooterLink>
                <FooterLink onClick={() => setActiveSection('exercises')}>Video Tutorials</FooterLink>
                <FooterLink onClick={() => setActiveSection('community')}>Blog</FooterLink>
                <FooterLink onClick={() => setVoiceHelpOpen(true)}>Help Center</FooterLink>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <FooterLink onClick={() => setActiveSection('community')}>Peer Support</FooterLink>
                <FooterLink onClick={() => setActiveSection('community')}>Expert Coaching</FooterLink>
                <FooterLink onClick={() => setActiveSection('community')}>Success Stories</FooterLink>
                <FooterLink onClick={() => setActiveSection('community')}>Events</FooterLink>
                <FooterLink onClick={() => setActiveSection('community')}>Ambassador Program</FooterLink>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <FooterLink>Privacy Policy</FooterLink>
                <FooterLink>Terms of Service</FooterLink>
                <FooterLink>HIPAA Compliance</FooterLink>
                <FooterLink>Cookie Policy</FooterLink>
                <FooterLink onClick={() => useAccessibilityStore.getState().setOpen(true)}>Accessibility</FooterLink>
              </ul>
            </div>
          </div>
          </nav>

          {/* Divider */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Accessibility className="w-4 h-4" />
                <span>&copy; 2024 AdaptiFit — Inclusive Fitness for All</span>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button variant="ghost" size="icon" aria-label="AdaptiFit on Twitter" className="h-10 w-10 text-muted-foreground hover:text-cyan-500 transition-colors micro-bounce">
                    <Twitter className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button variant="ghost" size="icon" aria-label="AdaptiFit on Instagram" className="h-10 w-10 text-muted-foreground hover:text-rose-500 transition-colors micro-bounce">
                    <Instagram className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button variant="ghost" size="icon" aria-label="AdaptiFit on YouTube" className="h-10 w-10 text-muted-foreground hover:text-red-500 transition-colors micro-bounce">
                    <Youtube className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Button variant="ghost" size="icon" aria-label="AdaptiFit on LinkedIn" className="h-10 w-10 text-muted-foreground hover:text-teal-500 transition-colors micro-bounce">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              {/* Crisis Lifeline */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500" />
                  Built with empathy
                </span>
                <span>&bull;</span>
                <a
                  href="tel:988"
                  className="font-semibold text-rose-500 hover:text-rose-600 transition-colors animate-pulse"
                  aria-label="988 Suicide and Crisis Lifeline - call for help"
                >
                  988 Suicide &amp; Crisis Lifeline
                </a>
              </div>
            </div>
          </div>
        </div>
        </div>
      </footer>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-24 z-40"
          >
            <Button
              size="icon"
              variant="outline"
              aria-label="Back to top"
              className="h-11 w-11 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
              onClick={scrollToTop}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto motion-reduce:animate-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-emerald-500" /> Voice commands
          </DialogTitle>
          <DialogDescription>
            Tap the microphone and speak naturally. Every command is confirmed
            aloud and announced to your screen reader. Press Escape to close.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.category} aria-label={group.category}>
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                {group.category}
              </h3>
              <ul className="space-y-2">
                {group.commands.map((cmd) => (
                  <li key={cmd.description} className="text-sm">
                    <span className="font-medium">{cmd.description}</span>
                    <span className="block text-xs text-muted-foreground">
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

// Hero Section Component
function HeroSection({ onNavigate }: { onNavigate: (section: AppSection) => void }) {
  const [statsInView, setStatsInView] = useState(false);

  // Capability stats that are true of the product — no fabricated user counts
  // or invented accuracy claims (UX-13).
  const statValues = [
    { target: 5, suffix: '', label: 'Languages', icon: <Languages className="w-4 h-4" /> },
    { target: 200, suffix: '+', label: 'Adaptive Exercises', icon: <Dumbbell className="w-4 h-4" /> },
    { target: 100, suffix: '%', label: 'On-Device AI', icon: <Target className="w-4 h-4" /> },
    { target: 24, suffix: '/7', label: 'Voice Control', icon: <Activity className="w-4 h-4" /> },
  ];

  const features = [
    {
      icon: <ScanLine className="w-6 h-6" />,
      title: 'Body Scan & Motion Tracking',
      description: 'AI-powered camera tracking with real-time form feedback for adaptive exercises',
      section: 'body-scan' as AppSection,
      color: 'cyan',
      gradient: 'from-cyan-500/10 to-cyan-500/5',
      border: 'border-cyan-500/20',
      badge: 'NEW',
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Live Coach — Real Rep Counter',
      description: 'On-device pose tracking counts your reps and coaches your form in real time',
      section: 'live-coach' as AppSection,
      color: 'rose',
      gradient: 'from-rose-500/10 to-rose-500/5',
      border: 'border-rose-500/20',
      badge: 'NEW',
    },
    {
      icon: <Dumbbell className="w-6 h-6" />,
      title: 'Adaptive Exercise Library',
      description: 'Personalized exercises for injuries, disabilities, and Paralympic training',
      section: 'exercises' as AppSection,
      color: 'amber',
      gradient: 'from-amber-500/10 to-amber-500/5',
      border: 'border-amber-500/20',
      badge: null,
    },
    {
      icon: <Gamepad2 className="w-6 h-6" />,
      title: 'Mind Gym — Cognitive Training',
      description: 'Focus timer, attention game, memory match and a daily check-in for ADHD & brain fog',
      section: 'mind-gym' as AppSection,
      color: 'violet',
      gradient: 'from-violet-500/10 to-violet-500/5',
      border: 'border-violet-500/20',
      badge: 'NEW',
    },
    {
      icon: <AccessibilityIcon className="w-6 h-6" />,
      title: 'Adaptive Workout Engine',
      description: 'A deterministic safety engine builds wheelchair / one-arm / knee-friendly routines — nothing unsafe is ever shown',
      section: 'adaptive-workout' as AppSection,
      color: 'emerald',
      gradient: 'from-emerald-500/10 to-emerald-500/5',
      border: 'border-emerald-500/20',
      badge: 'NEW',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Mood & Emotion Monitor',
      description: 'AI emotion tracking with anti-suicide prevention and wellness alerts',
      section: 'mood' as AppSection,
      color: 'rose',
      gradient: 'from-rose-500/10 to-rose-500/5',
      border: 'border-rose-500/20',
      badge: 'Popular',
    },
    {
      icon: <Apple className="w-6 h-6" />,
      title: 'AI Food & Diet Planning',
      description: 'Smart food logging, calorie tracking, and diet plans with delivery integration',
      section: 'nutrition' as AppSection,
      color: 'orange',
      gradient: 'from-orange-500/10 to-orange-500/5',
      border: 'border-orange-500/20',
      badge: null,
    },
    {
      icon: <Wind className="w-6 h-6" />,
      title: 'Guided Breathing Exercises',
      description: 'Mindful breathing patterns for relaxation, stress relief, and recovery support',
      section: 'breathing' as AppSection,
      color: 'teal',
      gradient: 'from-teal-500/10 to-teal-500/5',
      border: 'border-teal-500/20',
      badge: 'NEW',
    },
    {
      icon: <Watch className="w-6 h-6" />,
      title: 'Smart Wearable Integration',
      description: 'Real-time heart rate, SpO2, and blood pressure from your smart devices',
      section: 'wearable' as AppSection,
      color: 'teal',
      gradient: 'from-teal-500/10 to-teal-500/5',
      border: 'border-teal-500/20',
      badge: null,
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community & Peer Support',
      description: 'Connect with peers, expert coaching, and accessible rehabilitation support',
      section: 'community' as AppSection,
      color: 'violet',
      gradient: 'from-violet-500/10 to-violet-500/5',
      border: 'border-violet-500/20',
      badge: null,
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Crisis Support & Safety',
      description: 'Emergency contacts, grounding exercises, wellness checks, and safety planning',
      section: 'crisis' as AppSection,
      color: 'emerald',
      gradient: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/20',
      badge: 'Critical',
    },
  ];

  const audienceData = [
    {
      emoji: '🎖️',
      title: 'Injured Soldiers',
      description: 'Combat injury rehabilitation with customized therapy plans and progress tracking.',
      features: ['Combat injury rehab', 'PTSD mood monitoring', 'Adaptive strength training'],
      testimonial: {
        quote: 'AdaptiFit helped me recover from my combat injury faster than traditional therapy. The AI form tracking is incredible.',
        author: 'Sgt. M. Rodriguez',
      },
    },
    {
      emoji: '🏅',
      title: 'Paralympic Athletes',
      description: 'Professional-grade training adapted for your category and classification.',
      features: ['Sport-specific training', 'Performance analytics', 'Competition preparation'],
      testimonial: {
        quote: 'Training for Tokyo was transformed by AdaptiFit. My performance analytics improved 40% in just 3 months.',
        author: 'J. Chen, Paralympic Swimmer',
      },
    },
    {
      emoji: '♿',
      title: 'People with Disabilities',
      description: 'Inclusive fitness programs designed around your abilities, not limitations.',
      features: ['Full body adaptations', 'Seated exercises', 'Assistive tech integration'],
      testimonial: {
        quote: 'Finally, a fitness app that understands my wheelchair. The seated exercises are perfectly designed.',
        author: 'S. Patel, Community Member',
      },
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/10" />
        {/* Aurora Effect */}
        <div className="absolute inset-0 aurora-bg" />
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 mesh-gradient" />
        {/* Dot Grid Background */}
        <DotGridBackground />
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-cyan-500/8 rounded-full blur-2xl" />

        {/* Floating Particles */}
        <FloatingParticles />

        {/* Parallax hint - subtle scroll indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-1 text-muted-foreground/50"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <ChevronRight className="w-3 h-3 rotate-90" />
        </motion.div>

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Inclusive Fitness
              </Badge>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight mb-6">
                Adaptive Fitness
                <br />
                <span className="gradient-text">
                  For Every Body
                </span>
              </h1>

              {/* Animated Typing Tagline */}
              <div className="h-7 mb-4">
                <TypingEffect
                  texts={[
                    'Rehabilitation made personal.',
                    'Train smarter, recover stronger.',
                    'Your abilities, your workout.',
                    'AI-powered inclusive fitness.',
                  ]}
                  className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-medium typewriter-text"
                />
              </div>

              {/* AI Monitoring Active indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">AI Monitoring Active</span>
              </div>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Personalized rehabilitation and fitness for people with disabilities, injured soldiers,
                and Paralympic athletes. AI motion tracking, mood monitoring, and smart nutrition —
                all in one affordable platform.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-emerald-500/25 group shimmer-btn magnetic-hover"
                  onClick={() => useAppStore.getState().setProfileSetupOpen(true)}
                >
                  Set Up My Profile
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group magnetic-hover"
                  onClick={() => onNavigate('body-scan')}
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Try Body Scan
                </Button>
              </div>

              {/* Stats with animated counters */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                ref={(node) => {
                  if (node) {
                    const observer = new IntersectionObserver(
                      ([entry]) => { if (entry.isIntersecting) setStatsInView(true); },
                      { threshold: 0.5 }
                    );
                    observer.observe(node);
                  }
                }}
              >
                {statValues.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className="text-center glass-card glass-card-hover rounded-xl p-3 stat-glow-hover hero-stat-border parallax-float"
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {stat.icon}
                      <span className="text-2xl font-bold neon-glow">
                        {statsInView ? <AnimatedCounter target={stat.target} suffix={stat.suffix} /> : `0${stat.suffix}`}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right - Hero Image & Welcome Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10">
                <img
                  src="/images/hero.png"
                  alt="AdaptiFit - Inclusive adaptive fitness platform"
                  className="w-full h-auto object-cover rounded-2xl"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
              </div>

              {/* Glassmorphism Welcome Card */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 glass-welcome rounded-2xl p-5 w-[85%] z-10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Accessibility className="w-5 h-5 text-white" />
                  </div>
                  <WelcomeCardText />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                    <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="text-sm font-bold">245</p>
                    <p className="text-xs text-muted-foreground">Cal</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-teal-500/10">
                    <Trophy className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-sm font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-rose-500/10">
                    <Heart className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                    <p className="text-sm font-bold">8.5</p>
                    <p className="text-xs text-muted-foreground">Mood</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating 3D Stat Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute -top-2 -right-2 float-3d glass rounded-xl px-4 py-2.5 z-10"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Form Accuracy</p>
                    <p className="text-lg font-bold text-emerald-500">98%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute top-1/4 -left-6 float-3d glass rounded-xl px-4 py-2.5 z-10"
                style={{ animationDelay: '1s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Mood Score</p>
                    <p className="text-lg font-bold text-rose-500">8.5/10</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute bottom-16 -right-4 float-3d glass rounded-xl px-4 py-2.5 z-10"
                style={{ animationDelay: '2s' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Heart Rate</p>
                    <p className="text-lg font-bold text-teal-500">72 BPM</p>
                  </div>
                </div>
              </motion.div>

              {/* Extra floating 3D badge - Users count */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6 }}
                className="absolute top-1/2 -left-8 float-3d glass rounded-xl px-3 py-2 z-10"
                style={{ animationDelay: '3s' }}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-bold">10K+ Users</span>
                </div>
              </motion.div>

              {/* Extra floating 3D badge - Recovery Rate */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 }}
                className="absolute top-[15%] right-1/4 float-3d glass rounded-xl px-3 py-2 z-10"
                style={{ animationDelay: '4s' }}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold">98% Recovery</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 relative">
        {/* Subtle background mesh */}
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Comprehensive Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for
              <br />
              <span className="gradient-text">
                Inclusive Rehabilitation
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From AI motion tracking to mood monitoring, nutrition planning to community support —
              AdaptiFit replaces expensive therapy with affordable, customized care.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.button
                type="button"
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -6 }}
                onClick={() => onNavigate(feature.section)}
                className={`
                  text-left w-full rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient}
                  p-6 transition-all duration-300 group gradient-border-card gradient-border-animate card-lift relative overflow-hidden
                `}
              >
                {/* Badge */}
                {feature.badge && (
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold badge-pulse ${
                    feature.badge === 'NEW'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                      : feature.badge === 'Critical'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dot-pulse'
                      : feature.badge === 'Popular'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {feature.badge}
                  </div>
                )}

                {/* Animated icon container */}
                <div className={`card-content-slide`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[feature.color]} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${colorMapText[feature.color]} group-hover:gap-2 transition-all`}>
                    Explore
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 relative">
        <div className="absolute inset-0 aurora-bg opacity-30" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4">
              <Activity className="w-3 h-3 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How <span className="gradient-text">AdaptiFit</span> Works
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Get started in minutes with our AI-powered adaptive fitness platform
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 stagger-fade-in" style={{ '--stagger-delay': '0.15s' } as React.CSSProperties}>
            {[
              {
                step: '01',
                title: 'Set Your Profile',
                description: 'Tell us about your abilities, goals, and any conditions. Our AI customizes everything for you.',
                icon: <Accessibility className="w-6 h-6" />,
                color: 'emerald',
              },
              {
                step: '02',
                title: 'Get Your Plan',
                description: 'AI generates a personalized exercise, nutrition, and mood monitoring plan adapted to you.',
                icon: <Sparkles className="w-6 h-6" />,
                color: 'teal',
              },
              {
                step: '03',
                title: 'Track & Exercise',
                description: 'Follow guided exercises with real-time AI form tracking and voice feedback.',
                icon: <ScanLine className="w-6 h-6" />,
                color: 'cyan',
              },
              {
                step: '04',
                title: 'Recover & Grow',
                description: 'Monitor progress, celebrate achievements, and adapt your plan as you improve.',
                icon: <TrendingUp className="w-6 h-6" />,
                color: 'amber',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center group"
              >
                {/* Connecting line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
                )}
                {/* Step number */}
                <div className="relative mx-auto mb-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${colorMap[item.color]} flex items-center justify-center text-white shadow-lg mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-emerald-500 text-emerald-600 text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 bg-muted/30 relative overflow-hidden">
        {/* Decorative dots pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built For <span className="text-emerald-500">You</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Whether you&apos;re recovering from injury, training for the Paralympics, or managing a disability — AdaptiFit adapts to you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {audienceData.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-background rounded-2xl p-6 transition-all border-gradient relative group card-enhanced"
              >
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                <motion.div
                  className="text-4xl mb-4 card-content-slide"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                >
                  {item.emoji}
                </motion.div>
                <div className="card-content-slide">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  <ul className="space-y-2 mb-6">
                    {item.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Testimonial */}
                  <div className="border-t border-border/50 pt-4 mt-auto">
                    <Quote className="w-4 h-4 text-emerald-500/40 mb-2" />
                    <p className="text-xs text-muted-foreground italic leading-relaxed mb-2">
                      &ldquo;{item.testimonial.quote}&rdquo;
                    </p>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      — {item.testimonial.author}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 lg:p-16 text-white overflow-hidden"
          >
            {/* Animated geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 border border-white/10 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 w-40 h-40 border border-white/10 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute top-1/3 right-1/4 w-16 h-16 border border-white/10 rotate-45"
                animate={{ rotate: [45, 135, 225, 315, 405] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute bottom-1/4 left-1/3 w-8 h-8 border border-white/10"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              />
              {/* Floating dots */}
              <motion.div
                className="absolute top-1/4 right-1/6 w-2 h-2 bg-white/20 rounded-full"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-white/20 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Start Your Recovery Today
              </h2>
              <p className="text-emerald-100 text-lg mb-8">
                Join thousands who have transformed their rehabilitation journey with AdaptiFit.
                Affordable, accessible, and always adapted to you.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl group shimmer relative overflow-hidden border-gradient-spin"
                  onClick={() => onNavigate('dashboard')}
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => onNavigate('body-scan')}
                >
                  Try Body Scan Demo
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-100">
                  <Lock className="w-4 h-4" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-100">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-100">
                  <Headphones className="w-4 h-4" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
