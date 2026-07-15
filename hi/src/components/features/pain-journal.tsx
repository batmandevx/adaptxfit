'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Heart,
  MapPin,
  Zap,
  Waves,
  Flame,
  CircleDot,
  Drum,
  Scissors,
  BedDouble,
  PersonStanding,
  Dumbbell,
  Bike,
  StickyNote,
  CheckCircle2,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────

interface PainLogEntry {
  id: string;
  userId: string;
  painLevel: number;
  painType: string;
  bodyRegion: string;
  symptoms: string;
  trigger: string | null;
  reliefMeasures: string | null;
  mood: string | null;
  activityLevel: string | null;
  notes: string | null;
  loggedAt: string;
  createdAt: string;
}

interface PainSummary {
  avgPainLevel: number;
  mostCommonRegion: string;
  mostCommonType: string;
  trendDirection: 'improving' | 'worsening' | 'stable';
  avg7Day: number;
  mostAffectedRegion7: string;
  mostCommonType7: string;
  trend7: 'improving' | 'worsening' | 'stable';
  painFreeDays: number;
}

interface DailyAverage {
  date: string;
  avgPain: number;
  count: number;
}

interface RegionData {
  count: number;
  avgPain: number;
  total: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PAIN_TYPES = [
  { value: 'sharp', label: 'Sharp', emoji: '⚡', color: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' },
  { value: 'dull', label: 'Dull', emoji: '🌊', color: 'border-teal-400 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' },
  { value: 'burning', label: 'Burning', emoji: '🔥', color: 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
  { value: 'aching', label: 'Aching', emoji: '💫', color: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300' },
  { value: 'throbbing', label: 'Throbbing', emoji: '📳', color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300' },
  { value: 'stabbing', label: 'Stabbing', emoji: '🔪', color: 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' },
] as const;

const BODY_REGIONS = [
  { value: 'head', label: 'Head', emoji: '🧠' },
  { value: 'neck', label: 'Neck', emoji: '🦒' },
  { value: 'shoulder', label: 'Shoulder', emoji: '💪' },
  { value: 'back', label: 'Back', emoji: '🔙' },
  { value: 'hip', label: 'Hip', emoji: '🦴' },
  { value: 'knee', label: 'Knee', emoji: '🦿' },
  { value: 'ankle', label: 'Ankle', emoji: '🦶' },
  { value: 'arm', label: 'Arm', emoji: '💪' },
  { value: 'hand', label: 'Hand', emoji: '✋' },
  { value: 'foot', label: 'Foot', emoji: '🦶' },
  { value: 'chest', label: 'Chest', emoji: '🫁' },
  { value: 'abdomen', label: 'Abdomen', emoji: '🔴' },
] as const;

const ACTIVITY_LEVELS = [
  { value: 'resting', label: 'Resting', icon: BedDouble, color: 'border-slate-400 bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300' },
  { value: 'light', label: 'Light', icon: PersonStanding, color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
  { value: 'moderate', label: 'Moderate', icon: Dumbbell, color: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' },
  { value: 'intense', label: 'Intense', icon: Bike, color: 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
] as const;

const MOOD_OPTIONS = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'frustrated', emoji: '😤', label: 'Frustrated' },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPainColor(level: number): string {
  if (level <= 3) return 'emerald';
  if (level <= 6) return 'amber';
  if (level <= 9) return 'rose';
  return 'red';
}

function getPainBgClass(level: number): string {
  if (level <= 3) return 'bg-emerald-500';
  if (level <= 6) return 'bg-amber-500';
  if (level <= 9) return 'bg-rose-500';
  return 'bg-red-600';
}

function getPainTextClass(level: number): string {
  if (level <= 3) return 'text-emerald-600 dark:text-emerald-400';
  if (level <= 6) return 'text-amber-600 dark:text-amber-400';
  if (level <= 9) return 'text-rose-600 dark:text-rose-400';
  return 'text-red-600 dark:text-red-400';
}

function getPainLabel(level: number): string {
  if (level <= 3) return 'Mild';
  if (level <= 6) return 'Moderate';
  if (level <= 9) return 'Severe';
  return 'Critical';
}

function getPainBadgeClass(level: number): string {
  if (level <= 3) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (level <= 6) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (level <= 9) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse';
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getRegionLabel(value: string): string {
  return BODY_REGIONS.find(r => r.value === value)?.label || value;
}

function getRegionEmoji(value: string): string {
  return BODY_REGIONS.find(r => r.value === value)?.emoji || '📍';
}

function getPainTypeLabel(value: string): string {
  return PAIN_TYPES.find(t => t.value === value)?.label || value;
}

function getPainTypeEmoji(value: string): string {
  return PAIN_TYPES.find(t => t.value === value)?.emoji || '⚡';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PainJournal() {
  // Form state
  const [painLevel, setPainLevel] = useState(1);
  const [painType, setPainType] = useState('');
  const [bodyRegion, setBodyRegion] = useState('');
  const [trigger, setTrigger] = useState('');
  const [reliefMeasures, setReliefMeasures] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');

  // Data state
  const [logs, setLogs] = useState<PainLogEntry[]>([]);
  const [summary, setSummary] = useState<PainSummary | null>(null);
  const [dailyAverages, setDailyAverages] = useState<DailyAverage[]>([]);
  const [regionData, setRegionData] = useState<Record<string, RegionData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Fetch pain logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pain-logs?userId=default-user&days=30');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        setSummary(json.summary || null);
        setDailyAverages(json.dailyAverages || []);
        setRegionData(json.regionData || {});
      }
    } catch (err) {
      console.error('Failed to fetch pain logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Save new entry
  const handleSave = async () => {
    if (!painType || !bodyRegion) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pain-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default-user',
          painLevel,
          painType,
          bodyRegion,
          symptoms: '',
          trigger: trigger || null,
          reliefMeasures: reliefMeasures || null,
          mood: mood || null,
          activityLevel: activityLevel || null,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        // Reset form
        setPainLevel(1);
        setPainType('');
        setBodyRegion('');
        setTrigger('');
        setReliefMeasures('');
        setActivityLevel('');
        setMood('');
        setNotes('');
        fetchLogs();
      }
    } catch (err) {
      console.error('Failed to save pain log:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pain-logs?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (err) {
      console.error('Failed to delete pain log:', err);
    }
  };

  // Chart data: last 7 days
  const chartData = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return dailyAverages
      .filter(d => new Date(d.date) >= sevenDaysAgo)
      .map(d => ({
        ...d,
        day: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      }));
  }, [dailyAverages]);

  // Heatmap data
  const heatmapEntries = useMemo(() => {
    return BODY_REGIONS.map(r => ({
      ...r,
      count: regionData[r.value]?.count || 0,
      avgPain: regionData[r.value]?.avgPain || 0,
    })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);
  }, [regionData]);

  const isFormValid = painType && bodyRegion;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ── Section Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-rose-100 p-2 dark:bg-rose-900/40">
          <Activity className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pain & Symptom Journal</h2>
          <p className="text-sm text-muted-foreground">Track your pain levels and share reports with your healthcare provider</p>
        </div>
      </div>

      {/* ── Summary Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Avg Pain (7d)</p>
            {summary?.trend7 === 'improving' && <TrendingDown className="h-4 w-4 text-emerald-500" />}
            {summary?.trend7 === 'worsening' && <TrendingUp className="h-4 w-4 text-rose-500" />}
            {summary?.trend7 === 'stable' && <Minus className="h-4 w-4 text-amber-500" />}
          </div>
          <p className={`mt-1 text-2xl font-bold ${getPainTextClass(summary?.avg7Day || 0)}`}>
            {summary?.avg7Day || 0}
          </p>
          <p className="text-xs text-muted-foreground">{summary?.trend7 === 'improving' ? 'Improving' : summary?.trend7 === 'worsening' ? 'Worsening' : 'Stable'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80"
        >
          <p className="text-xs font-medium text-muted-foreground">Most Affected</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {getRegionEmoji(summary?.mostAffectedRegion7 || '')} {getRegionLabel(summary?.mostAffectedRegion7 || 'N/A')}
          </p>
          <p className="text-xs text-muted-foreground">Region (7 days)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80"
        >
          <p className="text-xs font-medium text-muted-foreground">Common Type</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {getPainTypeEmoji(summary?.mostCommonType7 || '')} {getPainTypeLabel(summary?.mostCommonType7 || 'N/A')}
          </p>
          <p className="text-xs text-muted-foreground">Pain type (7 days)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80"
        >
          <p className="text-xs font-medium text-muted-foreground">Pain-Free Days</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary?.painFreeDays ?? 0}</p>
          <p className="text-xs text-muted-foreground">Out of last 7 days</p>
        </motion.div>
      </div>

      {/* ── Pain Entry Form ─────────────────────────────────────────────── */}
      <Card className="border-white/30 bg-white/80 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-rose-500" />
            Log New Entry
          </CardTitle>
          <CardDescription>Record your current pain level and symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pain Level Circular Selector */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-sm font-medium">Pain Level</Label>
            <div className="relative flex items-center justify-center">
              <motion.div
                key={painLevel}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`flex h-28 w-28 items-center justify-center rounded-full border-4 ${painLevel <= 3 ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : painLevel <= 6 ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' : painLevel <= 9 ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'}`}
              >
                <div className="text-center">
                  <span className={`text-4xl font-bold ${getPainTextClass(painLevel)}`}>
                    {painLevel}
                  </span>
                  <p className={`text-xs font-medium ${getPainTextClass(painLevel)}`}>
                    {getPainLabel(painLevel)}
                  </p>
                </div>
              </motion.div>
              {painLevel === 10 && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full border-4 border-red-400 opacity-40"
                />
              )}
            </div>
            {/* Level buttons */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPainLevel(level)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    painLevel === level
                      ? `${getPainBgClass(level)} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pain Type Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pain Type *</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PAIN_TYPES.map(type => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPainType(type.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 transition-all ${
                    painType === type.value
                      ? type.color
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className="text-xs font-medium">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Body Region Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Body Region *</Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {BODY_REGIONS.map(region => (
                <motion.button
                  key={region.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setBodyRegion(region.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                    bodyRegion === region.value
                      ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">{region.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight">{region.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Activity Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Activity Level</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ACTIVITY_LEVELS.map(act => {
                const Icon = act.icon;
                return (
                  <motion.button
                    key={act.value}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActivityLevel(act.value)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition-all ${
                      activityLevel === act.value
                        ? act.color
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{act.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Mood Impact */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mood Impact</Label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(m => (
                <motion.button
                  key={m.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMood(mood === m.value ? '' : m.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 transition-all ${
                    mood === m.value
                      ? 'border-teal-400 bg-teal-50 dark:bg-teal-950/30'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Trigger and Relief */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Trigger</Label>
              <Input
                placeholder="What triggered the pain?"
                value={trigger}
                onChange={e => setTrigger(e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Relief Measures</Label>
              <Input
                placeholder="What helped relieve it?"
                value={reliefMeasures}
                onChange={e => setReliefMeasures(e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </Label>
            <Textarea
              placeholder="Additional notes about your pain..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="bg-white/50 dark:bg-gray-800/50 resize-none"
            />
          </div>

          {/* Save Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || saving}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              size="lg"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Saved Successfully!
                </>
              ) : saving ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Activity className="h-5 w-5" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Entry
                </>
              )}
            </Button>
          </motion.div>

          {!isFormValid && (
            <p className="text-center text-xs text-muted-foreground">
              Please select a pain type and body region to save
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pain Trends Chart */}
        <Card className="border-white/30 bg-white/80 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              7-Day Pain Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(128,128,128,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                    }}
                  />
                  <ReferenceLine y={7} stroke="rgba(244,63,94,0.5)" strokeDasharray="6 3" label={{ value: 'Severe', fontSize: 10, fill: '#f43f5e' }} />
                  <Line
                    type="monotone"
                    dataKey="avgPain"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <Activity className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p>No data yet. Start logging to see trends.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Body Region Heatmap */}
        <Card className="border-white/30 bg-white/80 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-teal-500" />
              Pain by Body Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapEntries.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {heatmapEntries.map(region => {
                  const intensity = Math.min(region.avgPain / 10, 1);
                  const bgOpacity = 0.15 + intensity * 0.6;
                  return (
                    <motion.div
                      key={region.value}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center gap-1 rounded-xl border p-2.5"
                      style={{
                        borderColor: `rgba(${region.avgPain <= 3 ? '16,185,129' : region.avgPain <= 6 ? '245,158,11' : '244,63,94'}, ${bgOpacity + 0.3})`,
                        backgroundColor: `rgba(${region.avgPain <= 3 ? '16,185,129' : region.avgPain <= 6 ? '245,158,11' : '244,63,94'}, ${bgOpacity})`,
                      }}
                    >
                      <span className="text-lg">{region.emoji}</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{region.label}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {region.count}x · Avg {region.avgPain}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p>No region data yet.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Entries List ─────────────────────────────────────────── */}
      <Card className="border-white/30 bg-white/80 backdrop-blur-lg dark:border-gray-700/30 dark:bg-gray-900/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-gray-500" />
            Recent Entries
            {logs.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{logs.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Activity className="h-6 w-6 text-muted-foreground" />
              </motion.div>
            </div>
          ) : logs.length > 0 ? (
            <ScrollArea className="max-h-80">
              <div className="space-y-2 pr-3">
                {logs.slice(0, 15).map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-gray-100 bg-white/60 p-3 dark:border-gray-800 dark:bg-gray-800/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPainBadgeClass(entry.painLevel)} font-bold`}>
                          {entry.painLevel}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getPainTypeEmoji(entry.painType)} {getPainTypeLabel(entry.painType)} · {getRegionEmoji(entry.bodyRegion)} {getRegionLabel(entry.bodyRegion)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(entry.loggedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                          {expandedEntry === entry.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-md p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Notes preview */}
                    {entry.notes && expandedEntry !== entry.id && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground pl-12">
                        {entry.notes}
                      </p>
                    )}

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedEntry === entry.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2 dark:border-gray-700 pl-12">
                            {entry.trigger && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Trigger:</span> {entry.trigger}
                              </p>
                            )}
                            {entry.reliefMeasures && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Relief:</span> {entry.reliefMeasures}
                              </p>
                            )}
                            {entry.activityLevel && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Activity:</span> {entry.activityLevel}
                              </p>
                            )}
                            {entry.mood && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Mood:</span> {MOOD_OPTIONS.find(m => m.value === entry.mood)?.emoji} {entry.mood}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Notes:</span> {entry.notes}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>No pain entries yet. Start tracking above.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
