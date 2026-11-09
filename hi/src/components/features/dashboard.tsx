'use client';

/**
 * Dashboard — Clinical Aurora redesign (design/dashboard.md).
 *
 * Daily command center: greeting + readiness, one next action, four KPI
 * StatTiles, today's adaptive plan, weekly movement chart, recovery/balance
 * cards, and a right rail (voice brief, quick actions, milestone, activity).
 *
 * Behavior preserved: i18n via t()/locale, app-store navigation contracts,
 * profile-setup entry points, ChartFigure accessibility pattern (recharts
 * SVG gets role="img" + sr-only caption + a data table alternative).
 * Existing dashboard.* i18n keys are reused; new copy is English-only.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Armchair,
  ArrowRight,
  AudioLines,
  Brain,
  Calendar,
  ChartNoAxesColumn,
  ChevronRight,
  CircleCheck,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Info,
  ListChecks,
  MessageCircleHeart,
  Moon,
  Pause,
  Play,
  Salad,
  ScanSearch,
  Sparkles,
  Timer,
  Trophy,
  UserRound,
  Video,
  Wind,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
} from 'recharts';

import {
  GlassPanel,
  StatTile,
  useReduced,
  EASE,
  SPRING,
  sectionEntrance,
  staggerContainer,
  staggerItem,
  reducedItem,
} from '@/components/ui/aurora';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { useToastStore } from '@/components/features/toast-provider';
import { weeklyExerciseData } from '@/lib/mock-data';
import { useAppStore } from '@/stores/app-store';
import { speechLocale, useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ── Accessible chart wrapper (existing ChartFigure pattern, UX-14) ──────────

function ChartFigure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <figure role="img" aria-label={summary} className="m-0">
      <figcaption className="sr-only">{summary}</figcaption>
      {children}
    </figure>
  );
}

// ── Derived data (from real stored mock data where available) ───────────────

const totalMinutesThisWeek = weeklyExerciseData.reduce((s, d) => s + d.minutes, 0);
const totalTargetThisWeek = weeklyExerciseData.reduce((s, d) => s + d.target, 0);
const targetPct = Math.round((totalMinutesThisWeek / totalTargetThisWeek) * 100);

/** Consecutive active days counting back from the most recent day. */
const dayStreak = (() => {
  let streak = 0;
  for (let i = weeklyExerciseData.length - 1; i >= 0; i--) {
    if (weeklyExerciseData[i].minutes > 0) streak++;
    else break;
  }
  return streak;
})();

const avgCompletion = Math.min(
  150,
  Math.round(
    weeklyExerciseData.reduce((s, d) => s + Math.min(100, (d.minutes / d.target) * 100), 0) /
      weeklyExerciseData.length,
  ),
);

// Weekly movement chart: minutes (bars), completion % (line), pain flare markers
const weeklyMovement = weeklyExerciseData.map((d, i) => ({
  day: d.day,
  minutes: d.minutes,
  completion: Math.min(100, Math.round((d.minutes / d.target) * 100)),
  pain: [2, 3, 5, 2, 3, 4, 2][i] ?? 2, // pain check-ins (sample history)
}));

// Recovery trend (7-day readiness, sample history until wearable data exists)
const recoveryTrend = [
  { day: 'Mon', readiness: 72 },
  { day: 'Tue', readiness: 75 },
  { day: 'Wed', readiness: 68 },
  { day: 'Thu', readiness: 77 },
  { day: 'Fri', readiness: 80 },
  { day: 'Sat', readiness: 78 },
  { day: 'Sun', readiness: 82 },
];

const balanceBars = [
  { label: 'Physical energy', value: 68, tone: 'var(--primary)' },
  { label: 'Mood', value: 72, tone: 'var(--secondary)' },
  { label: 'Pain comfort', value: 81, tone: 'var(--success)' },
  { label: 'Sleep', value: 64, tone: 'var(--accent)' },
];

const movementChartConfig: ChartConfig = {
  minutes: { label: 'Active minutes', color: 'var(--primary)' },
  completion: { label: 'Completion %', color: 'var(--secondary)' },
  pain: { label: 'Pain (flare day)', color: 'var(--warning)' },
};

const recoveryChartConfig: ChartConfig = {
  readiness: { label: 'Readiness', color: 'var(--primary)' },
};

// ── Readiness helpers ───────────────────────────────────────────────────────

function readinessBand(score: number): { label: string; stroke: string; chip: string } {
  if (score >= 80)
    return { label: 'Strong day', stroke: 'var(--primary)', chip: 'bg-primary-soft text-primary' };
  if (score >= 60)
    return { label: 'Steady day', stroke: 'var(--secondary)', chip: 'bg-secondary-soft text-secondary' };
  if (score >= 40)
    return { label: 'Gentle day', stroke: 'var(--warning)', chip: 'bg-warning-soft text-warning' };
  return { label: 'Recovery first', stroke: 'var(--warning)', chip: 'bg-warning-soft text-warning' };
}

function ReadinessRing({ score }: { score: number }) {
  const reduced = useReduced();
  const band = readinessBand(score);
  const size = 148;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative"
        role="img"
        aria-label={`Readiness ${score} out of 100 — ${band.label}`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeOpacity={0.45}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={band.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={reduced ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.7, ease: EASE.careOut, delay: 0.18 }
            }
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[42px] leading-none font-semibold tabular-nums text-foreground">
            {score}
          </span>
          <span className="mt-1 text-sm text-foreground-subtle">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Readiness</p>
        <span
          className={cn(
            'mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
            band.chip,
          )}
        >
          {band.label}
        </span>
      </div>
    </div>
  );
}

// ── Plan data ───────────────────────────────────────────────────────────────

interface PlanRow {
  id: string;
  name: string;
  meta: string;
}

const PLAN_STEADY: PlanRow[] = [
  { id: '1', name: 'Seated Shoulder Press', meta: '2 sets • 8 reps • Low impact' },
  { id: '2', name: 'Resisted Leg Extensions', meta: '2 sets • 10 reps • Low impact' },
  { id: '3', name: 'Wheelchair Yoga Flow', meta: '1 set • 6 min • Mobility' },
];

const PLAN_GENTLE: PlanRow[] = [
  { id: '1', name: 'Seated Shoulder Press', meta: '1 set • 6 reps • Seated' },
  { id: '2', name: 'Gentle Neck Mobility', meta: '1 set • 5 min • Seated' },
  { id: '3', name: 'Breathing Reset', meta: '1 set • 4 min • Restorative' },
];

// ── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const profileSetupComplete = useAppStore((s) => s.profileSetupComplete);
  const setProfileSetupOpen = useAppStore((s) => s.setProfileSetupOpen);
  const userName = useAppStore((s) => s.userName);
  const { locale, t } = useI18n();
  const addToast = useToastStore((s) => s.addToast);
  const reduced = useReduced();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [explainOpen, setExplainOpen] = useState(false);
  const [gentle, setGentle] = useState(false);
  const [briefPlaying, setBriefPlaying] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount flag
  useEffect(() => { setMounted(true); }, []);

  // Simulated initial data load → skeleton state (dashboard.md §8.2)
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(id);
  }, []);

  // Readiness score: same blended formula as the previous health score
  const readiness = useMemo(() => {
    const exerciseAdherence = Math.min(100, targetPct);
    const moodPercent = 70;
    const nutritionBalance = 72;
    const heartHealth = 85;
    return Math.min(
      100,
      Math.round(
        exerciseAdherence * 0.3 + moodPercent * 0.25 + nutritionBalance * 0.25 + heartHealth * 0.2,
      ),
    );
  }, []);

  const band = readinessBand(readiness);
  const dateStr = mounted
    ? new Date().toLocaleDateString(speechLocale(locale), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '\u00A0';

  const greeting = (() => {
    if (!mounted) return '\u00A0';
    const h = new Date().getHours();
    const dayPart = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    return userName ? `${dayPart}, ${userName}.` : t('dashboard.welcomeBack');
  })();

  const planRows = gentle ? PLAN_GENTLE : PLAN_STEADY;

  const handleGentlerPlan = () => {
    setGentle(true);
    addToast({
      type: 'success',
      title: 'Plan adjusted',
      description: 'Plan adjusted to gentler intensity.',
    });
  };

  const openAIChat = () => {
    document
      .querySelector<HTMLButtonElement>('button[aria-label="Open AdaptiFit AI Chat"]')
      ?.click();
  };

  if (loading) {
    return <DashboardSkeleton reduced={reduced} />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Screen-reader section announcement (dashboard.md §9) */}
      <div aria-live="polite" className="sr-only">
        {`Dashboard. Readiness ${readiness}. Your next action is Continue Today's Session.`}
      </div>

      {/* ── 1. Greeting / readiness panel ─────────────────────────────────── */}
      <motion.div
        {...(reduced
          ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.14 } }
          : {
              initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
              animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
              transition: { duration: 0.42, ease: EASE.careOut },
            })}
      >
        <GlassPanel radius="2xl" className="p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {dateStr}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                {greeting}
              </h1>
              <p className="mt-2 max-w-xl text-base text-foreground-muted sm:text-lg">
                {gentle || readiness < 60
                  ? 'Your plan is adjusted for a gentler day.'
                  : 'Your plan is calibrated for steady recovery today.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  className="btn-aurora-primary h-12 rounded-[14px] px-5 text-sm font-semibold"
                  onClick={() => setActiveSection('adaptive-workout')}
                >
                  <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                  Continue Today&apos;s Session
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-[14px] px-5 text-sm font-semibold"
                  onClick={() => setActiveSection('live-coach')}
                >
                  <Video className="mr-2 h-4 w-4" aria-hidden="true" />
                  Open Live Coach
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 gap-2 text-sm text-foreground-muted hover:text-foreground"
                  onClick={() => setExplainOpen(true)}
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                  How is this calculated?
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              <ReadinessRing score={readiness} />
              <div className="flex flex-row gap-2 sm:flex-col">
                {[
                  { icon: Moon, label: 'Sleep', value: '7h 20m', tone: 'bg-secondary-soft text-secondary' },
                  { icon: HeartPulse, label: 'Pain', value: '3/10', tone: 'bg-warning-soft text-warning' },
                  { icon: Zap, label: 'Energy', value: 'Steady', tone: 'bg-primary-soft text-primary' },
                ].map((chip, i) => (
                  <motion.span
                    key={chip.label}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0.14 }
                        : { duration: 0.24, ease: EASE.careOut, delay: 0.18 + i * 0.05 }
                    }
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium',
                      chip.tone,
                    )}
                  >
                    <chip.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs uppercase tracking-wide opacity-80">{chip.label}</span>
                    <span className="font-semibold">{chip.value}</span>
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ── 2. KPI metric row ─────────────────────────────────────────────── */}
      <motion.div
        variants={reduced ? undefined : staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:gap-6 xl:grid-cols-4"
      >
        {[
          {
            icon: <Flame className="h-5 w-5" aria-hidden="true" />,
            label: 'Day streak',
            value: dayStreak,
            delta: weeklyExerciseData[weeklyExerciseData.length - 1].minutes > 0 ? '+1 today' : 'Keep it going',
            deltaTone: 'accent' as const,
            tone: 'accent' as const,
            sr: `${dayStreak} day streak`,
            section: 'adaptive-workout' as const,
          },
          {
            icon: <Timer className="h-5 w-5" aria-hidden="true" />,
            label: 'Active minutes',
            value: totalMinutesThisWeek,
            delta: `${targetPct}% of weekly target`,
            deltaTone: 'primary' as const,
            tone: 'primary' as const,
            sr: `${totalMinutesThisWeek} active minutes this week, ${targetPct} percent of target`,
            section: 'adaptive-workout' as const,
          },
          {
            icon: <CircleCheck className="h-5 w-5" aria-hidden="true" />,
            label: 'Plan completion',
            value: `${avgCompletion}%`,
            delta: avgCompletion >= 80 ? 'On target' : avgCompletion >= 50 ? 'Needs review' : 'Adjust plan',
            deltaTone: 'secondary' as const,
            tone: 'secondary' as const,
            sr: `Plan completion ${avgCompletion} percent`,
            section: 'adaptive-workout' as const,
          },
          {
            icon: <HeartPulse className="h-5 w-5" aria-hidden="true" />,
            label: 'Recovery signals',
            value: 'Stable',
            delta: 'Pain easing, mood steady',
            deltaTone: 'success' as const,
            tone: 'success' as const,
            sr: 'Recovery signals stable — pain easing and mood steady',
            section: 'body-scan' as const,
          },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={reduced ? reducedItem : staggerItem}>
            <button
              type="button"
              onClick={() => setActiveSection(kpi.section)}
              aria-label={kpi.sr}
              className="block w-full rounded-[24px] text-left"
            >
              <StatTile
                className="min-h-[148px] transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)]"
                icon={kpi.icon}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                deltaTone={kpi.deltaTone}
                tone={kpi.tone}
              />
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* ── 3. Main grid: main column (8) + right rail (4) ────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {/* Today's Adaptive Plan / first-use personalize card */}
          <motion.div {...(reduced ? { variants: undefined, ...fadeOnly() } : { ...entrance() })}>
            {profileSetupComplete ? (
              <GlassPanel className="p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                      Today&apos;s plan
                    </p>
                    <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
                      Adaptive Strength &amp; Mobility
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                        gentle ? 'bg-info-soft text-info' : band.chip,
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {gentle ? 'Gentle' : band.label.replace(' day', '')}
                    </span>
                    <Button variant="ghost" size="sm" className="h-11 text-sm text-foreground-muted">
                      Edit plan
                    </Button>
                  </div>
                </div>

                {/* Plan summary row */}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground-muted">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                    {gentle ? '12 min' : '18 min'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
                    {gentle ? '3 exercises' : '6 exercises'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Armchair className="h-5 w-5 text-primary" aria-hidden="true" />
                    Chair support included
                  </span>
                </div>

                {/* Exercise rows (crossfade on plan change) */}
                <AnimatePresence mode="wait">
                  <motion.ul
                    key={gentle ? 'gentle' : 'steady'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.24 } }}
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                    className="mt-4 space-y-2"
                  >
                    {planRows.map((row, i) => (
                      <motion.li
                        key={row.id}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                          reduced
                            ? { duration: 0.14 }
                            : { duration: 0.3, ease: EASE.careOut, delay: i * 0.06 }
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setActiveSection('adaptive-workout')}
                          className="flex min-h-16 w-full items-center gap-3 rounded-[18px] px-3 py-2 text-left transition-colors hover:bg-surface-raised"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft font-mono text-sm font-semibold text-primary">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-semibold text-foreground">
                              {row.name}
                            </span>
                            <span className="block text-sm text-foreground-subtle">{row.meta}</span>
                          </span>
                          <ChevronRight className="h-5 w-5 shrink-0 text-foreground-subtle" aria-hidden="true" />
                        </button>
                      </motion.li>
                    ))}
                  </motion.ul>
                </AnimatePresence>

                {/* Adaptive note */}
                <div className="mt-4 flex items-start gap-2.5 rounded-[14px] bg-info-soft p-3.5 text-sm text-info">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    Adapted for you: lower-impact tempo, seated alternatives, and longer rest
                    periods.
                  </p>
                </div>

                {/* Footer actions */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    className="btn-aurora-primary h-12 rounded-[14px] px-5 text-sm font-semibold"
                    onClick={() => setActiveSection('adaptive-workout')}
                  >
                    <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                    Start Workout
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-[14px] px-5 text-sm font-semibold"
                    onClick={() => setActiveSection('exercises')}
                  >
                    Swap Exercises
                  </Button>
                  {!gentle && (
                    <Button
                      variant="ghost"
                      className="h-11 text-sm text-foreground-muted hover:text-foreground"
                      onClick={handleGentlerPlan}
                    >
                      I need a gentler plan
                    </Button>
                  )}
                </div>
                <div aria-live="polite" className="sr-only">
                  {gentle ? 'Plan adjusted to gentler intensity.' : ''}
                </div>
              </GlassPanel>
            ) : (
              /* First-use: personalize (dashboard.md §8.1) */
              <GlassPanel className="p-5 md:p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <UserRound className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Personalize your plan
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                      Tell AdaptiFit about your body, goals, and access needs so every
                      recommendation starts in the right place.{' '}
                      <span className="font-medium text-foreground">
                        Until then, this dashboard shows sample data.
                      </span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        className="btn-aurora-primary h-12 rounded-[14px] px-5 text-sm font-semibold"
                        onClick={() => setProfileSetupOpen(true)}
                      >
                        Complete profile
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-[14px] px-5 text-sm font-semibold"
                        onClick={() => useAppStore.getState().setProfileSetupDismissed(true)}
                      >
                        Explore with defaults
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            )}
          </motion.div>

          {/* Weekly movement chart */}
          <motion.div {...(reduced ? fadeOnly() : entrance())}>
            <GlassPanel className="p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Weekly movement
                  </h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Minutes, completion, and recovery in one view.
                  </p>
                </div>
              </div>

              {weeklyMovement.length === 0 ? (
                <div className="mt-6 flex flex-col items-center gap-3 py-10 text-center">
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface-raised text-foreground-subtle">
                    <ChartNoAxesColumn className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">No movement data yet</h3>
                  <p className="max-w-sm text-sm text-foreground-muted">
                    Complete one adaptive workout and your weekly rhythm will appear here.
                  </p>
                  <Button
                    className="btn-aurora-primary mt-1 h-12 rounded-[14px] px-5 text-sm font-semibold"
                    onClick={() => setActiveSection('adaptive-workout')}
                  >
                    Start first workout
                  </Button>
                </div>
              ) : (
                <ChartFigure summary="Weekly movement chart: daily active minutes as bars, plan completion as a line, and pain flare days marked. A data table follows.">
                  <ChartContainer
                    config={movementChartConfig}
                    className="mt-4 h-[280px] w-full md:h-[320px]"
                  >
                    <ComposedChart
                      data={weeklyMovement}
                      margin={{ top: 8, right: 4, left: -12, bottom: 4 }}
                      accessibilityLayer
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                        strokeOpacity={0.35}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tick={{ fill: 'var(--foreground-subtle)' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tick={{ fill: 'var(--foreground-subtle)' }}
                        tickFormatter={(v: number) => `${v}m`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tick={{ fill: 'var(--foreground-subtle)' }}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as (typeof weeklyMovement)[number];
                          return (
                            <div className="glass-overlay rounded-[14px] px-3.5 py-2.5 text-sm text-foreground">
                              <p className="font-semibold">{label}</p>
                              <p className="text-foreground-muted">
                                {d.minutes} min • {d.completion}% complete • Pain {d.pain}/10
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="minutes"
                        fill="var(--primary)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={36}
                        isAnimationActive={!reduced}
                        animationDuration={420}
                        animationEasing="ease-out"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="completion"
                        stroke="var(--secondary)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--secondary)', strokeWidth: 0 }}
                        activeDot={{ r: 8 }}
                        isAnimationActive={!reduced}
                        animationDuration={700}
                      />
                      <Line
                        yAxisId="right"
                        dataKey={(d: (typeof weeklyMovement)[number]) =>
                          d.pain >= 4 ? d.completion : null
                        }
                        stroke="none"
                        dot={{ r: 5, fill: 'var(--warning)', strokeWidth: 0 }}
                        isAnimationActive={false}
                        legendType="none"
                        tooltipType="none"
                        name="Pain flare"
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ChartContainer>
                  {/* Screen-reader data table alternative (dashboard.md §9) */}
                  <table className="sr-only">
                    <caption>Daily movement values for the past week</caption>
                    <thead>
                      <tr>
                        <th scope="col">Day</th>
                        <th scope="col">Active minutes</th>
                        <th scope="col">Completion</th>
                        <th scope="col">Pain (0–10)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyMovement.map((d) => (
                        <tr key={d.day}>
                          <th scope="row">{d.day}</th>
                          <td>{d.minutes}</td>
                          <td>{d.completion}%</td>
                          <td>{d.pain}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ChartFigure>
              )}
            </GlassPanel>
          </motion.div>

          {/* Recovery trend + Body & mind balance */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div {...(reduced ? fadeOnly() : entrance())}>
              <GlassPanel className="h-full p-5 md:p-6">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Recovery trend
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Seven-day readiness signal.
                </p>
                <ChartFigure summary="Recovery trend line chart showing readiness over the last seven days, ending today.">
                  <ChartContainer config={recoveryChartConfig} className="mt-4 h-[220px] w-full">
                    <AreaChart data={recoveryTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.35} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: 'var(--foreground-subtle)' }} />
                      <YAxis domain={[50, 100]} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: 'var(--foreground-subtle)' }} />
                      <ChartTooltip
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="glass-overlay rounded-[14px] px-3.5 py-2.5 text-sm text-foreground">
                              <p className="font-semibold">{label}</p>
                              <p className="text-foreground-muted">Readiness {payload[0].value}</p>
                            </div>
                          ) : null
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="readiness"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="var(--primary)"
                        fillOpacity={0.12}
                        isAnimationActive={!reduced}
                        animationDuration={700}
                      />
                      <ReferenceDot
                        x={recoveryTrend[recoveryTrend.length - 1].day}
                        y={recoveryTrend[recoveryTrend.length - 1].readiness}
                        r={5}
                        fill="var(--accent)"
                        stroke="none"
                        label={{ value: 'Today', position: 'top', fill: 'var(--foreground-subtle)', fontSize: 12 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </ChartFigure>
              </GlassPanel>
            </motion.div>

            <motion.div {...(reduced ? fadeOnly() : entrance())}>
              <GlassPanel className="h-full p-5 md:p-6">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Body &amp; mind balance
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Four signals, side by side.
                </p>
                <div className="mt-5 space-y-5">
                  {balanceBars.map((bar, i) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{bar.label}</span>
                        <span className="font-mono font-semibold tabular-nums text-foreground-muted">
                          {bar.value}%
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-raised"
                        role="img"
                        aria-label={`${bar.label} ${bar.value} percent`}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: bar.tone }}
                          initial={reduced ? false : { width: 0 }}
                          whileInView={{ width: `${bar.value}%` }}
                          viewport={{ once: true, amount: 0.4 }}
                          transition={
                            reduced
                              ? { duration: 0 }
                              : { duration: 0.52, ease: EASE.careOut, delay: i * 0.07 }
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </div>

        {/* ── Right rail ──────────────────────────────────────────────────── */}
        <div className="space-y-6 xl:col-span-4">
          {/* Voice brief */}
          <motion.div {...(reduced ? fadeOnly() : entrance())}>
            <GlassPanel className="p-5">
              <div className="flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-secondary" aria-hidden="true" />
                <h2 className="font-display text-lg font-semibold text-foreground">Voice brief</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                You are {Math.max(0, totalTargetThisWeek - totalMinutesThisWeek)} minutes away from
                your weekly goal. Want a gentle session?
              </p>
              {/* Waveform strip: 5 bars, 24px, secondary */}
              <div className="mt-4 flex h-6 items-center gap-[3px]" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    className="h-6 w-[3px] origin-center rounded-full bg-secondary"
                    animate={
                      briefPlaying && !reduced
                        ? { scaleY: [0.35, 1, 0.35] }
                        : { scaleY: 0.35 }
                    }
                    transition={
                      briefPlaying && !reduced
                        ? { duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }
                        : { duration: 0.16 }
                    }
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full"
                  aria-label={briefPlaying ? 'Pause daily brief' : 'Play daily brief'}
                  onClick={() => setBriefPlaying((p) => !p)}
                >
                  {briefPlaying ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                <button
                  type="button"
                  onClick={openAIChat}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open voice commands
                </button>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Quick actions */}
          <motion.div {...(reduced ? fadeOnly() : entrance())}>
            <GlassPanel className="p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Quick actions</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Scan body', icon: ScanSearch, action: () => setActiveSection('body-scan') },
                  { label: 'Log mood', icon: HeartPulse, action: () => setActiveSection('mood') },
                  { label: 'Breathe', icon: Wind, action: () => setActiveSection('breathing') },
                  { label: 'Ask AI', icon: Sparkles, action: openAIChat },
                ].map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={qa.action}
                    className="flex min-h-[72px] flex-col items-start justify-center gap-1.5 rounded-2xl bg-surface-raised p-3.5 text-left transition-colors hover:bg-surface-overlay"
                  >
                    <qa.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold text-foreground">{qa.label}</span>
                  </button>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Next milestone */}
          <motion.div {...(reduced ? fadeOnly() : entrance())}>
            <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-accent-soft p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-accent">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Next milestone
                </h2>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Recovery Rhythm badge</span>
                <span className="font-mono font-semibold tabular-nums text-accent">8 of 10 sessions</span>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
                role="progressbar"
                aria-valuenow={8}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-label="Recovery Rhythm badge progress: 8 of 10 sessions"
              >
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={reduced ? false : { width: 0 }}
                  whileInView={{ width: '80%' }}
                  viewport={{ once: true }}
                  transition={reduced ? { duration: 0 } : { duration: 0.6, ease: EASE.careOut }}
                />
              </div>
              <p className="mt-3 text-sm text-foreground-muted">
                Two more sessions unlock your Recovery Rhythm badge.
              </p>
            </div>
          </motion.div>

          {/* Recent activity */}
          <motion.div {...(reduced ? fadeOnly() : entrance())}>
            <GlassPanel className="p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent activity</h2>
              <ul className="mt-4 space-y-3.5">
                {[
                  { icon: CircleCheck, title: 'Adaptive workout completed', meta: 'Yesterday • 18 min', chip: 'Completed', chipTone: 'bg-success-soft text-success' },
                  { icon: MessageCircleHeart, title: 'Mood logged', meta: 'Yesterday', chip: 'Calm', chipTone: 'bg-secondary-soft text-secondary' },
                  { icon: ScanSearch, title: 'Body scan updated', meta: '2 days ago', chip: 'Shoulder focus', chipTone: 'bg-warning-soft text-warning' },
                ].map((row) => (
                  <li key={row.title} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-foreground-muted">
                      <row.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                      <p className="text-xs text-foreground-subtle">{row.meta}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', row.chipTone)}>
                      {row.chip}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'Activity history',
                    description: 'Your full activity history lives in Progress export.',
                  })
                }
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View all activity
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </GlassPanel>
          </motion.div>
        </div>
      </div>

      {/* ── 4. Secondary wellness strip ───────────────────────────────────── */}
      <motion.div
        variants={reduced ? undefined : staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6"
      >
        {[
          {
            icon: Salad,
            title: 'Nutrition',
            metric: '5 of 8 glasses',
            copy: 'Hydration is on track — a protein-rich snack fits your recovery window.',
            cta: 'Open nutrition',
            section: 'nutrition' as const,
          },
          {
            icon: Brain,
            title: 'Mind Gym',
            metric: 'Focus 82',
            copy: 'Latest focus score 82. A 3-minute pattern game is recommended today.',
            cta: 'Play a game',
            section: 'mind-gym' as const,
          },
          {
            icon: MessageCircleHeart,
            title: 'Community',
            metric: '3 cheers',
            copy: 'Your streak inspired three members this week. Share one small win?',
            cta: 'Visit community',
            section: 'community' as const,
          },
        ].map((card) => (
          <motion.div key={card.title} variants={reduced ? reducedItem : staggerItem}>
            <GlassPanel interactive className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-semibold text-foreground">{card.title}</h2>
                <span className="ml-auto rounded-full bg-surface-raised px-2.5 py-1 font-mono text-xs font-semibold text-foreground-muted">
                  {card.metric}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground-muted">{card.copy}</p>
              <button
                type="button"
                onClick={() => setActiveSection(card.section)}
                className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {card.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </GlassPanel>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Readiness explanation dialog (dashboard.md §3.4) ──────────────── */}
      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent className="glass-overlay sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">How readiness works</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-foreground-muted">
              Readiness combines your recent activity, pain check-ins, sleep or wearable data,
              mood, and completed sessions. It is a guide, not a diagnosis. You can always choose
              a gentler session.
            </DialogDescription>
          </DialogHeader>
          <ul className="mt-2 space-y-2.5">
            {[
              { icon: Activity, label: 'Activity', weight: '30%' },
              { icon: HeartPulse, label: 'Recovery', weight: '30%' },
              { icon: ScanSearch, label: 'Pain & mobility', weight: '25%' },
              { icon: MessageCircleHeart, label: 'Mood', weight: '15%' },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-3 rounded-[14px] bg-surface-raised px-4 py-3"
              >
                <row.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="flex-1 text-sm font-medium text-foreground">{row.label}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground-muted">
                  {row.weight}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Motion prop helpers (section entrances) ─────────────────────────────────

function entrance() {
  return {
    initial: sectionEntrance.initial,
    whileInView: sectionEntrance.whileInView,
    viewport: sectionEntrance.viewport,
    transition: sectionEntrance.transition,
  } as const;
}

function fadeOnly() {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.14, ease: 'linear' },
  } as const;
}

// ── Loading skeleton (dashboard.md §8.2) ────────────────────────────────────

function DashboardSkeleton({ reduced }: { reduced: boolean }) {
  const shimmer = reduced ? '' : 'skeleton-shimmer';
  return (
    <div className="w-full space-y-6" aria-busy="true">
      <p role="status" className="sr-only">
        Loading your progress…
      </p>
      <GlassPanel radius="2xl" className="p-5 md:p-7">
        <div className={cn('h-[42px] w-2/3 max-w-md rounded-[14px] bg-surface-raised', shimmer)} />
        <div className={cn('mt-4 h-[22px] w-1/2 max-w-sm rounded-[10px] bg-surface-raised', shimmer)} />
        <div className="mt-6 flex gap-3">
          <div className={cn('h-12 w-48 rounded-[14px] bg-surface-raised', shimmer)} />
          <div className={cn('h-12 w-40 rounded-[14px] bg-surface-raised', shimmer)} />
        </div>
      </GlassPanel>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <GlassPanel key={i} className={cn('min-h-[148px] p-5', shimmer)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <GlassPanel className={cn('min-h-[320px] xl:col-span-8', shimmer)}>
          <p className="p-6 text-sm text-foreground-muted">Loading your progress…</p>
        </GlassPanel>
        <GlassPanel className={cn('min-h-[320px] xl:col-span-4', shimmer)} />
      </div>
    </div>
  );
}
