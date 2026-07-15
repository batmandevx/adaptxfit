'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Save,
  Plus,
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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// ── Types ────────────────────────────────────────────────────────────────────

interface SleepEntry {
  id: string;
  day: string;
  dayLabel: string;
  bedTime: string;
  wakeTime: string;
  durationHrs: number;
  quality: number;
  wakeFeeling: 'tired' | 'okay' | 'refreshed' | 'energized';
  interruptions: number;
  notes?: string;
  loggedAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const feelingEmojis: Record<string, { emoji: string; label: string; color: string }> = {
  tired: { emoji: '😴', label: 'Tired', color: 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
  okay: { emoji: '😐', label: 'Okay', color: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' },
  refreshed: { emoji: '😊', label: 'Refreshed', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
  energized: { emoji: '⚡', label: 'Energized', color: 'border-teal-400 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' },
};

const qualityLabels = ['Poor', 'Poor', 'Fair', 'Fair', 'Average', 'Average', 'Good', 'Good', 'Excellent', 'Excellent'];

function getDurationColor(hrs: number): string {
  if (hrs < 6) return 'bg-rose-500';
  if (hrs < 7) return 'bg-amber-500';
  if (hrs <= 9) return 'bg-emerald-500';
  return 'bg-teal-500';
}

function getDurationTextColor(hrs: number): string {
  if (hrs < 6) return 'text-rose-600 dark:text-rose-400';
  if (hrs < 7) return 'text-amber-600 dark:text-amber-400';
  if (hrs <= 9) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-teal-600 dark:text-teal-400';
}

function getQualityEmoji(q: number): string {
  if (q <= 3) return '😫';
  if (q <= 5) return '😐';
  if (q <= 7) return '😊';
  if (q <= 9) return '😄';
  return '🌟';
}

// ── Mock Data ────────────────────────────────────────────────────────────────

function generateMockData(): SleepEntry[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mockData = [
    { durationHrs: 7.5, quality: 8, wakeFeeling: 'refreshed' as const, interruptions: 0, bedTime: '22:30', wakeTime: '06:00' },
    { durationHrs: 6.2, quality: 5, wakeFeeling: 'okay' as const, interruptions: 2, bedTime: '23:45', wakeTime: '05:57' },
    { durationHrs: 8.1, quality: 9, wakeFeeling: 'energized' as const, interruptions: 0, bedTime: '21:50', wakeTime: '05:56' },
    { durationHrs: 5.8, quality: 4, wakeFeeling: 'tired' as const, interruptions: 3, bedTime: '00:30', wakeTime: '06:18' },
    { durationHrs: 7.0, quality: 7, wakeFeeling: 'okay' as const, interruptions: 1, bedTime: '22:00', wakeTime: '05:00' },
    { durationHrs: 8.5, quality: 8, wakeFeeling: 'refreshed' as const, interruptions: 0, bedTime: '22:00', wakeTime: '06:30' },
    { durationHrs: 7.2, quality: 7, wakeFeeling: 'okay' as const, interruptions: 1, bedTime: '22:30', wakeTime: '05:42' },
  ];

  const now = new Date();
  return mockData.map((d, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      id: `mock-${i}`,
      day: days[i],
      dayLabel: fullDays[i],
      ...d,
      notes: i === 3 ? 'Restless night, kept waking up' : undefined,
      loggedAt: date.toISOString(),
    };
  });
}

// ── Animation Variants ───────────────────────────────────────────────────────

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

const barVariants = {
  hidden: { scaleY: 0 },
  visible: (h: number) => ({
    scaleY: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: h * 0.05 },
  }),
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SleepTracker() {
  const [sleepData, setSleepData] = useState<SleepEntry[]>(generateMockData);
  const [showLogForm, setShowLogForm] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Form state
  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(7);
  const [wakeFeeling, setWakeFeeling] = useState<'tired' | 'okay' | 'refreshed' | 'energized'>('refreshed');
  const [interruptions, setInterruptions] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Computed Values ──────────────────────────────────────────────────────

  const lastNight = sleepData[sleepData.length - 1];

  const insights = useMemo(() => {
    const avgDuration = sleepData.reduce((s, d) => s + d.durationHrs, 0) / sleepData.length;
    const avgQuality = sleepData.reduce((s, d) => s + d.quality, 0) / sleepData.length;
    const best = sleepData.reduce((b, d) => (d.quality > b.quality ? d : b), sleepData[0]);
    const worst = sleepData.reduce((w, d) => (d.quality < w.quality ? d : w), sleepData[0]);

    // Trend: compare last 3 days avg vs first 4 days avg
    const recentAvg = sleepData.slice(-3).reduce((s, d) => s + d.quality, 0) / 3;
    const earlierAvg = sleepData.slice(0, 4).reduce((s, d) => s + d.quality, 0) / 4;
    const trend = recentAvg > earlierAvg + 0.5 ? 'improving' : recentAvg < earlierAvg - 0.5 ? 'declining' : 'stable';

    // Recommendation
    let recommendation = '';
    if (avgDuration < 7) {
      recommendation = 'Try going to bed 30 minutes earlier to reach the recommended 7-9 hours of sleep.';
    } else if (avgQuality < 6) {
      recommendation = 'Your sleep duration is good, but quality is low. Consider reducing screen time before bed and creating a relaxing bedtime routine.';
    } else if (interruptions > 1) {
      recommendation = 'Frequent interruptions detected. Try limiting caffeine after 2 PM and keeping your bedroom cool and dark.';
    } else {
      recommendation = 'Great sleep habits! Keep maintaining your consistent schedule for optimal recovery.';
    }

    return { avgDuration, avgQuality, best, worst, trend, recommendation };
  }, [sleepData]);

  const computedDuration = useMemo(() => {
    const [bh, bm] = bedTime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let bedMinutes = bh * 60 + bm;
    let wakeMinutes = wh * 60 + wm;
    if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
    return Math.round(((wakeMinutes - bedMinutes) / 60) * 10) / 10;
  }, [bedTime, wakeTime]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const newEntry: SleepEntry = {
      id: `entry-${Date.now()}`,
      day: new Date().toLocaleDateString('en', { weekday: 'short' }),
      dayLabel: new Date().toLocaleDateString('en', { weekday: 'long' }),
      bedTime,
      wakeTime,
      durationHrs: computedDuration,
      quality,
      wakeFeeling,
      interruptions,
      notes: notes || undefined,
      loggedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/sleep-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          bedTime: new Date().toISOString().split('T')[0] + 'T' + bedTime,
          wakeTime: new Date().toISOString().split('T')[0] + 'T' + wakeTime,
          durationHrs: computedDuration,
          quality,
          wakeFeeling,
          interruptions,
          notes,
        }),
      });

      if (res.ok) {
        setSleepData((prev) => {
          const next = [...prev.slice(1), newEntry];
          return next;
        });
        setShowLogForm(false);
        setNotes('');
        setInterruptions(0);
      }
    } catch {
      // Still update locally even if API fails
      setSleepData((prev) => [...prev.slice(1), newEntry]);
      setShowLogForm(false);
      setNotes('');
      setInterruptions(0);
    } finally {
      setIsSaving(false);
    }
  }, [bedTime, wakeTime, computedDuration, quality, wakeFeeling, interruptions, notes]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Card className="overflow-hidden border-emerald-200/50 dark:border-emerald-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* Night gradient accent at top */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />

        <CardHeader className="pb-3">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Moon className="w-5 h-5 text-white" />
                </div>
                {/* Decorative stars */}
                <Star className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 fill-amber-400 animate-pulse" />
                <Star className="w-2 h-2 text-teal-300 absolute -top-0.5 -left-1 fill-teal-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Sleep Quality Tracker
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Monitor your sleep for better recovery
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowLogForm(!showLogForm)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 mr-1" />
              Log Sleep
            </Button>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Last Night Summary ────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900/30 p-5 text-white relative overflow-hidden">
              {/* Decorative night sky elements */}
              <div className="absolute inset-0 opacity-20">
                <Star className="w-2 h-2 text-white absolute top-3 left-[15%] fill-white" />
                <Star className="w-3 h-3 text-amber-300 absolute top-6 right-[20%] fill-amber-300 animate-pulse" />
                <Star className="w-1.5 h-1.5 text-white absolute top-2 right-[45%] fill-white" style={{ animationDelay: '1s' }} />
                <Star className="w-2 h-2 text-teal-300 absolute bottom-4 left-[30%] fill-teal-300 animate-pulse" style={{ animationDelay: '0.7s' }} />
                <Star className="w-1.5 h-1.5 text-white absolute bottom-8 right-[35%] fill-white" style={{ animationDelay: '1.5s' }} />
              </div>

              <div className="relative z-10">
                <p className="text-emerald-300 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" />
                  Last Night
                </p>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <p className="text-2xl sm:text-4xl font-bold text-white">
                      {lastNight.durationHrs}
                      <span className="text-base sm:text-lg text-emerald-300 ml-0.5">h</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Total Sleep</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl sm:text-4xl font-bold text-white">
                      {lastNight.quality}
                      <span className="text-base sm:text-lg ml-1">{getQualityEmoji(lastNight.quality)}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Quality Score</p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-sm">
                      <span className="text-gray-400">↓</span>
                      <span className="text-white font-medium">{lastNight.bedTime}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-sm">
                      <span className="text-emerald-400">↑</span>
                      <span className="text-white font-medium">{lastNight.wakeTime}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">Bed / Wake</p>
                  </div>
                </div>

                {/* 7-day mini chart */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">7-Day Overview</p>
                  <div className="flex items-end justify-between gap-1 sm:gap-2 h-10">
                    {sleepData.map((entry, i) => (
                      <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          className="w-full rounded-sm relative group"
                          style={{
                            backgroundColor:
                              entry.durationHrs < 6 ? 'rgb(244 63 94 / 0.7)' :
                              entry.durationHrs < 7 ? 'rgb(245 158 11 / 0.7)' :
                              entry.durationHrs <= 9 ? 'rgb(16 185 129 / 0.7)' :
                              'rgb(20 184 166 / 0.7)',
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${(entry.durationHrs / 10) * 100}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                        />
                        <span className="text-[9px] text-gray-500">{entry.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Sleep Log Entry Form ──────────────────────────────────────── */}
          <AnimatePresence>
            {showLogForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 p-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Log Last Night&apos;s Sleep</h4>
                  </div>

                  {/* Bedtime & Wake Time */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="bedtime" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Bedtime
                      </Label>
                      <Input
                        id="bedtime"
                        type="time"
                        value={bedTime}
                        onChange={(e) => setBedTime(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800/50 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="waketime" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Wake Time
                      </Label>
                      <Input
                        id="waketime"
                        type="time"
                        value={wakeTime}
                        onChange={(e) => setWakeTime(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800/50 text-sm"
                      />
                    </div>
                  </div>

                  {/* Computed duration display */}
                  <div className="text-center">
                    <Badge
                      variant="secondary"
                      className={`${getDurationTextColor(computedDuration)} bg-white/60 dark:bg-gray-800/60 text-xs`}
                    >
                      {computedDuration}h sleep duration
                    </Badge>
                  </div>

                  {/* Quality Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Sleep Quality
                      </Label>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {quality}/10 {getQualityEmoji(quality)}
                      </span>
                    </div>
                    <Slider
                      value={[quality]}
                      onValueChange={(v) => setQuality(v[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  {/* Wake-up Feeling */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Wake-up Feeling
                    </Label>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {Object.entries(feelingEmojis).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => setWakeFeeling(key as typeof wakeFeeling)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all duration-200 ${
                            wakeFeeling === key
                              ? val.color + ' scale-105 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <span className="text-xl">{val.emoji}</span>
                          <span className="text-[10px] font-medium">{val.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interruptions */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Night Interruptions
                    </Label>
                    <div className="flex items-center gap-3">
                      {[0, 1, 2, 3].map((n) => (
                        <button
                          key={n}
                          onClick={() => setInterruptions(n)}
                          className={`w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                            interruptions === n
                              ? n >= 3
                                ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                                : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {n === 3 ? '3+' : n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Notes (optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any observations about your sleep..."
                      className="bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800/50 text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 7-Day Sleep History ───────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-emerald-500" />
              7-Day Sleep History
            </h4>
            <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4">
              {/* Bar chart */}
              <div className="flex items-end justify-between gap-1 sm:gap-3 h-40 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400">
                  <span>10h</span>
                  <span>8h</span>
                  <span>6h</span>
                  <span>4h</span>
                </div>
                <div className="ml-9 flex-1 flex items-end justify-between gap-1 sm:gap-2 h-full relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="border-t border-dashed border-gray-200 dark:border-gray-700/50" />
                    ))}
                  </div>

                  {sleepData.map((entry, i) => {
                    const heightPct = (entry.durationHrs / 10) * 100;
                    return (
                      <div
                        key={entry.id}
                        className="flex-1 flex flex-col items-center relative z-10"
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Tooltip */}
                        <AnimatePresence>
                          {hoveredBar === i && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute -top-20 left-1/2 -translate-x-1/2 z-20 bg-gray-900 dark:bg-gray-700 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
                            >
                              <p className="font-semibold">{entry.dayLabel}</p>
                              <p>{entry.durationHrs}h sleep · Quality: {entry.quality}/10</p>
                              <p className="text-gray-400">{entry.bedTime} → {entry.wakeTime}</p>
                              <p className="text-gray-400">
                                {feelingEmojis[entry.wakeFeeling].emoji} {feelingEmojis[entry.wakeFeeling].label}
                                {entry.interruptions > 0 ? ` · ${entry.interruptions} interruptions` : ''}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="w-full flex justify-center" style={{ height: 'calc(100% - 24px)' }}>
                          <motion.div
                            className="w-full max-w-[28px] sm:max-w-[40px] rounded-t-lg relative cursor-pointer transition-transform hover:scale-105"
                            style={{
                              height: `${heightPct}%`,
                              alignSelf: 'flex-end',
                              background: `linear-gradient(to top, ${
                                entry.durationHrs < 6 ? '#f43f5e, #fb7185' :
                                entry.durationHrs < 7 ? '#f59e0b, #fbbf24' :
                                entry.durationHrs <= 9 ? '#10b981, #34d399' :
                                '#14b8a6, #2dd4bf'
                              })`,
                            }}
                            custom={i}
                            variants={barVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            {/* Duration label on bar */}
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              {entry.durationHrs}h
                            </span>
                          </motion.div>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
                          {entry.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color legend */}
              <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span>&lt;6h</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span>6-7h</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>7-9h</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                  <span>&gt;9h</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Sleep Insights ───────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-teal-500" />
              Sleep Insights
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Average Duration */}
              <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {insights.avgDuration.toFixed(1)}h
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Avg Duration</p>
              </div>

              {/* Average Quality */}
              <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-teal-50/60 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10 p-3 text-center">
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {insights.avgQuality.toFixed(1)}
                  <span className="text-sm ml-0.5">{getQualityEmoji(Math.round(insights.avgQuality))}</span>
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Avg Quality</p>
              </div>

              {/* Best Night */}
              <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 p-3 text-center">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {insights.best.day}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Best Night ({insights.best.quality}/10)
                </p>
              </div>

              {/* Worst Night */}
              <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-rose-50/60 to-amber-50/30 dark:from-rose-950/20 dark:to-amber-950/10 p-3 text-center">
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {insights.worst.day}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Worst Night ({insights.worst.quality}/10)
                </p>
              </div>
            </div>

            {/* Trend & Recommendation */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Trend */}
              <div className={`rounded-xl border p-3 flex items-center gap-3 ${
                insights.trend === 'improving'
                  ? 'border-emerald-200/50 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : insights.trend === 'declining'
                  ? 'border-rose-200/50 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-amber-200/50 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  insights.trend === 'improving'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40'
                    : insights.trend === 'declining'
                    ? 'bg-rose-100 dark:bg-rose-900/40'
                    : 'bg-amber-100 dark:bg-amber-900/40'
                }`}>
                  {insights.trend === 'improving' ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : insights.trend === 'declining' ? (
                    <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold capitalize ${
                    insights.trend === 'improving'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : insights.trend === 'declining'
                      ? 'text-rose-700 dark:text-rose-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {insights.trend}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Sleep quality trend</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl border border-teal-200/50 dark:border-teal-800/40 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10 p-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {insights.recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
