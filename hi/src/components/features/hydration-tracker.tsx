'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Plus,
  Trash2,
  Info,
  GlassWater,
  TrendingUp,
  Clock,
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

// ── Types ────────────────────────────────────────────────────────────────────

interface HydrationEntry {
  id: string;
  amountMl: number;
  loggedAt: string;
}

interface WeeklyData {
  day: string;
  dayLabel: string;
  amount: number;
  isTarget: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DAILY_TARGET_ML = 2500;

const QUICK_ADD_AMOUNTS = [
  { ml: 150, label: '150ml', icon: '💧' },
  { ml: 250, label: '250ml', icon: '🥛' },
  { ml: 350, label: '350ml', icon: '🫗' },
  { ml: 500, label: '500ml', icon: '🧊' },
];

const HYDRATION_TIPS = [
  {
    title: 'Pre-Meal Hydration',
    text: 'Drink water before meals to aid digestion and help control appetite. A glass 30 minutes before eating can improve nutrient absorption.',
  },
  {
    title: 'Set Hourly Reminders',
    text: 'Set reminders every hour to take a few sips. Consistent small intakes are more effective than drinking large amounts at once.',
  },
  {
    title: 'Morning Hydration Boost',
    text: 'Start your day with a glass of water to kickstart your metabolism and rehydrate after sleep. Add lemon for extra vitamin C.',
  },
];

const MOCK_TODAY_ENTRIES: HydrationEntry[] = [
  { id: '1', amountMl: 500, loggedAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: '2', amountMl: 250, loggedAt: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: '3', amountMl: 750, loggedAt: new Date(Date.now() - 3600000 * 1).toISOString() },
];

const MOCK_WEEKLY_DATA: WeeklyData[] = (() => {
  const amounts = [2100, 2400, 1800, 2600, 2200, 1900, 1500];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return amounts.map((amt, i) => ({
    day: days[i],
    dayLabel: days[i],
    amount: amt,
    isTarget: amt >= DAILY_TARGET_ML,
  }));
})();

// ── Helper ───────────────────────────────────────────────────────────────────

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatLiters(ml: number): string {
  return `${(ml / 1000).toFixed(1)}L`;
}

// ── Water Drop SVG Component ─────────────────────────────────────────────────

function WaterDropVisual({
  percentage,
  currentMl,
  targetMl,
  isAnimating,
}: {
  percentage: number;
  currentMl: number;
  targetMl: number;
  isAnimating: boolean;
}) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  // The water drop SVG path is designed in a 200x260 viewBox
  // The fill level maps from bottom (y=260) to top
  // We'll use a clipPath approach with a moving rect

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 200 260"
        className="w-40 h-52 sm:w-48 sm:h-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waterFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="dropBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0fdfa" />
            <stop offset="100%" stopColor="#ccfbf1" />
          </linearGradient>
          <clipPath id="dropClip">
            <path d="M100 10 C100 10, 20 120, 20 170 C20 220, 55 250, 100 250 C145 250, 180 220, 180 170 C180 120, 100 10, 100 10 Z" />
          </clipPath>
          {/* Wave pattern */}
          <pattern
            id="wavePattern"
            x="0"
            y="0"
            width="200"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 10 Q25 0, 50 10 Q75 20, 100 10 Q125 0, 150 10 Q175 20, 200 10"
              fill="none"
              stroke="#5eead4"
              strokeWidth="2"
              opacity="0.5"
            />
          </pattern>
        </defs>

        {/* Drop outline background */}
        <path
          d="M100 10 C100 10, 20 120, 20 170 C20 220, 55 250, 100 250 C145 250, 180 220, 180 170 C180 120, 100 10, 100 10 Z"
          fill="url(#dropBg)"
          stroke="#99f6e4"
          strokeWidth="2"
          className="dark:fill-gray-800/50 dark:stroke-teal-800"
        />

        {/* Water fill with clip path */}
        <g clipPath="url(#dropClip)">
          <motion.rect
            x="0"
            width="200"
            fill="url(#waterFill)"
            opacity={0.85}
            initial={false}
            animate={{
              y: 250 - (250 * clampedPercentage) / 100,
              height: (250 * clampedPercentage) / 100,
            }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
          {/* Wave overlay on top of water */}
          <motion.rect
            x="0"
            width="200"
            height="20"
            fill="url(#wavePattern)"
            opacity={0.6}
            initial={false}
            animate={{
              y: 250 - (250 * clampedPercentage) / 100 - 8,
            }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;-50,0;0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </motion.rect>
        </g>

        {/* Drop border */}
        <path
          d="M100 10 C100 10, 20 120, 20 170 C20 220, 55 250, 100 250 C145 250, 180 220, 180 170 C180 120, 100 10, 100 10 Z"
          fill="none"
          stroke="#14b8a6"
          strokeWidth="3"
          className="dark:stroke-teal-500"
        />

        {/* Splash effect when animating */}
        <AnimatePresence>
          {isAnimating && (
            <>
              <motion.circle
                cx="100"
                cy="170"
                r="8"
                fill="#5eead4"
                initial={{ opacity: 0.8, scale: 0.5, cy: 160 }}
                animate={{ opacity: 0, scale: 2, cy: 120 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
              <motion.circle
                cx="80"
                cy="170"
                r="5"
                fill="#2dd4bf"
                initial={{ opacity: 0.7, scale: 0.5, cx: 85, cy: 165 }}
                animate={{ opacity: 0, scale: 1.5, cx: 60, cy: 130 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
              <motion.circle
                cx="120"
                cy="170"
                r="5"
                fill="#06b6d4"
                initial={{ opacity: 0.7, scale: 0.5, cx: 115, cy: 165 }}
                animate={{ opacity: 0, scale: 1.5, cx: 140, cy: 130 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Percentage text */}
        <text
          x="100"
          y="155"
          textAnchor="middle"
          className="fill-teal-900 dark:fill-teal-100"
          fontSize="36"
          fontWeight="bold"
        >
          {Math.round(clampedPercentage)}%
        </text>
        <text
          x="100"
          y="185"
          textAnchor="middle"
          className="fill-teal-700 dark:fill-teal-200"
          fontSize="14"
          fontWeight="500"
        >
          {formatLiters(currentMl)} / {formatLiters(targetMl)}
        </text>
      </svg>
    </div>
  );
}

// ── Weekly Chart Component ───────────────────────────────────────────────────

function WeeklyChart({ data }: { data: WeeklyData[] }) {
  const maxVal = Math.max(...data.map((d) => d.amount), DAILY_TARGET_ML);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          This Week
        </h4>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-400" />
            On target
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Below target
          </span>
        </div>
      </div>
      <div className="relative">
        {/* Target reference line */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-teal-300 dark:border-teal-600 z-10"
          style={{ bottom: `${(DAILY_TARGET_ML / maxVal) * 100}%` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] text-teal-500 dark:text-teal-400 font-medium">
            Target
          </span>
        </div>
        <div className="flex items-end gap-2 h-32 pt-4">
          {data.map((entry, idx) => (
            <motion.div
              key={entry.day}
              className="flex-1 flex flex-col items-center gap-1"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
            >
              <motion.div
                className="w-full rounded-t-md relative"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                style={{
                  height: `${(entry.amount / maxVal) * 100}%`,
                  transformOrigin: 'bottom',
                  minHeight: '4px',
                }}
              >
                <div
                  className={`w-full h-full rounded-t-md ${
                    entry.isTarget
                      ? 'bg-gradient-to-t from-teal-500 to-cyan-400'
                      : 'bg-gradient-to-t from-amber-500 to-amber-300'
                  }`}
                />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatLiters(entry.amount)}
                </span>
              </motion.div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                {entry.dayLabel}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hydration Tips Component ─────────────────────────────────────────────────

function HydrationTips() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HYDRATION_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const tip = HYDRATION_TIPS[tipIndex];

  return (
    <div className="relative overflow-hidden rounded-xl bg-teal-50/80 dark:bg-teal-950/30 p-4 border border-teal-200/60 dark:border-teal-800/40 min-h-[80px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
              {tip.title}
            </p>
            <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-1 leading-relaxed">
              {tip.text}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center gap-1.5 mt-3">
        {HYDRATION_TIPS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setTipIndex(idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === tipIndex
                ? 'bg-teal-500 w-4'
                : 'bg-teal-300 dark:bg-teal-700 hover:bg-teal-400'
            }`}
            aria-label={`Tip ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Ripple Effect Component ──────────────────────────────────────────────────

function RippleEffect({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/30"
            initial={{ width: 0, height: 0 }}
            animate={{ width: 300, height: 300 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20"
            initial={{ width: 0, height: 0 }}
            animate={{ width: 200, height: 200 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Hydration Tracker Component ─────────────────────────────────────────

export default function HydrationTracker() {
  const [currentMl, setCurrentMl] = useState(1500);
  const [todayEntries, setTodayEntries] = useState<HydrationEntry[]>(MOCK_TODAY_ENTRIES);
  const [weeklyData] = useState<WeeklyData[]>(MOCK_WEEKLY_DATA);
  const [isAnimating, setIsAnimating] = useState(false);
  const [splashButtonId, setSplashButtonId] = useState<string | null>(null);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const percentage = (currentMl / DAILY_TARGET_ML) * 100;

  const handleAddWater = useCallback((amountMl: number, label: string) => {
    setIsAnimating(true);
    setSplashButtonId(label);

    const newEntry: HydrationEntry = {
      id: Date.now().toString(),
      amountMl,
      loggedAt: new Date().toISOString(),
    };

    setCurrentMl((prev) => Math.min(prev + amountMl, 5000));
    setTodayEntries((prev) => [newEntry, ...prev]);

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setSplashButtonId(null);
    }, 800);
  }, []);

  const handleClearToday = useCallback(() => {
    setCurrentMl(0);
    setTodayEntries([]);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-teal-200/50 dark:border-teal-800/50 shadow-lg shadow-teal-500/5 overflow-hidden">
        <CardHeader className="pb-3">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                <Droplets className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-teal-800 dark:text-teal-200">
                  Hydration Tracker
                </CardTitle>
                <CardDescription className="text-xs text-teal-600/70 dark:text-teal-400/70">
                  Track your daily water intake
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs font-medium ${
                percentage >= 100
                  ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                  : 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
              }`}
            >
              {percentage >= 100 ? 'Goal Met! 🎉' : `${Math.round(percentage)}% of goal`}
            </Badge>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Water Drop Visual ────────────────────────────────────────── */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <WaterDropVisual
              percentage={percentage}
              currentMl={currentMl}
              targetMl={DAILY_TARGET_ML}
              isAnimating={isAnimating}
            />
          </motion.div>

          {/* ── Quick Add Buttons ────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
              Quick Add
            </p>
            <div className="grid grid-cols-4 gap-2 relative">
              {QUICK_ADD_AMOUNTS.map((item) => (
                <motion.div key={item.label} whileTap={{ scale: 0.93 }} className="relative">
                  <Button
                    onClick={() => handleAddWater(item.ml, item.label)}
                    className="w-full relative overflow-hidden bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50 hover:border-teal-300 dark:hover:border-teal-600 transition-all duration-200 h-auto py-2.5 flex-col gap-0.5"
                    variant="outline"
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <span className="text-[11px] font-semibold">+{item.ml}ml</span>
                  </Button>
                  <RippleEffect active={splashButtonId === item.label} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Today's Log ─────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                Today&apos;s Log
              </h4>
              {todayEntries.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearToday}
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {todayEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                <GlassWater className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No drinks logged today. Start adding water!</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {todayEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                          <Droplets className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                            {entry.amountMl}ml
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
                            {formatTime(entry.loggedAt)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-teal-100/80 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-0"
                      >
                        {formatLiters(entry.amountMl)}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* ── Weekly Hydration Chart ──────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <WeeklyChart data={weeklyData} />
          </motion.div>

          {/* ── Hydration Tips ──────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <HydrationTips />
          </motion.div>

          {/* ── Footer Stats ────────────────────────────────────────────── */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between pt-2 border-t border-teal-100 dark:border-teal-900/30"
          >
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
              <span>
                Avg:{' '}
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  {formatLiters(
                    Math.round(weeklyData.reduce((a, b) => a + b.amount, 0) / weeklyData.length)
                  )}
                </span>{' '}
                / day
              </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {todayEntries.length} drink{todayEntries.length !== 1 ? 's' : ''} today
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
