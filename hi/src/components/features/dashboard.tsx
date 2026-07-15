'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Flame,
  Heart,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Zap,
  PlayCircle,
  SmilePlus,
  ScanLine,
  HeartPulse,
  CheckCircle2,
  Circle,
  Bell,
  Quote,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
} from 'lucide-react';
import TTSSpeaker from '@/components/features/tts-speaker';
import AchievementShowcase from '@/components/features/achievement-showcase';
import DailyChallenges from '@/components/features/daily-challenges';
import WeeklyGoals from '@/components/features/weekly-goals';
import HealthInsights from '@/components/features/health-insights';
import SleepTracker from '@/components/features/sleep-tracker';
import HydrationTracker from '@/components/features/hydration-tracker';
import RehabTimeline from '@/components/features/rehab-timeline';
import PainJournal from '@/components/features/pain-journal';
import ProgressExport from './progress-export';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

import {
  weeklyExerciseData,
  monthlyMoodData,
  heartRateData,
  progressData,
  calorieTrackingData,
  recentAchievements,
} from '@/lib/mock-data';
import { useAppStore } from '@/stores/app-store';

// ── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ── Chart configs ────────────────────────────────────────────────────────────

const weeklyExerciseConfig: ChartConfig = {
  minutes: { label: 'Minutes', color: '#10b981' },
  target: { label: 'Target', color: '#f59e0b' },
};

const progressConfig: ChartConfig = {
  strength: { label: 'Strength', color: '#10b981' },
  flexibility: { label: 'Flexibility', color: '#f59e0b' },
  endurance: { label: 'Endurance', color: '#f43f5e' },
  balance: { label: 'Balance', color: '#06b6d4' },
};

const calorieConfig: ChartConfig = {
  intake: { label: 'Intake', color: '#f59e0b' },
  burned: { label: 'Burned', color: '#f43f5e' },
  target: { label: 'Target', color: '#10b981' },
};

const heartRateConfig: ChartConfig = {
  bpm: { label: 'BPM', color: '#f43f5e' },
};

const moodConfig: ChartConfig = {
  happy: { label: 'Happy', color: '#10b981' },
  calm: { label: 'Calm', color: '#06b6d4' },
  anxious: { label: 'Anxious', color: '#f59e0b' },
  sad: { label: 'Sad', color: '#f43f5e' },
};

// ── Heart rate zone colouring ───────────────────────────────────────────────

const zoneColors: Record<string, string> = {
  Resting: '#10b981',
  Light: '#06b6d4',
  Moderate: '#f59e0b',
  Vigorous: '#f43f5e',
};

// ── Helper: today's date string ─────────────────────────────────────────────

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Stat card data ───────────────────────────────────────────────────────────

const totalMinutesThisWeek = weeklyExerciseData.reduce(
  (sum, d) => sum + d.minutes,
  0
);
const totalTargetThisWeek = weeklyExerciseData.reduce(
  (sum, d) => sum + d.target,
  0
);
const caloriesBurnedToday = weeklyExerciseData[0]?.calories ?? 0;
const moodScore = 7;
const formAccuracy = 87;

// ── Sparkline data (last 7 days) ────────────────────────────────────────────

const exerciseSparkline = [25, 35, 20, 45, 30, 40, 15];
const calorieSparkline = [150, 210, 120, 270, 180, 240, 90];
const moodSparkline = [6, 7, 5, 8, 7, 9, 7];
const formSparkline = [82, 85, 88, 84, 90, 87, 89];

const statCards = [
  {
    title: 'Exercise Minutes',
    value: `${totalMinutesThisWeek}`,
    subtitle: `of ${totalTargetThisWeek} min target`,
    progress: Math.round((totalMinutesThisWeek / totalTargetThisWeek) * 100),
    icon: Activity,
    gradient: 'from-emerald-500 to-emerald-600',
    bgGlow: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    sparkline: exerciseSparkline,
    sparkColor: '#10b981',
    comparison: { value: 12, direction: 'up' as const },
    cardGradient: 'from-emerald-500/5 via-emerald-500/10 to-emerald-500/5',
  },
  {
    title: 'Calories Burned',
    value: `${caloriesBurnedToday}`,
    subtitle: 'kcal today',
    progress: Math.round((caloriesBurnedToday / 300) * 100),
    icon: Flame,
    gradient: 'from-amber-500 to-amber-600',
    bgGlow: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    sparkline: calorieSparkline,
    sparkColor: '#f59e0b',
    comparison: { value: 8, direction: 'up' as const },
    cardGradient: 'from-amber-500/5 via-amber-500/10 to-amber-500/5',
  },
  {
    title: 'Mood Score',
    value: `${moodScore}`,
    subtitle: 'out of 10',
    progress: moodScore * 10,
    icon: Heart,
    gradient: 'from-rose-500 to-rose-600',
    bgGlow: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    sparkline: moodSparkline,
    sparkColor: '#f43f5e',
    comparison: { value: 5, direction: 'down' as const },
    cardGradient: 'from-rose-500/5 via-rose-500/10 to-rose-500/5',
  },
  {
    title: 'Form Accuracy',
    value: `${formAccuracy}%`,
    subtitle: 'average this week',
    progress: formAccuracy,
    icon: Target,
    gradient: 'from-cyan-500 to-cyan-600',
    bgGlow: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    sparkline: formSparkline,
    sparkColor: '#06b6d4',
    comparison: { value: 3, direction: 'up' as const },
    cardGradient: 'from-cyan-500/5 via-cyan-500/10 to-cyan-500/5',
  },
];

// ── Weekly streak calendar data ─────────────────────────────────────────────

type DayStatus = 'completed' | 'partial' | 'missed' | 'today';

const streakCalendar: { week: number; days: DayStatus[] }[] = [
  { week: 1, days: ['completed', 'completed', 'partial', 'completed', 'completed', 'missed', 'completed'] },
  { week: 2, days: ['completed', 'partial', 'completed', 'missed', 'completed', 'completed', 'completed'] },
  { week: 3, days: ['completed', 'completed', 'completed', 'completed', 'partial', 'completed', 'missed'] },
  { week: 4, days: ['completed', 'completed', 'partial', 'completed', 'today', 'missed', 'missed'] },
];

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Quick action buttons ────────────────────────────────────────────────────

const quickActions: { label: string; icon: typeof PlayCircle; color: string; bgColor: string; section: 'body-scan' | 'mood' | 'nutrition' | 'wearable' }[] = [
  { label: 'Start Exercise', icon: PlayCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20', section: 'body-scan' },
  { label: 'Log Mood', icon: SmilePlus, color: 'text-rose-600', bgColor: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20', section: 'mood' },
  { label: 'Scan Food', icon: ScanLine, color: 'text-orange-600', bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20', section: 'nutrition' },
  { label: 'Check Heart', icon: HeartPulse, color: 'text-teal-600', bgColor: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20', section: 'wearable' },
];

// ── All achievements (including unearned) ───────────────────────────────────

const allAchievements = [
  ...recentAchievements,
  { id: '5', title: 'Heart Champion', description: 'Maintain resting HR below 70 for 30 days', icon: '❤️‍🔥', date: '' },
  { id: '6', title: 'Flexibility Guru', description: 'Complete 20 flexibility sessions', icon: '🤸', date: '' },
  { id: '7', title: 'Community Star', description: 'Post 10 helpful forum replies', icon: '⭐', date: '' },
];

// ── Today's plan data ───────────────────────────────────────────────────────

interface PlanExercise {
  id: string;
  name: string;
  time: string;
  duration: string;
  completed: boolean;
}

const todaysExercises: PlanExercise[] = [
  { id: '1', name: 'Seated Shoulder Press', time: '9:00 AM', duration: '10 min', completed: true },
  { id: '2', name: 'Resisted Leg Extensions', time: '10:00 AM', duration: '15 min', completed: true },
  { id: '3', name: 'Wheelchair Yoga Flow', time: '2:00 PM', duration: '20 min', completed: false },
  { id: '4', name: 'Upper Body Circuit', time: '4:00 PM', duration: '30 min', completed: false },
];

const upcomingReminders = [
  { id: '1', text: 'Take medication', time: '1:00 PM' },
  { id: '2', text: 'Evening stretching', time: '6:00 PM' },
  { id: '3', text: 'Log dinner nutrition', time: '7:30 PM' },
];

const motivationalQuotes = [
  '"Every step forward is progress, no matter how small."',
  '"Your body can stand almost anything. It\'s your mind you have to convince."',
  '"Rehabilitation is not a race — it\'s a journey of resilience."',
  '"The only bad workout is the one that didn\'t happen."',
];

// ── Custom tooltip for heart rate ────────────────────────────────────────────

interface HeartRatePayloadEntry {
  value: number;
  payload: { zone: string; time: string; bpm: number };
}

function HeartRateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: HeartRatePayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{data.time}</p>
      <p style={{ color: zoneColors[data.zone] ?? '#f43f5e' }}>
        {data.bpm} BPM — {data.zone}
      </p>
    </div>
  );
}

// ── Sparkline mini chart component ──────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Health Score circular gauge ─────────────────────────────────────────────

function HealthScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 72;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = animatedScore;
    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + (score - start) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 75) return '#10b981';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const color = getScoreColor(animatedScore);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90 health-ring-glow w-32 h-32 sm:w-full sm:h-full">
          {/* Outer decorative ring */}
          <circle
            stroke="currentColor"
            className="text-muted/10"
            fill="transparent"
            r={normalizedRadius + 8}
            cx={radius}
            cy={radius}
            strokeWidth={2}
            strokeDasharray="4 6"
          />
          {/* Background circle */}
          <circle
            stroke="currentColor"
            className="text-muted/30"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeWidth={strokeWidth}
          />
          {/* Animated arc with gradient */}
          <defs>
            <linearGradient id="healthArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle
            stroke={animatedScore >= 75 ? 'url(#healthArcGradient)' : color}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold tabular-nums counter-roll" style={{ color }}>
            <span>{animatedScore}</span>
          </span>
          <span className="text-muted-foreground text-xs font-medium">/ 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-base sm:text-lg font-bold">Overall Health Score</h3>
          <TTSSpeaker
            text={`Your overall health score is ${Math.min(score, 100)} out of 100, based on exercise, mood, nutrition, and heart health data.`}
            size="sm"
            voice="tongtong"
          />
        </div>
        <p className="text-muted-foreground text-xs mt-0.5">
          Based on exercise, mood, nutrition &amp; heart health
        </p>
      </div>
    </div>
  );
}

// ── Weekly Streak Calendar component ────────────────────────────────────────

function StreakCalendar() {
  const statusColors: Record<DayStatus, string> = {
    completed: 'bg-emerald-500',
    partial: 'bg-amber-400',
    missed: 'bg-muted-foreground/25',
    today: 'bg-emerald-500',
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-8 gap-1 text-center">
        <div />
        {dayLabels.map((d, i) => (
          <span key={i} className="text-muted-foreground text-[10px] font-medium">
            {d}
          </span>
        ))}
      </div>
      {streakCalendar.map((week) => (
        <div key={week.week} className="grid grid-cols-8 gap-1">
          <span className="text-muted-foreground flex items-center justify-center text-[10px] font-medium">
            W{week.week}
          </span>
          {week.days.map((status, dayIdx) => (
            <motion.div
              key={`${week.week}-${dayIdx}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: (week.week * 7 + dayIdx) * 0.015, duration: 0.2 }}
              className={`aspect-square rounded-sm ${statusColors[status]} relative ${
                status === 'today' ? 'animate-pulse' : ''
              }`}
            >
              {status === 'today' && (
                <span className="absolute inset-0 rounded-sm ring-2 ring-emerald-400 ring-offset-1 ring-offset-background" />
              )}
            </motion.div>
          ))}
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
          Partial
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted-foreground/25" />
          Missed
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dashboard component
// ══════════════════════════════════════════════════════════════════════════════

// ── Daily Inspiration Card ────────────────────────────────────────────────────

const inspirationQuotes = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Recovery is not a race. You are brave for showing up every day.', author: 'AdaptiFit Community' },
  { text: 'Your limitation—it\'s only your imagination.', author: 'Unknown' },
  { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  { text: 'Every champion was once a contender that refused to give up.', author: 'Rocky Balboa' },
  { text: 'Strength does not come from physical capacity. It comes from an indomitable will.', author: 'Mahatma Gandhi' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
];

function DailyInspirationCard() {
  // Use day of year to pick a quote that changes daily
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const quote = inspirationQuotes[dayOfYear % inspirationQuotes.length];

  return (
    <motion.div variants={itemVariants}>
      <Card className="relative overflow-hidden rounded-2xl border-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 inspiration-bg opacity-90" />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/10" />
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 border border-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border border-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white/20 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/15 rounded-full" />

        <CardContent className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mt-1">
              <Quote className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-xs font-semibold uppercase tracking-wider mb-2">
                ✨ Daily Inspiration
              </p>
              <p className="text-white text-lg sm:text-xl font-medium leading-relaxed mb-3">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-white/70 text-sm">
                — {quote.author}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const [mounted, setMounted] = useState(false);
  const [checkedExercises, setCheckedExercises] = useState<Set<string>>(
    new Set(todaysExercises.filter((e) => e.completed).map((e) => e.id))
  );
  const [dailyQuote] = useState(
    motivationalQuotes[new Date().getDay() % motivationalQuotes.length]
  );

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard mounted pattern for hydration safety
  useEffect(() => { setMounted(true); }, []);

  const toggleExercise = useCallback((id: string) => {
    setCheckedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Health score calculation
  const exerciseAdherence = Math.round((totalMinutesThisWeek / totalTargetThisWeek) * 100);
  const moodPercent = moodScore * 10;
  const nutritionBalance = 72; // simulated
  const heartHealth = 85; // simulated
  const healthScore = Math.round(
    exerciseAdherence * 0.3 + moodPercent * 0.25 + nutritionBalance * 0.25 + heartHealth * 0.2
  );

  const completedGoals = todaysExercises.filter((e) => checkedExercises.has(e.id)).length;
  const totalGoals = todaysExercises.length;
  const goalsPercent = Math.round((completedGoals / totalGoals) * 100);

  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6 p-4 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Welcome Header ───────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back, <span className="text-emerald-500">Alex</span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4" />
              {mounted ? getFormattedDate() : '\u00A0'}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="mt-2 w-fit gap-1.5 sm:mt-0"
          >
            <span className="status-dot status-dot-online mr-1" />
            <Zap className="h-3.5 w-3.5" />
            AI Monitoring Active
          </Badge>
        </div>
      </motion.div>

      {/* ── Quick Action Buttons ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className={`gap-2 border ${action.bgColor} transition-all`}
              onClick={() => setActiveSection(action.section)}
            >
              <action.icon className={`h-4 w-4 ${action.color}`} />
              <span className={action.color}>{action.label}</span>
            </Button>
          ))}
          <ProgressExport />
        </div>
      </motion.div>

      {/* ── Daily Inspiration Card ─────────────────────────────────────────── */}
      <DailyInspirationCard />

      {/* ── Health Score + Streak Calendar ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl p-6 border-emerald-500/10 glass-card-depth">
            <HealthScoreGauge score={Math.min(healthScore, 100)} />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: 'Exercise', value: exerciseAdherence, color: 'text-emerald-500' },
                { label: 'Mood', value: moodPercent, color: 'text-rose-500' },
                { label: 'Nutrition', value: nutritionBalance, color: 'text-amber-500' },
                { label: 'Heart', value: heartHealth, color: 'text-cyan-500' },
              ].map((m) => (
                <div key={m.label}>
                  <p className={`text-sm font-bold ${m.color}`}>{m.value}%</p>
                  <p className="text-muted-foreground text-[10px]">{m.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-emerald-500" />
                4-Week Streak
              </CardTitle>
              <CardDescription>Exercise completion history</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <StreakCalendar />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-1">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-amber-500" />
                Next Goal
              </CardTitle>
              <CardDescription>Closest achievement to unlock</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-amber-500/10 p-4">
                <span className="text-3xl">❤️‍🔥</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Heart Champion</p>
                  <p className="text-muted-foreground text-xs">
                    Maintain resting HR below 70 for 30 days
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">22 / 30 days</span>
                      <span className="font-medium text-amber-600">73%</span>
                    </div>
                    <Progress value={73} className="mt-1 h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Quick Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Card className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.cardGradient} py-0 dash-stat-glass skeleton-shimmer`}>
              {/* Gradient accent bar */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                <CardDescription className="text-sm font-medium">
                  {card.title}
                </CardDescription>
                <div className={`rounded-lg p-2 ${card.bgGlow}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold tracking-tight">
                        {card.value}
                      </span>
                      <span className="text-muted-foreground mb-1 text-xs">
                        {card.subtitle}
                      </span>
                    </div>
                    {/* Comparison text */}
                    <div className="mt-1 flex items-center gap-1">
                      {card.comparison.direction === 'up' ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          card.comparison.direction === 'up'
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {card.comparison.direction === 'up' ? '↑' : '↓'}{' '}
                        {card.comparison.value}% from last week
                      </span>
                    </div>
                  </div>
                  {/* Sparkline + pulsing dot */}
                  <div className="flex flex-col items-end gap-1">
                    <MiniSparkline data={card.sparkline} color={card.sparkColor} />
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-muted-foreground text-[9px]">Live</span>
                    </span>
                  </div>
                </div>
                <Progress value={card.progress} className="mt-3 h-2" />
                <p className="text-muted-foreground mt-1 text-xs">
                  {card.progress}% of goal
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Today's Plan ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Today&apos;s Plan
              <TTSSpeaker
                text="Today's plan includes morning stretching, upper body workout, and evening meditation. Stay consistent!"
                size="sm"
                voice="tongtong"
              />
            </CardTitle>
            <CardDescription>Your scheduled exercises and reminders</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Exercises */}
              <div className="space-y-3 md:col-span-1">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Exercises
                </h4>
                <div className="space-y-2">
                  {todaysExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-2 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checkedExercises.has(exercise.id)}
                        onCheckedChange={() => toggleExercise(exercise.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium leading-tight ${
                          checkedExercises.has(exercise.id)
                            ? 'text-muted-foreground line-through'
                            : ''
                        }`}>
                          {exercise.name}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {exercise.time} · {exercise.duration}
                        </p>
                      </div>
                      {checkedExercises.has(exercise.id) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="text-muted-foreground/40 h-4 w-4 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminders */}
              <div className="space-y-3 md:col-span-1">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-amber-500" />
                  Reminders
                </h4>
                <div className="space-y-2">
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-2 rounded-lg border p-2.5"
                    >
                      <Bell className="text-amber-500 h-3.5 w-3.5 shrink-0" />
                      <span className="text-sm flex-1">{reminder.text}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {reminder.time}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Goals + Quote */}
              <div className="space-y-4 md:col-span-1">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <Target className="h-4 w-4 text-cyan-500" />
                    Daily Goals
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Exercises</span>
                        <span className="font-medium">{completedGoals}/{totalGoals}</span>
                      </div>
                      <Progress value={goalsPercent} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Calories</span>
                        <span className="font-medium">150/300 kcal</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Water Intake</span>
                        <span className="font-medium">5/8 glasses</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>
                  </div>
                </div>
                {/* Motivational Quote */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <Quote className="h-4 w-4 text-emerald-500/60 mb-1" />
                  <p className="text-muted-foreground text-xs italic leading-relaxed">
                    {dailyQuote}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Achievements (Horizontal Scroll) ──────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
            <CardDescription>Your milestones and badges</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {allAchievements.map((ach, idx) => {
                const isEarned = ach.date !== '';
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`relative min-w-[180px] shrink-0 rounded-xl border-2 p-4 transition-all ${
                      isEarned
                        ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/5 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'border-muted-foreground/10 bg-muted/30 opacity-60'
                    }`}
                  >
                    {/* Gradient glow border effect for earned */}
                    {isEarned && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/20 via-transparent to-amber-500/20 opacity-0 hover:opacity-100 transition-opacity" />
                    )}
                    <div className="relative text-center">
                      <span className="text-3xl">{ach.icon}</span>
                      <p className="mt-2 text-sm font-semibold">{ach.title}</p>
                      <p className="text-muted-foreground mt-1 text-[11px] leading-tight">
                        {ach.description}
                      </p>
                      {isEarned && (
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          {ach.date}
                        </Badge>
                      )}
                      {!isEarned && (
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Charts Section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart overflow wrapper for mobile */}
        {/* Weekly Exercise Chart */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl chart-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-emerald-500" />
                Weekly Exercise
              </CardTitle>
              <CardDescription>
                Daily exercise minutes vs target
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 overflow-x-auto">
              <ChartContainer
                config={weeklyExerciseConfig}
                className="h-[280px] w-full min-w-[300px]"
              >
                <BarChart
                  data={weeklyExerciseData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v: number) => `${v}m`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="minutes"
                    fill="var(--color-minutes)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="target"
                    fill="var(--color-target)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    opacity={0.5}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Over Time */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl chart-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
                Progress Over Time
              </CardTitle>
              <CardDescription>
                Strength, flexibility, endurance &amp; balance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 overflow-x-auto">
              <ChartContainer
                config={progressConfig}
                className="h-[280px] w-full min-w-[300px]"
              >
                <AreaChart
                  data={progressData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="strength"
                    stackId="1"
                    stroke="var(--color-strength)"
                    fill="var(--color-strength)"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="flexibility"
                    stackId="2"
                    stroke="var(--color-flexibility)"
                    fill="var(--color-flexibility)"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="endurance"
                    stackId="3"
                    stroke="var(--color-endurance)"
                    fill="var(--color-endurance)"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stackId="4"
                    stroke="var(--color-balance)"
                    fill="var(--color-balance)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calorie Tracking */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl chart-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-5 w-5 text-amber-500" />
                Calorie Tracking
              </CardTitle>
              <CardDescription>
                Daily intake vs burned vs target
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 overflow-x-auto">
              <ChartContainer
                config={calorieConfig}
                className="h-[280px] w-full min-w-[300px]"
              >
                <ComposedChart
                  data={calorieTrackingData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="intake"
                    fill="var(--color-intake)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="burned"
                    fill="var(--color-burned)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="var(--color-target)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Heart Rate Timeline */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-xl chart-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-5 w-5 text-rose-500" />
                Heart Rate Timeline
              </CardTitle>
              <CardDescription>
                BPM throughout the day with zone indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 overflow-x-auto">
              <ChartContainer
                config={heartRateConfig}
                className="h-[280px] w-full min-w-[300px]"
              >
                <LineChart
                  data={heartRateData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    domain={[50, 170]}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip content={<HeartRateTooltip />} />
                  {/* Zone reference lines */}
                  <ReferenceLine
                    y={60}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={false}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#06b6d4"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={false}
                  />
                  <ReferenceLine
                    y={130}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    stroke="var(--color-bpm)"
                    strokeWidth={2.5}
                    dot={({ cx, cy, payload }) => {
                      const color =
                        zoneColors[payload.zone] ?? '#f43f5e';
                      return (
                        <circle
                          key={`dot-${payload.time}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
              {/* Zone legend */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
                {Object.entries(zoneColors).map(([zone, color]) => (
                  <span key={zone} className="flex items-center gap-1">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {zone}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Bottom Section: Mood Trend ───────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-xl chart-card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-rose-500" />
              Mood Trend
            </CardTitle>
            <CardDescription>
              Mood distribution over recent weeks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-x-auto">
            <Tabs defaultValue="chart">
              <TabsList className="mb-4">
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <ChartContainer
                  config={moodConfig}
                  className="h-[250px] w-full min-w-[300px]"
                >
                  <BarChart
                    data={monthlyMoodData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="happy"
                      stackId="mood"
                      fill="var(--color-happy)"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="calm"
                      stackId="mood"
                      fill="var(--color-calm)"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="anxious"
                      stackId="mood"
                      fill="var(--color-anxious)"
                      radius={[0, 0, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="sad"
                      stackId="mood"
                      fill="var(--color-sad)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="details">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {monthlyMoodData.map((week) => (
                    <div
                      key={week.week}
                      className="rounded-lg border p-3 text-center"
                    >
                      <p className="text-sm font-semibold">{week.week}</p>
                      <div className="mt-2 flex h-6 overflow-hidden rounded-full">
                        <div
                          className="bg-emerald-500"
                          style={{
                            width: `${(week.happy / (week.happy + week.calm + week.anxious + week.sad)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-cyan-500"
                          style={{
                            width: `${(week.calm / (week.happy + week.calm + week.anxious + week.sad)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-amber-500"
                          style={{
                            width: `${(week.anxious / (week.happy + week.calm + week.anxious + week.sad)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-rose-500"
                          style={{
                            width: `${(week.sad / (week.happy + week.calm + week.anxious + week.sad)) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Happy {week.happy} · Calm {week.calm}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Anxious {week.anxious} · Sad {week.sad}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Weekly Goals ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <WeeklyGoals />
      </motion.div>

      {/* ── Health Insights ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <HealthInsights />
      </motion.div>

      {/* ── Sleep Quality Tracker ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <SleepTracker />
      </motion.div>

      {/* ── Hydration Tracker ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <HydrationTracker />
      </motion.div>

      {/* ── Rehabilitation Progress Timeline ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <RehabTimeline />
      </motion.div>

      {/* ── Pain & Symptom Journal ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PainJournal />
      </motion.div>

      {/* ── Daily Challenges ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <DailyChallenges />
      </motion.div>

      {/* ── Achievement Showcase ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <AchievementShowcase />
      </motion.div>
    </motion.div>
  );
}
