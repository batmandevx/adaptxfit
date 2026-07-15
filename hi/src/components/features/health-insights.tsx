'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Brain,
  RefreshCw,
  Dumbbell,
  Smile,
  Utensils,
  Moon,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// ── Types ────────────────────────────────────────────────────────────────────

type InsightCategory = 'Exercise' | 'Mood' | 'Nutrition' | 'Recovery';
type Priority = 'high' | 'medium' | 'low';

interface HealthInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  priority: Priority;
  confidence: number;
  action: string;
}

interface HealthDimension {
  label: string;
  score: number;
  max: number;
  color: string;
  gradient: string;
}

interface TrendMetric {
  label: string;
  value: string;
  change: number; // positive = improvement, negative = decline
  sparkData: number[];
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const defaultInsights: HealthInsight[] = [
  {
    id: 'insight-1',
    category: 'Exercise',
    title: 'Exercise Frequency Declining',
    description:
      'Your exercise frequency dropped 23% this week. Consider adding short 10-min sessions to maintain your routine and prevent further decline.',
    priority: 'high',
    confidence: 92,
    action: 'View Exercises',
  },
  {
    id: 'insight-2',
    category: 'Mood',
    title: 'Mood Scores Improving',
    description:
      'Mood scores improving steadily over the past 2 weeks. Keep up your current routine — consistent activity is supporting your well-being.',
    priority: 'low',
    confidence: 87,
    action: 'Track Mood',
  },
  {
    id: 'insight-3',
    category: 'Nutrition',
    title: 'Protein Intake Below Target',
    description:
      'Protein intake is 15% below your daily target. Add lean protein sources like chicken, fish, or legumes to your meals for better recovery.',
    priority: 'medium',
    confidence: 78,
    action: 'Log Nutrition',
  },
  {
    id: 'insight-4',
    category: 'Recovery',
    title: 'Sleep Quality Declining',
    description:
      'Sleep quality scores declining over the past week. Try the 4-7-8 breathing pattern before bed to improve relaxation and sleep onset.',
    priority: 'medium',
    confidence: 83,
    action: 'Try Breathing',
  },
];

const healthDimensions: HealthDimension[] = [
  {
    label: 'Physical Fitness',
    score: 78,
    max: 100,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    label: 'Mental Wellness',
    score: 65,
    max: 100,
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    label: 'Nutrition Balance',
    score: 82,
    max: 100,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-yellow-400',
  },
  {
    label: 'Recovery Quality',
    score: 71,
    max: 100,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-teal-400',
  },
  {
    label: 'Activity Consistency',
    score: 85,
    max: 100,
    color: 'text-rose-600',
    gradient: 'from-rose-400 to-pink-400',
  },
];

const trendMetrics: TrendMetric[] = [
  {
    label: 'Weekly Active Minutes',
    value: '187 min',
    change: 12,
    sparkData: [120, 145, 130, 160, 155, 175, 187],
  },
  {
    label: 'Avg. Mood Score',
    value: '7.2/10',
    change: 8,
    sparkData: [5.8, 6.2, 6.5, 6.8, 7.0, 6.9, 7.2],
  },
  {
    label: 'Calorie Intake',
    value: '2,140 kcal',
    change: -5,
    sparkData: [2200, 2180, 2100, 2150, 2080, 2100, 2140],
  },
  {
    label: 'Sleep Hours',
    value: '6.3 hrs',
    change: -8,
    sparkData: [7.1, 7.0, 6.8, 6.5, 6.4, 6.2, 6.3],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const categoryIcon: Record<InsightCategory, React.ReactNode> = {
  Exercise: <Dumbbell className="h-4 w-4" />,
  Mood: <Smile className="h-4 w-4" />,
  Nutrition: <Utensils className="h-4 w-4" />,
  Recovery: <Moon className="h-4 w-4" />,
};

const categoryColor: Record<InsightCategory, string> = {
  Exercise: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Mood: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Nutrition: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Recovery: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
};

const priorityColor: Record<Priority, string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const priorityLabel: Record<Priority, string> = {
  high: 'High Priority',
  medium: 'Medium',
  low: 'Low',
};

// ── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 28;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

// ── Main Component ───────────────────────────────────────────────────────────

export default function HealthInsights() {
  const [insights, setInsights] = useState<HealthInsight[]>(defaultInsights);
  const [dimensions] = useState<HealthDimension[]>(healthDimensions);
  const [trends] = useState<TrendMetric[]>(trendMetrics);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastUpdated(new Date().toLocaleString());
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/health-insights?userId=default-user');
      if (res.ok) {
        const data = await res.json();
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
        if (data.dimensions) {
          // dimensions would be updated from API if returned
        }
      }
    } catch {
      // Silently fall back to default insights
    } finally {
      setLastUpdated(new Date().toLocaleString());
      setIsRefreshing(false);
    }
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-md">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="gradient-text-shine">AI-Powered Insights</span>
                    <Badge variant="secondary" className="ai-badge-pulse gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-2 py-0.5">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    AI-powered recommendations based on your activity
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 text-gray-500 hover:text-emerald-600"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </Button>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  Last updated: {lastUpdated}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* ── Insight Cards ──────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            variants={itemVariants}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="group"
          >
            <Card className={`insight-card-accent glass-card-depth bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-shadow duration-300 h-full`} data-accent={
              insight.category === 'Exercise' ? 'emerald' :
              insight.category === 'Mood' ? 'violet' :
              insight.category === 'Nutrition' ? 'amber' : 'cyan'
            }>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${categoryColor[insight.category]}`}
                  >
                    {categoryIcon[insight.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-medium px-2 py-0.5 ${categoryColor[insight.category]}`}
                      >
                        {insight.category}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-medium px-2 py-0.5 ${priorityColor[insight.priority]}`}
                      >
                        {priorityLabel[insight.priority]}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Progress
                            value={insight.confidence}
                            className="h-1.5"
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 px-2"
                      >
                        {insight.action}
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Health Score Breakdown ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Health Score Breakdown
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Your scores across key health dimensions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4 space-y-4 overflow-x-auto">
            {dimensions.map((dim) => (
              <div key={dim.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {dim.label}
                  </span>
                  <span className={`text-xs font-bold ${dim.color}`}>
                    {dim.score}/{dim.max}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${dim.gradient} dimension-bar-shimmer`}
                    initial={{ width: 0 }}
                    animate={{ width: `${dim.score}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Trend Analysis ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Trend Analysis
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Week-over-week changes in key metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trends.map((metric) => {
                const isPositive = metric.change >= 0;
                const sparkColor = isPositive
                  ? '#10b981'
                  : '#f43f5e';

                return (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        {metric.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {metric.value}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {Math.abs(metric.change)}%
                        </span>
                      </div>
                    </div>
                    <Sparkline data={metric.sparkData} color={sparkColor} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
