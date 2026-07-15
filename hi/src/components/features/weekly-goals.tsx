'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Target,
  Plus,
  RotateCcw,
  Dumbbell,
  Brain,
  Utensils,
  Wind,
  Footprints,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Types ────────────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  category: 'exercise' | 'mood' | 'nutrition' | 'breathing' | 'activity';
  title: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  activeDays: number[]; // 0=Mon ... 6=Sun, indices where activity logged
}

// ── Category config ──────────────────────────────────────────────────────────

const categoryConfig = {
  exercise: {
    icon: Dumbbell,
    label: 'Exercise',
    color: 'text-emerald-600',
    stroke: '#10b981',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-500/20',
  },
  mood: {
    icon: Brain,
    label: 'Mood',
    color: 'text-rose-600',
    stroke: '#f43f5e',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    borderColor: 'border-rose-500/20',
  },
  nutrition: {
    icon: Utensils,
    label: 'Nutrition',
    color: 'text-amber-600',
    stroke: '#f59e0b',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-500/20',
  },
  breathing: {
    icon: Wind,
    label: 'Breathing',
    color: 'text-teal-600',
    stroke: '#14b8a6',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    borderColor: 'border-teal-500/20',
  },
  activity: {
    icon: Footprints,
    label: 'Activity',
    color: 'text-cyan-600',
    stroke: '#06b6d4',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-500/20',
  },
} as const;

type CategoryKey = keyof typeof categoryConfig;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekInfo(): { weekNumber: number; startDate: Date; endDate: Date; startStr: string; endStr: string } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);

  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + mondayOffset);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    weekNumber,
    startDate,
    endDate,
    startStr: fmt(startDate),
    endStr: fmt(endDate),
  };
}

function getProgressColor(percent: number): string {
  if (percent > 66) return '#10b981'; // emerald
  if (percent > 33) return '#f59e0b'; // amber
  return '#f43f5e'; // rose
}

function getProgressColorClass(percent: number): { text: string; bg: string } {
  if (percent > 66) return { text: 'text-emerald-600', bg: 'bg-emerald-500' };
  if (percent > 33) return { text: 'text-amber-600', bg: 'bg-amber-500' };
  return { text: 'text-rose-600', bg: 'bg-rose-500' };
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Circular progress ring ───────────────────────────────────────────────────

function CircularProgress({
  percent,
  size = 56,
  strokeWidth = 5,
  strokeColor,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const color = strokeColor || getProgressColor(percent);

  const gradientId = `grad-${percent}-${size}`;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color === '#10b981' ? '#14b8a6' : color === '#f59e0b' ? '#fbbf24' : '#fb7185'} />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted-foreground/15"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

// ── Confetti burst ───────────────────────────────────────────────────────────

function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#14b8a6', '#fbbf24'];
  const color = colors[index % colors.length];
  const startX = 30 + Math.random() * 40;
  const rotation = Math.random() * 720;

  return (
    <motion.div
      className="absolute w-2.5 h-2.5 rounded-sm pointer-events-none"
      style={{ backgroundColor: color, left: `${startX}%`, top: '50%' }}
      initial={{ scale: 0, opacity: 0.95, y: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.8, 0],
        opacity: [0.95, 0.9, 0],
        y: [0, -90 - Math.random() * 60],
        x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 90],
        rotate: [0, rotation],
      }}
      transition={{ duration: 1.3 + Math.random() * 0.5, ease: 'easeOut' }}
    />
  );
}

function ConfettiBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

// ── Sample data ──────────────────────────────────────────────────────────────

function createSampleGoals(): Goal[] {
  return [
    {
      id: 'goal-1',
      category: 'exercise',
      title: 'Exercise 150 min this week',
      targetValue: 150,
      currentValue: 95,
      completed: false,
      activeDays: [0, 2, 4], // Mon, Wed, Fri
    },
    {
      id: 'goal-2',
      category: 'mood',
      title: 'Log mood 5 times this week',
      targetValue: 5,
      currentValue: 2,
      completed: false,
      activeDays: [0, 1], // Mon, Tue
    },
    {
      id: 'goal-3',
      category: 'nutrition',
      title: 'Log 14 meals this week',
      targetValue: 14,
      currentValue: 11,
      completed: false,
      activeDays: [0, 1, 2, 3, 4, 5], // Mon-Sat
    },
    {
      id: 'goal-4',
      category: 'breathing',
      title: 'Complete 3 breathing sessions',
      targetValue: 3,
      currentValue: 3,
      completed: true,
      activeDays: [0, 2, 5], // Mon, Wed, Sat
    },
  ];
}

// ── Main component ───────────────────────────────────────────────────────────

export default function WeeklyGoals() {
  const [goals, setGoals] = useState<Goal[]>(createSampleGoals);
  const [confettiGoalId, setConfettiGoalId] = useState<string | null>(null);
  const [bumpGoalId, setBumpGoalId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoalCategory, setNewGoalCategory] = useState<CategoryKey>('exercise');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const weekInfo = useMemo(() => getWeekInfo(), []);

  // Compute streak: count consecutive weeks with at least one completed goal
  // (simplified: just count current completed goals as "streak points")
  const streak = useMemo(() => {
    const completedThisWeek = goals.filter(g => g.completed).length;
    return completedThisWeek > 0 ? completedThisWeek + 2 : 0; // +2 for mock previous weeks
  }, [goals]);

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalPercent = goals.reduce((sum, g) => sum + Math.min((g.currentValue / g.targetValue) * 100, 100), 0);
    return Math.round(totalPercent / goals.length);
  }, [goals]);

  // Get all active days across goals
  const allActiveDays = useMemo(() => {
    const daySet = new Set<number>();
    goals.forEach(g => g.activeDays.forEach(d => daySet.add(d)));
    return daySet;
  }, [goals]);

  // Current day of week (0=Mon ... 6=Sun)
  const todayDayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to index 6
  }, []);

  const handleIncrement = useCallback((goalId: string) => {
    setGoals(prev =>
      prev.map(goal => {
        if (goal.id !== goalId || goal.completed) return goal;

        const newValue = goal.currentValue + 1;
        const isCompleted = newValue >= goal.targetValue;

        if (isCompleted) {
          setConfettiGoalId(goalId);
          setTimeout(() => setConfettiGoalId(null), 1500);
        }

        // Haptic-like bump animation
        setBumpGoalId(goalId);
        setTimeout(() => setBumpGoalId(null), 300);

        // Add today to active days if not already there
        const activeDays = goal.activeDays.includes(todayDayIndex)
          ? goal.activeDays
          : [...goal.activeDays, todayDayIndex];

        return {
          ...goal,
          currentValue: newValue,
          completed: isCompleted,
          activeDays,
        };
      })
    );
  }, [todayDayIndex]);

  const handleAddGoal = useCallback(() => {
    if (!newGoalTitle.trim() || !newGoalTarget) return;

    const target = parseInt(newGoalTarget, 10);
    if (isNaN(target) || target <= 0) return;

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      category: newGoalCategory,
      title: newGoalTitle.trim(),
      targetValue: target,
      currentValue: 0,
      completed: false,
      activeDays: [],
    };

    setGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setDialogOpen(false);
  }, [newGoalTitle, newGoalTarget, newGoalCategory]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  const handleResetWeek = useCallback(() => {
    setGoals(prev =>
      prev.map(g => ({
        ...g,
        currentValue: 0,
        completed: false,
        activeDays: [],
      }))
    );
  }, []);

  const completedCount = goals.filter(g => g.completed).length;

  return (
    <Card className="rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-5 w-5 text-amber-500" />
            Weekly Progress
            {streak > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 ml-1"
              >
                <Flame className="h-3 w-3" />
                {streak} streak
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 micro-bounce"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]">
                <DialogHeader className="pb-1">
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-500" />
                    Add Weekly Goal
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Set a new goal to track this week
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-3">
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Category</label>
                    <Select value={newGoalCategory} onValueChange={(v) => setNewGoalCategory(v as CategoryKey)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(categoryConfig) as CategoryKey[]).map(key => {
                          const cfg = categoryConfig[key];
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                                {cfg.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Goal Title</label>
                    <Input
                      placeholder="e.g., Exercise 150 min this week"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Target Value</label>
                    <Input
                      type="number"
                      placeholder="e.g., 150"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      min={1}
                      className="h-10"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline" className="mr-2">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddGoal}
                    disabled={!newGoalTitle.trim() || !newGoalTarget}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={handleResetWeek}
              aria-label="Reset weekly goals"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span>Week {weekInfo.weekNumber}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{weekInfo.startStr} – {weekInfo.endStr}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{completedCount}/{goals.length} completed</span>
        </CardDescription>

        {/* Day indicators */}
        <div className="flex items-center justify-between mt-3 px-1 flex-wrap gap-y-2">
          {DAY_LABELS.map((label, idx) => {
            const isActive = allActiveDays.has(idx);
            const isToday = idx === todayDayIndex;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-medium ${isToday ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                <motion.div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                      : 'bg-muted-foreground/15'
                  } ${isToday ? 'ring-2 ring-emerald-500/40 ring-offset-1 ring-offset-background' : ''}`}
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.35 }}
                />
              </div>
            );
          })}
        </div>

        {/* Overall progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full bg-muted-foreground/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full progress-bar-animated"
              style={{
                background: `linear-gradient(90deg, ${getProgressColor(overallProgress)}, ${overallProgress > 66 ? '#14b8a6' : overallProgress > 33 ? '#fbbf24' : '#fb7185'}, ${getProgressColor(overallProgress)})`,
                backgroundSize: '200% 100%',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className={`text-xs font-semibold ${getProgressColorClass(overallProgress).text}`}>
            {overallProgress}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {goals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No goals yet this week</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click &quot;Add&quot; to set your first weekly goal</p>
            </div>
          )}

          {goals.map((goal) => {
            const config = categoryConfig[goal.category];
            const percent = Math.round((goal.currentValue / goal.targetValue) * 100);
            const colorClass = getProgressColorClass(percent);

            return (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="relative"
              >
                <ConfettiBurst show={confettiGoalId === goal.id} />

                <motion.div
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    goal.completed
                      ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5'
                      : `border-muted-foreground/10 hover:${config.borderColor}`
                  }`}
                  whileHover={!goal.completed ? { scale: 1.01 } : {}}
                  animate={bumpGoalId === goal.id ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {/* Circular progress */}
                  <div className={`relative shrink-0 flex items-center justify-center ${goal.completed ? 'goal-ring-glow pulse-ring' : ''}`}>
                    <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] flex items-center justify-center">
                      <CircularProgress percent={percent} size={60} strokeWidth={5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[11px] sm:text-xs font-bold ${colorClass.text}`}>
                          {percent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${config.bgColor}`}>
                        {goal.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                        )}
                      </div>
                      <p className={`text-sm font-semibold leading-tight truncate ${
                        goal.completed ? 'text-emerald-700 dark:text-emerald-400 line-through' : ''
                      }`}>
                        {goal.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${colorClass.text}`}>
                        {goal.currentValue}/{goal.targetValue}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 ${
                          goal.category === 'exercise' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                          goal.category === 'mood' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                          goal.category === 'nutrition' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                          goal.category === 'breathing' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' :
                          'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400'
                        }`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!goal.completed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                        onClick={() => handleIncrement(goal.id)}
                        aria-label={`Increment ${goal.title}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-rose-500"
                      onClick={() => handleDeleteGoal(goal.id)}
                      aria-label={`Delete ${goal.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}

          {/* All completed celebration */}
          <AnimatePresence>
            {goals.length > 0 && goals.every(g => g.completed) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 p-3">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    All weekly goals complete! Amazing work!
                  </p>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  );
}
