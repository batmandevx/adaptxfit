'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Droplets, Brain, Dumbbell,
  CheckCircle2, Zap, Sparkles, RotateCcw,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// ── Challenge types ────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: typeof Dumbbell;
  target: number;
  xpReward: number;
  category: 'exercise' | 'mood' | 'hydration' | 'mindfulness';
  color: string;
  accentColor: string;
  bgColor: string;
}

// ── All possible challenges pool ───────────────────────────────────────────────

const challengePool: Challenge[] = [
  {
    id: 'stretches', title: 'Complete 3 Stretches', description: 'Hold each stretch for 30 seconds',
    icon: Dumbbell, target: 3, xpReward: 50, category: 'exercise',
    color: 'text-emerald-600', accentColor: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'mood-log', title: 'Log Your Mood', description: 'Track how you feel at least once today',
    icon: Brain, target: 1, xpReward: 30, category: 'mood',
    color: 'text-rose-600', accentColor: 'bg-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    id: 'water', title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day',
    icon: Droplets, target: 8, xpReward: 40, category: 'hydration',
    color: 'text-cyan-600', accentColor: 'bg-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  {
    id: 'seated-press', title: 'Seated Shoulder Press', description: 'Complete 3 sets of 10 reps',
    icon: Dumbbell, target: 3, xpReward: 60, category: 'exercise',
    color: 'text-emerald-600', accentColor: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'breathing', title: '5-Minute Breathing', description: 'Practice deep breathing for 5 minutes',
    icon: Brain, target: 1, xpReward: 35, category: 'mindfulness',
    color: 'text-teal-600', accentColor: 'bg-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    id: 'gratitude', title: 'Write 3 Gratitudes', description: 'Note three things you are grateful for',
    icon: Star, target: 3, xpReward: 45, category: 'mood',
    color: 'text-amber-600', accentColor: 'bg-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'resistance', title: 'Resistance Band Workout', description: 'Complete 15 minutes of band exercises',
    icon: Dumbbell, target: 1, xpReward: 55, category: 'exercise',
    color: 'text-emerald-600', accentColor: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'water-mini', title: 'Drink 5 Glasses of Water', description: 'A smaller hydration goal',
    icon: Droplets, target: 5, xpReward: 25, category: 'hydration',
    color: 'text-cyan-600', accentColor: 'bg-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  {
    id: 'meditation', title: '10-Minute Meditation', description: 'Sit quietly and focus on your breath',
    icon: Brain, target: 1, xpReward: 50, category: 'mindfulness',
    color: 'text-teal-600', accentColor: 'bg-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
];

// ── Seeded random number generator ─────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function getDailyChallenges(): Challenge[] {
  const seed = getDaySeed();
  const random = seededRandom(seed);
  const shuffled = [...challengePool].sort(() => random() - 0.5);
  return shuffled.slice(0, 3);
}

// ── Confetti particle component ────────────────────────────────────────────────

function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#14b8a6', '#fbbf24'];
  const color = colors[index % colors.length];
  const startX = 30 + Math.random() * 40;
  const endX = startX + (Math.random() - 0.5) * 60;
  const rotation = Math.random() * 720;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm pointer-events-none"
      style={{ backgroundColor: color, left: `${startX}%`, top: '50%' }}
      initial={{ scale: 0, opacity: 1, y: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.5, 0],
        opacity: [1, 1, 0],
        y: [0, -80 - Math.random() * 60],
        x: [(Math.random() - 0.5) * 40, (endX - startX) * 2],
        rotate: [0, rotation],
      }}
      transition={{ duration: 1.2 + Math.random() * 0.5, ease: 'easeOut' }}
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

// ── XP notification ────────────────────────────────────────────────────────────

function XPPopup({ xp, show }: { xp: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute -top-2 right-2 z-30 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 shadow-lg"
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Zap className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-bold text-white">+{xp} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main DailyChallenges component ─────────────────────────────────────────────

export default function DailyChallenges() {
  const challenges = useMemo(() => getDailyChallenges(), []);
  const storageKey = useMemo(() => `adaptifit-daily-${getDaySeed()}`, []);

  // Load progress from localStorage using lazy initializer
  const loadSavedState = useCallback(() => {
    if (typeof window === 'undefined') return { progress: {}, totalXP: 0, completed: [] as string[] };
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        return {
          progress: data.progress || {},
          totalXP: data.totalXP || 0,
          completed: data.completed || [],
        };
      }
    } catch {
      // ignore parse errors
    }
    return { progress: {}, totalXP: 0, completed: [] as string[] };
  }, [storageKey]);

  const [progress, setProgress] = useState<Record<string, number>>(() => loadSavedState().progress);
  const [totalXP, setTotalXP] = useState(() => loadSavedState().totalXP);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(
    () => new Set(loadSavedState().completed)
  );
  const [confettiChallenge, setConfettiChallenge] = useState<string | null>(null);
  const [xpPopup, setXpPopup] = useState<{ id: string; xp: number } | null>(null);

  // Save progress when it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          progress,
          totalXP,
          completed: Array.from(completedChallenges),
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [progress, totalXP, completedChallenges, storageKey]);

  const incrementProgress = useCallback((challengeId: string, challenge: Challenge) => {
    if (completedChallenges.has(challengeId)) return;

    setProgress((prev) => {
      const current = prev[challengeId] || 0;
      const next = Math.min(current + 1, challenge.target);

      if (next >= challenge.target) {
        // Challenge completed!
        setCompletedChallenges((prevSet) => new Set(prevSet).add(challengeId));
        setTotalXP((prevXP) => prevXP + challenge.xpReward);

        // Trigger confetti
        setConfettiChallenge(challengeId);
        setTimeout(() => setConfettiChallenge(null), 1500);

        // Trigger XP popup
        setXpPopup({ id: challengeId, xp: challenge.xpReward });
        setTimeout(() => setXpPopup(null), 2000);
      }

      return { ...prev, [challengeId]: next };
    });
  }, [completedChallenges]);

  const resetProgress = useCallback(() => {
    setProgress({});
    setTotalXP(0);
    setCompletedChallenges(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const allCompleted = challenges.every((c) => completedChallenges.has(c.id));
  const completedCount = challenges.filter((c) => completedChallenges.has(c.id)).length;

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-amber-500" />
            Daily Challenges
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
            >
              <Zap className="h-3 w-3" />
              {totalXP} XP
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={resetProgress}
              aria-label="Reset daily challenges"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {allCompleted
            ? 'All challenges completed! Amazing work!'
            : `${completedCount} of ${challenges.length} challenges completed today`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {challenges.map((challenge, idx) => {
            const currentProgress = progress[challenge.id] || 0;
            const isComplete = completedChallenges.has(challenge.id);
            const progressPercent = Math.round((currentProgress / challenge.target) * 100);

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className="relative"
              >
                <ConfettiBurst show={confettiChallenge === challenge.id} />
                <XPPopup
                  xp={xpPopup?.id === challenge.id ? xpPopup.xp : 0}
                  show={xpPopup?.id === challenge.id}
                />

                <motion.div
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                    isComplete
                      ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-emerald-500/5 to-amber-500/5'
                      : 'border-muted-foreground/10 hover:border-emerald-500/20'
                  }`}
                  whileHover={!isComplete ? { scale: 1.01 } : {}}
                  whileTap={!isComplete ? { scale: 0.99 } : {}}
                >
                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${challenge.bgColor}`}>
                    {isComplete ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-amber-500" />
                      </motion.div>
                    ) : (
                      <challenge.icon className={`h-5 w-5 ${challenge.color}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold leading-tight ${
                        isComplete ? 'text-amber-700 dark:text-amber-400 line-through' : ''
                      }`}>
                        {challenge.title}
                      </p>
                      <span className={`text-xs font-medium shrink-0 ml-2 ${
                        isComplete ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>
                        {currentProgress}/{challenge.target}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      {challenge.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1">
                        <Progress
                          value={progressPercent}
                          className={`h-2 ${isComplete ? '[&>div]:bg-amber-500' : ''}`}
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-medium text-amber-600">
                          {challenge.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  {!isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-8 gap-1 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                      onClick={() => incrementProgress(challenge.id, challenge)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {currentProgress > 0 ? 'More' : 'Start'}
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* All completed celebration */}
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/20 p-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  All daily challenges complete! +{totalXP} XP earned
                </p>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Small Plus icon component
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
