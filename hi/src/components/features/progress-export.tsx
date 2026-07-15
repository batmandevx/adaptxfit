'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Copy, Share2, Check, Printer,
  Calendar, TrendingUp, Dumbbell, Brain, Apple, Heart,
  Award, BarChart3, Users, ArrowUpRight, ArrowDownRight,
  ChevronRight, Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SectionConfig {
  key: string;
  label: string;
  icon: typeof Dumbbell;
  color: string;
  bgColor: string;
}

const sectionOptions: SectionConfig[] = [
  { key: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { key: 'mood', label: 'Mood', icon: Brain, color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/40' },
  { key: 'nutrition', label: 'Nutrition', icon: Apple, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
  { key: 'heart', label: 'Heart Health', icon: Heart, color: 'text-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-900/40' },
  { key: 'achievements', label: 'Achievements', icon: Award, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/40' },
];

// ── Sample data ────────────────────────────────────────────────────────────────

const reportData = {
  dateRange: 'Feb 4, 2026 – Mar 6, 2026',
  generatedAt: 'Mar 6, 2026 at 10:35 AM',
  user: {
    name: 'Alex Johnson',
    type: 'Adaptive Athlete',
    condition: 'Spinal Cord Injury (T12)',
  },
  exercise: {
    thisWeek: { weeklySessions: 4.2, avgFormAccuracy: 92, totalReps: 847, mostPerformed: 'Seated Shoulder Press', trend: 'improving' as const },
    lastWeek: { weeklySessions: 3.8, avgFormAccuracy: 88, totalReps: 712, mostPerformed: 'Seated Shoulder Press', trend: 'stable' as const },
  },
  mood: {
    thisWeek: { avgScore: 7.4, riskLevel: 'Low', trend: 'improving' as const, topEmotion: 'Calm' },
    lastWeek: { avgScore: 6.8, riskLevel: 'Low', trend: 'stable' as const, topEmotion: 'Neutral' },
  },
  nutrition: {
    thisWeek: { avgDailyCalories: 1935, macroBalance: 'Protein 35% · Carbs 40% · Fat 20% · Fiber 5%', mealsLogged: 14 },
    lastWeek: { avgDailyCalories: 1870, macroBalance: 'Protein 30% · Carbs 45% · Fat 20% · Fiber 5%', mealsLogged: 11 },
  },
  heart: {
    thisWeek: { avgRestingHR: 72, hrZones: 'Resting 45% · Light 25% · Moderate 20% · Vigorous 10%', spo2Avg: 97.8 },
    lastWeek: { avgRestingHR: 75, hrZones: 'Resting 40% · Light 30% · Moderate 20% · Vigorous 10%', spo2Avg: 97.2 },
  },
  achievements: [
    { title: '7-Day Streak', icon: '🔥', date: 'Mar 6, 2026' },
    { title: 'Form Master', icon: '✨', date: 'Mar 5, 2026' },
    { title: 'Mood Warrior', icon: '🧠', date: 'Mar 3, 2026' },
    { title: 'Nutrition Pro', icon: '🥗', date: 'Feb 27, 2026' },
    { title: 'Heart Hero', icon: '❤️', date: 'Feb 22, 2026' },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function trendArrow(trend: 'improving' | 'stable' | 'declining') {
  if (trend === 'improving') return '↑ improving';
  if (trend === 'stable') return '→ stable';
  return '↓ declining';
}

function trendColor(trend: 'improving' | 'stable' | 'declining') {
  if (trend === 'improving') return 'text-emerald-600';
  if (trend === 'stable') return 'text-amber-600';
  return 'text-rose-600';
}

function ChangeIndicator({ value, unit = '' }: { value: number; unit?: string }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isNeutral ? 'text-amber-600' : isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {isNeutral ? '→' : isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isNeutral ? '0' : `${isPositive ? '+' : ''}${value}${unit}`}
    </span>
  );
}

// ── Comparison Card component ──────────────────────────────────────────────────

function ComparisonCard({ section }: { section: string }) {
  const d = reportData;

  if (section === 'exercise') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
            <p className="text-lg font-bold font-mono">{d.exercise.thisWeek.weeklySessions}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
            <ChangeIndicator value={+(d.exercise.thisWeek.weeklySessions - d.exercise.lastWeek.weeklySessions).toFixed(1)} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Week</p>
            <p className="text-lg font-bold font-mono text-muted-foreground">{d.exercise.lastWeek.weeklySessions}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Form Accuracy</p>
            <p className="font-semibold font-mono">{d.exercise.thisWeek.avgFormAccuracy}%</p>
            <ChangeIndicator value={d.exercise.thisWeek.avgFormAccuracy - d.exercise.lastWeek.avgFormAccuracy} unit="%" />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Reps</p>
            <p className="font-semibold font-mono">{d.exercise.thisWeek.totalReps}</p>
            <ChangeIndicator value={d.exercise.thisWeek.totalReps - d.exercise.lastWeek.totalReps} />
          </div>
        </div>
      </div>
    );
  }

  if (section === 'mood') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
            <p className="text-lg font-bold font-mono">{d.mood.thisWeek.avgScore}/10</p>
            <p className="text-xs text-muted-foreground">{d.mood.thisWeek.topEmotion}</p>
            <ChangeIndicator value={+(d.mood.thisWeek.avgScore - d.mood.lastWeek.avgScore).toFixed(1)} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Week</p>
            <p className="text-lg font-bold font-mono text-muted-foreground">{d.mood.lastWeek.avgScore}/10</p>
            <p className="text-xs text-muted-foreground">{d.mood.lastWeek.topEmotion}</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'nutrition') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
            <p className="text-lg font-bold font-mono">{d.nutrition.thisWeek.avgDailyCalories}</p>
            <p className="text-xs text-muted-foreground">kcal/day</p>
            <ChangeIndicator value={d.nutrition.thisWeek.avgDailyCalories - d.nutrition.lastWeek.avgDailyCalories} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Week</p>
            <p className="text-lg font-bold font-mono text-muted-foreground">{d.nutrition.lastWeek.avgDailyCalories}</p>
            <p className="text-xs text-muted-foreground">kcal/day</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Meals Logged</p>
            <p className="font-semibold font-mono">{d.nutrition.thisWeek.mealsLogged}</p>
            <ChangeIndicator value={d.nutrition.thisWeek.mealsLogged - d.nutrition.lastWeek.mealsLogged} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Macro Balance</p>
            <p className="text-xs font-mono">{d.nutrition.thisWeek.macroBalance}</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'heart') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
            <p className="text-lg font-bold font-mono">{d.heart.thisWeek.avgRestingHR}</p>
            <p className="text-xs text-muted-foreground">bpm resting</p>
            <ChangeIndicator value={d.heart.thisWeek.avgRestingHR - d.heart.lastWeek.avgRestingHR} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Week</p>
            <p className="text-lg font-bold font-mono text-muted-foreground">{d.heart.lastWeek.avgRestingHR}</p>
            <p className="text-xs text-muted-foreground">bpm resting</p>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">SpO2 Average</p>
          <div className="flex items-center gap-2">
            <p className="font-semibold font-mono">{d.heart.thisWeek.spo2Avg}%</p>
            <ChangeIndicator value={+(d.heart.thisWeek.spo2Avg - d.heart.lastWeek.spo2Avg).toFixed(1)} unit="%" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Generate plain-text report ─────────────────────────────────────────────────

function generateTextReport(coachNotes: string, selectedSections: string[]): string {
  const d = reportData;
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('           ADAPTIFIT PROGRESS REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Report Period : ${d.dateRange}`);
  lines.push(`Generated     : ${d.generatedAt}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push('  USER PROFILE');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`  Name       : ${d.user.name}`);
  lines.push(`  User Type  : ${d.user.type}`);
  lines.push(`  Condition  : ${d.user.condition}`);
  lines.push('');

  if (selectedSections.includes('exercise')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  EXERCISE SUMMARY (This Week vs Last Week)');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Weekly Sessions    : ${d.exercise.thisWeek.weeklySessions} (was ${d.exercise.lastWeek.weeklySessions})`);
    lines.push(`  Avg Form Accuracy  : ${d.exercise.thisWeek.avgFormAccuracy}% (was ${d.exercise.lastWeek.avgFormAccuracy}%)`);
    lines.push(`  Total Reps         : ${d.exercise.thisWeek.totalReps} (was ${d.exercise.lastWeek.totalReps})`);
    lines.push(`  Most Performed     : ${d.exercise.thisWeek.mostPerformed}`);
    lines.push(`  Trend              : ${trendArrow(d.exercise.thisWeek.trend)}`);
    lines.push('');
  }

  if (selectedSections.includes('mood')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  MOOD SUMMARY (This Week vs Last Week)');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Average Mood Score : ${d.mood.thisWeek.avgScore}/10 (was ${d.mood.lastWeek.avgScore}/10)`);
    lines.push(`  Risk Assessment    : ${d.mood.thisWeek.riskLevel}`);
    lines.push(`  Mood Trend         : ${trendArrow(d.mood.thisWeek.trend)}`);
    lines.push(`  Top Emotion        : ${d.mood.thisWeek.topEmotion} (was ${d.mood.lastWeek.topEmotion})`);
    lines.push('');
  }

  if (selectedSections.includes('nutrition')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  NUTRITION SUMMARY (This Week vs Last Week)');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Avg Daily Calories : ${d.nutrition.thisWeek.avgDailyCalories} kcal (was ${d.nutrition.lastWeek.avgDailyCalories})`);
    lines.push(`  Macro Balance      : ${d.nutrition.thisWeek.macroBalance}`);
    lines.push(`  Meals Logged       : ${d.nutrition.thisWeek.mealsLogged} (was ${d.nutrition.lastWeek.mealsLogged})`);
    lines.push('');
  }

  if (selectedSections.includes('heart')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  HEART HEALTH (This Week vs Last Week)');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push(`  Avg Resting HR     : ${d.heart.thisWeek.avgRestingHR} bpm (was ${d.heart.lastWeek.avgRestingHR})`);
    lines.push(`  HR Zones           : ${d.heart.thisWeek.hrZones}`);
    lines.push(`  SpO2 Average       : ${d.heart.thisWeek.spo2Avg}% (was ${d.heart.lastWeek.spo2Avg}%)`);
    lines.push('');
  }

  if (selectedSections.includes('achievements')) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  ACHIEVEMENTS UNLOCKED');
    lines.push('───────────────────────────────────────────────────────────');
    d.achievements.forEach((a) => {
      lines.push(`  ${a.icon} ${a.title.padEnd(20)} — ${a.date}`);
    });
    lines.push('');
  }

  if (coachNotes.trim()) {
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('  COACH / THERAPIST NOTES');
    lines.push('───────────────────────────────────────────────────────────');
    coachNotes.split('\n').forEach((l) => lines.push(`  ${l}`));
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  Report generated by AdaptiFit — AI-Powered Adaptive Fitness');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProgressExport() {
  const [copied, setCopied] = useState(false);
  const [coachNotes, setCoachNotes] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(
    sectionOptions.map((s) => s.key)
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareWithCoach, setShareWithCoach] = useState(false);
  const [coachSummary, setCoachSummary] = useState<string | null>(null);

  const toggleSection = useCallback((key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }, []);

  const handleCopy = async () => {
    const text = generateTextReport(coachNotes, selectedSections);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = generateTextReport(coachNotes, selectedSections);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdaptiFit-Progress-Report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareWithCoach = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sections: selectedSections,
          includeComparison: true,
          includeCoachSummary: true,
          coachNotes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCoachSummary(data.report);
        setShareWithCoach(true);
      }
    } catch {
      // fallback — generate locally
      const text = generateTextReport(coachNotes, selectedSections);
      setCoachSummary(text);
      setShareWithCoach(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCoachSummary = async () => {
    if (!coachSummary) return;
    try {
      await navigator.clipboard.writeText(coachSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const d = reportData;
  const hasComparisonSections = selectedSections.some((s) =>
    ['exercise', 'mood', 'nutrition', 'heart'].includes(s)
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border bg-emerald-500/10 transition-all hover:bg-emerald-500/20 border-emerald-500/20"
        >
          <Share2 className="h-4 w-4 text-emerald-600" />
          <span className="text-emerald-600">Share Progress</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:p-0 print:border-0 print:bg-white print:text-black" aria-describedby={undefined}>
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Progress Report
          </DialogTitle>
          <DialogDescription>
            Preview, customize, and export your progress report to share with your coach or therapist.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="customize" className="w-full">
          <TabsList className="print:hidden w-full">
            <TabsTrigger value="customize" className="flex-1 gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="flex-1 gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* ── Customize Tab ───────────────────────────────────────────── */}
          <TabsContent value="customize" className="mt-4 space-y-5">
            {/* Date Range Picker */}
            <section>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-500" />
                Date Range
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Leave empty to use the default 30-day range
              </p>
            </section>

            <Separator />

            {/* Section Selection */}
            <section>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Include Sections
              </h4>
              <div className="space-y-2.5">
                {sectionOptions.map((sec) => (
                  <label
                    key={sec.key}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedSections.includes(sec.key) ? 'border-emerald-500/30 bg-emerald-500/5' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedSections.includes(sec.key)}
                      onCheckedChange={() => toggleSection(sec.key)}
                    />
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${sec.bgColor}`}>
                      <sec.icon className={`h-4 w-4 ${sec.color}`} />
                    </div>
                    <span className="text-sm font-medium">{sec.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <Separator />

            {/* Coach Notes */}
            <section>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-500" />
                Coach / Therapist Notes
              </h4>
              <textarea
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                rows={3}
                placeholder="Add notes for your coach or therapist..."
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
              />
            </section>
          </TabsContent>

          {/* ── Preview Tab ──────────────────────────────────────────────── */}
          <TabsContent value="preview" className="mt-4">
            <div className="rounded-xl border bg-white text-gray-900 dark:bg-gray-50 dark:text-gray-900 print:border-0 print:rounded-none p-6 space-y-5">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-emerald-700">
                  AdaptiFit Progress Report
                </h2>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {dateFrom && dateTo
                    ? `${new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : d.dateRange}
                </p>
              </div>

              <Separator />

              {/* User Profile */}
              <section>
                <Badge variant="secondary" className="mb-2 bg-emerald-100 text-emerald-800 print:bg-emerald-100">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  User Profile
                </Badge>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name</span>
                    <p className="font-medium font-mono">{d.user.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">User Type</span>
                    <p className="font-medium font-mono">{d.user.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition</span>
                    <p className="font-medium font-mono">{d.user.condition}</p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Comparison sections */}
              {hasComparisonSections && (
                <>
                  {selectedSections.includes('exercise') && (
                    <section>
                      <Badge variant="secondary" className="mb-2 bg-emerald-100 text-emerald-800 print:bg-emerald-100">
                        <Dumbbell className="mr-1 h-3 w-3" />
                        Exercise — This Week vs Last Week
                      </Badge>
                      <ComparisonCard section="exercise" />
                    </section>
                  )}
                  <Separator />

                  {selectedSections.includes('mood') && (
                    <section>
                      <Badge variant="secondary" className="mb-2 bg-rose-100 text-rose-800 print:bg-rose-100">
                        <Brain className="mr-1 h-3 w-3" />
                        Mood — This Week vs Last Week
                      </Badge>
                      <ComparisonCard section="mood" />
                    </section>
                  )}
                  <Separator />

                  {selectedSections.includes('nutrition') && (
                    <section>
                      <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-800 print:bg-amber-100">
                        <Apple className="mr-1 h-3 w-3" />
                        Nutrition — This Week vs Last Week
                      </Badge>
                      <ComparisonCard section="nutrition" />
                    </section>
                  )}
                  <Separator />

                  {selectedSections.includes('heart') && (
                    <section>
                      <Badge variant="secondary" className="mb-2 bg-red-100 text-red-800 print:bg-red-100">
                        <Heart className="mr-1 h-3 w-3" />
                        Heart Health — This Week vs Last Week
                      </Badge>
                      <ComparisonCard section="heart" />
                    </section>
                  )}
                  <Separator />
                </>
              )}

              {/* Achievements */}
              {selectedSections.includes('achievements') && (
                <section>
                  <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-800 print:bg-amber-100">
                    <Award className="mr-1 h-3 w-3" />
                    Achievements
                  </Badge>
                  <div className="space-y-2">
                    {d.achievements.map((a) => (
                      <div key={a.title} className="flex items-center gap-2 text-sm">
                        <span className="text-base">{a.icon}</span>
                        <span className="font-medium">{a.title}</span>
                        <span className="text-gray-400">—</span>
                        <span className="text-gray-500 font-mono text-xs">{a.date}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 pt-2">
                Report generated by AdaptiFit — AI-Powered Adaptive Fitness
              </div>
            </div>
          </TabsContent>

          {/* ── Export Tab ───────────────────────────────────────────────── */}
          <TabsContent value="export" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your progress report to share with your coach, therapist, or healthcare provider.
              </p>

              <div className="grid gap-3">
                {/* Copy to Clipboard */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCopy}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition-colors hover:bg-emerald-50 dark:bg-gray-900 dark:hover:bg-emerald-950/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 90 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-5 w-5 text-emerald-600" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="h-5 w-5 text-emerald-600" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Copy the formatted report text to paste anywhere
                    </p>
                  </div>
                </motion.button>

                {/* Print Report */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePrint}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition-colors hover:bg-emerald-50 dark:bg-gray-900 dark:hover:bg-emerald-950/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                    <Printer className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Print Report
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Open print dialog to print or save as PDF
                    </p>
                  </div>
                </motion.button>

                {/* Download as Text File */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleDownload}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition-colors hover:bg-emerald-50 dark:bg-gray-900 dark:hover:bg-emerald-950/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/40">
                    <Download className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Download .txt File
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Download a formatted text file to email or share
                    </p>
                  </div>
                </motion.button>

                {/* Share with Coach */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleShareWithCoach}
                  disabled={isGenerating || selectedSections.length === 0}
                  className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-4 text-left transition-colors hover:from-emerald-500/10 hover:to-teal-500/10 disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <AnimatePresence mode="wait">
                      {isGenerating ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
                        </motion.div>
                      ) : (
                        <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Users className="h-5 w-5 text-emerald-600" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {isGenerating ? 'Generating...' : 'Share with Coach'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Generate a coach-friendly summary with week-over-week comparison
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0" />
                </motion.button>
              </div>

              {/* Coach Summary Result */}
              <AnimatePresence>
                {shareWithCoach && coachSummary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4" />
                          Coach Summary Generated
                        </h4>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={handleCopyCoachSummary} className="h-7 text-xs">
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy coach summary</TooltipContent>
                        </Tooltip>
                      </div>
                      <pre className="text-[10px] leading-tight text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono scrollbar-thin">
                        {coachSummary}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick tip */}
              <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  <strong>Tip:</strong> Use the Customize tab to select specific sections and date range before exporting.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
