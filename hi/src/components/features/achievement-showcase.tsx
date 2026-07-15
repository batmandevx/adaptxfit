'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Star,
  Target,
  Heart,
  Shield,
  Users,
  Zap,
  Award,
  Lock,
  Crown,
  Timer,
  TrendingUp,
  Medal,
  Dumbbell,
  Brain,
  Apple,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// ── Types ──────────────────────────────────────────────────────────────────

type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: Rarity;
  unlocked: boolean;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  avatar: string;
  isCurrentUser: boolean;
}

// ── Data ───────────────────────────────────────────────────────────────────

const USER_LEVEL = 12;
const CURRENT_XP = 2450;
const NEXT_LEVEL_XP = 3000;
const CURRENT_STREAK = 7;
const LONGEST_STREAK = 14;

const WEEKLY_STREAK = [true, true, true, true, true, true, false]; // Mon-Sun
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STREAK_FREEZE = true;

const achievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first exercise',
    icon: <Dumbbell className="h-5 w-5" />,
    rarity: 'Common',
    unlocked: true,
  },
  {
    id: '2',
    name: 'Week Warrior',
    description: '7 day exercise streak',
    icon: <Trophy className="h-5 w-5" />,
    rarity: 'Rare',
    unlocked: true,
  },
  {
    id: '3',
    name: 'Mindful Master',
    description: 'Log mood for 30 days',
    icon: <Brain className="h-5 w-5" />,
    rarity: 'Epic',
    unlocked: false,
  },
  {
    id: '4',
    name: 'Nutrition Ninja',
    description: 'Scan 50 meals',
    icon: <Apple className="h-5 w-5" />,
    rarity: 'Rare',
    unlocked: true,
  },
  {
    id: '5',
    name: 'Heart Guardian',
    description: '100 heart rate checks',
    icon: <Heart className="h-5 w-5" />,
    rarity: 'Common',
    unlocked: true,
  },
  {
    id: '6',
    name: 'Paralympic Spirit',
    description: 'Complete adaptive workout',
    icon: <Medal className="h-5 w-5" />,
    rarity: 'Epic',
    unlocked: false,
  },
  {
    id: '7',
    name: 'Century Club',
    description: '100 exercises completed',
    icon: <Star className="h-5 w-5" />,
    rarity: 'Rare',
    unlocked: false,
  },
  {
    id: '8',
    name: 'Form Perfect',
    description: '98%+ form accuracy 10 times',
    icon: <Target className="h-5 w-5" />,
    rarity: 'Epic',
    unlocked: false,
  },
  {
    id: '9',
    name: 'Safety First',
    description: 'No injuries for 90 days',
    icon: <Shield className="h-5 w-5" />,
    rarity: 'Common',
    unlocked: true,
  },
  {
    id: '10',
    name: 'Community Star',
    description: 'Help 20 community members',
    icon: <Users className="h-5 w-5" />,
    rarity: 'Rare',
    unlocked: false,
  },
  {
    id: '11',
    name: 'Unstoppable',
    description: '30 day streak',
    icon: <Flame className="h-5 w-5" />,
    rarity: 'Legendary',
    unlocked: false,
  },
  {
    id: '12',
    name: 'All-Rounder',
    description: 'Exercise + Mood + Nutrition in one day',
    icon: <Zap className="h-5 w-5" />,
    rarity: 'Common',
    unlocked: true,
  },
];

const leaderboard: LeaderboardUser[] = [
  { rank: 1, name: 'Sarah M.', xp: 12850, avatar: 'SM', isCurrentUser: false },
  { rank: 2, name: 'Alex K.', xp: 10200, avatar: 'AK', isCurrentUser: false },
  { rank: 3, name: 'You', xp: 8450, avatar: 'YO', isCurrentUser: true },
];

// ── Rarity styles ──────────────────────────────────────────────────────────

const rarityStyles: Record<Rarity, { border: string; glow: string; gradient: string; label: string }> = {
  Common: {
    border: 'border-gray-300 dark:border-gray-600',
    glow: '',
    gradient: 'from-gray-400 to-gray-500',
    label: 'text-gray-500',
  },
  Rare: {
    border: 'border-cyan-400 dark:border-cyan-500',
    glow: '0 0 12px rgba(6,182,212,0.4)',
    gradient: 'from-cyan-400 to-teal-500',
    label: 'text-cyan-600 dark:text-cyan-400',
  },
  Epic: {
    border: 'border-violet-400 dark:border-violet-500',
    glow: '0 0 16px rgba(139,92,246,0.5)',
    gradient: 'from-violet-400 to-purple-600',
    label: 'text-violet-600 dark:text-violet-400',
  },
  Legendary: {
    border: 'border-amber-400 dark:border-amber-500',
    glow: '0 0 20px rgba(245,158,11,0.6)',
    gradient: 'from-amber-400 to-orange-500',
    label: 'text-amber-600 dark:text-amber-400',
  },
};

// ── Animation variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
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

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};

// ── Level Ring Component ───────────────────────────────────────────────────

function LevelRing({ level, currentXp, nextLevelXp }: { level: number; currentXp: number; nextLevelXp: number }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = 54;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = currentXp / nextLevelXp;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const strokeDashoffset = circumference - animatedProgress * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-emerald-100 dark:text-emerald-900/40"
        />
        {/* Progress ring */}
        <motion.circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={normalizedRadius}
          fill="none"
          stroke="url(#levelGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Lvl</span>
        <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">{level}</span>
      </div>
    </div>
  );
}

// ── Achievement Badge Component ────────────────────────────────────────────

function AchievementBadge({ achievement, index }: { achievement: Achievement; index: number }) {
  const style = rarityStyles[achievement.rarity];
  const isLocked = !achievement.unlocked;

  return (
    <motion.div
      variants={badgeVariants}
      whileHover={{ scale: 1.1, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${style.border} ${isLocked ? 'opacity-40 grayscale' : ''}`}
        style={!isLocked && style.glow ? { boxShadow: style.glow } : undefined}
      >
        {/* Gradient background */}
        <div
          className={`absolute inset-1 rounded-full bg-gradient-to-br ${isLocked ? 'from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800' : style.gradient} opacity-20`}
        />

        {/* Icon */}
        <div className={`relative z-10 ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-white'}`}>
          {isLocked ? <Lock className="h-6 w-6" /> : achievement.icon}
        </div>

        {/* Shimmer overlay for unlocked */}
        {!isLocked && (
          <motion.div
            className="absolute inset-1 rounded-full"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
            }}
            animate={{ x: [-40, 40] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />
        )}

        {/* Colored icon wrapper for unlocked */}
        {!isLocked && (
          <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${style.gradient} opacity-80`} />
        )}
        {!isLocked && (
          <div className="relative z-10 text-white drop-shadow-sm">
            {achievement.icon}
          </div>
        )}
      </div>

      {/* Name */}
      <p className={`text-center text-xs font-medium leading-tight ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-foreground'}`}>
        {achievement.name}
      </p>

      {/* Rarity label */}
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLocked ? 'text-gray-300 dark:text-gray-600' : style.label}`}>
        {achievement.rarity}
      </span>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AchievementShowcase() {
  const [xpAnimated, setXpAnimated] = useState(0);
  const xpRemaining = NEXT_LEVEL_XP - CURRENT_XP;

  useEffect(() => {
    const timer = setTimeout(() => setXpAnimated(CURRENT_XP), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Level & XP Section ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              {/* Level Ring */}
              <LevelRing level={USER_LEVEL} currentXp={CURRENT_XP} nextLevelXp={NEXT_LEVEL_XP} />

              {/* XP Progress */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Experience Points</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep going! You&apos;re getting stronger every day.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {xpAnimated.toLocaleString()} XP
                    </span>
                    <span className="text-muted-foreground">{NEXT_LEVEL_XP.toLocaleString()} XP</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${(CURRENT_XP / NEXT_LEVEL_XP) * 100}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <TrendingUp className="h-3 w-3" />
                    Next Level
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {xpRemaining.toLocaleString()} XP to Level {USER_LEVEL + 1}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Streak Section ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Streak stats */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-500 shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Flame className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{CURRENT_STREAK}</span>
                    <span className="text-lg font-semibold text-foreground">Day Streak</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Personal Best: <span className="font-semibold text-amber-600 dark:text-amber-400">{LONGEST_STREAK} Days</span>
                  </p>
                </div>
              </div>

              {/* Weekly calendar */}
              <div className="flex items-center gap-2">
                {WEEKLY_STREAK.map((active, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        active
                          ? 'bg-gradient-to-br from-rose-400 to-orange-500 text-white shadow-md shadow-rose-300/40 dark:shadow-rose-700/40'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                      }`}
                    >
                      {active ? '✓' : WEEKDAY_LABELS[i]}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{WEEKDAY_LABELS[i]}</span>
                  </div>
                ))}
              </div>

              {/* Streak freeze */}
              {STREAK_FREEZE && (
                <div className="flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 dark:bg-cyan-900/20">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-400">Streak Freeze Active</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Achievement Badges Grid ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Achievements</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {achievements.filter((a) => a.unlocked).length} / {achievements.length} Unlocked
              </Badge>
            </div>
            <CardDescription>Collect badges by reaching milestones on your fitness journey</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6"
            >
              {achievements.map((achievement, index) => (
                <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Weekly Challenge ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/40 dark:to-amber-950/40">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-bold text-foreground">Weekly Challenge</h3>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Active
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Complete 5 adaptive exercises this week
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">3 / 5 completed</span>
                    <span className="text-muted-foreground">60%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-2 dark:bg-gray-800/60">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">500 XP</span>
                  <span className="text-xs text-muted-foreground">+</span>
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Rare Badge</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>4 days left</span>
                </div>
                <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700">
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Leaderboard Preview ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Leaderboard</CardTitle>
            </div>
            <CardDescription>Top performers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((user, index) => {
                const rankColors = [
                  'from-amber-400 to-amber-500',
                  'from-gray-300 to-gray-400',
                  'from-orange-400 to-orange-500',
                ];
                const rankBgs = [
                  'bg-amber-50 dark:bg-amber-900/20',
                  'bg-gray-50 dark:bg-gray-800/50',
                  'bg-orange-50 dark:bg-orange-900/20',
                ];

                return (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                    className={`flex items-center gap-4 rounded-xl p-3 transition-colors ${
                      user.isCurrentUser
                        ? 'border border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : rankBgs[index] ?? 'bg-gray-50 dark:bg-gray-800/30'
                    }`}
                  >
                    {/* Rank badge */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${
                        rankColors[index] ?? 'from-gray-300 to-gray-400'
                      } text-sm font-bold text-white shadow-sm`}
                    >
                      {user.rank}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                        user.isCurrentUser
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {user.avatar}
                    </div>

                    {/* Name and XP */}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          user.isCurrentUser
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-foreground'
                        }`}
                      >
                        {user.name}
                        {user.isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-emerald-500">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</p>
                    </div>

                    {/* Medal for top 3 */}
                    {index === 0 && <Crown className="h-5 w-5 text-amber-500" />}
                    {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                    {index === 2 && <Medal className="h-5 w-5 text-orange-500" />}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                View Full Leaderboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
