'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Brain,
  AlertTriangle,
  Heart,
  Smile,
  Meh,
  Frown,
  Sun,
  Moon,
  Shield,
  Phone,
  MessageCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Camera,
  CameraOff,
  Sparkles,
  BookOpen,
  HandHeart,
  Leaf,
  Music,
  Bed,
  Footprints,
} from 'lucide-react';
import TTSSpeaker from '@/components/features/tts-speaker';
import { useToastStore } from './toast-provider';
import VoiceInput from '@/components/features/voice-input';
import { monthlyMoodData } from '@/lib/mock-data';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GlassPanel, SectionHeader, useReduced } from '@/components/ui/aurora';
import { useAppStore } from '@/stores/app-store';

// Clinical Aurora token hexes for chart rendering (recharts needs raw colors)
const CHART = {
  primary: '#0E7A5C',
  secondary: '#0E7770',
  accent: '#8A6205',
  warning: '#935F0A',
  danger: '#B42318',
  info: '#116E6B',
  subtle: '#5D746D',
  grid: 'rgba(128,128,128,0.18)',
  axis: 'rgba(128,128,128,0.45)',
};

/** Crisis-language detector for the journal (features.md §6.5). */
const CRISIS_PATTERN =
  /(suicid|kill (myself|me)|end (my|it) (life|all)|self[- ]?harm|hurt (myself|me)|want to die|don'?t want to (live|be here)|no reason to live)/i;

// --- Types ---
type MoodType =
  | 'happy'
  | 'calm'
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'neutral'
  | 'excited'
  | 'tired';

interface MoodOption {
  key: MoodType;
  emoji: string;
  label: string;
  score: number;
  color: string;
}

interface MoodEntry {
  id: string;
  mood: MoodType;
  score: number;
  productivity: number;
  energy: number;
  stress: number;
  note: string;
  timestamp: Date;
}

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// --- Constants ---
const MOOD_OPTIONS: MoodOption[] = [
  { key: 'happy', emoji: '😊', label: 'Happy', score: 9, color: CHART.primary },
  { key: 'calm', emoji: '😌', label: 'Calm', score: 8, color: CHART.secondary },
  { key: 'excited', emoji: '🤩', label: 'Excited', score: 9.5, color: CHART.accent },
  { key: 'neutral', emoji: '😐', label: 'Neutral', score: 5, color: CHART.subtle },
  { key: 'tired', emoji: '😴', label: 'Tired', score: 4, color: CHART.info },
  { key: 'anxious', emoji: '😰', label: 'Anxious', score: 3, color: CHART.warning },
  { key: 'sad', emoji: '😢', label: 'Sad', score: 2, color: CHART.info },
  { key: 'angry', emoji: '😠', label: 'Angry', score: 1, color: CHART.danger },
];

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; glow: string }> = {
  Low: { bg: 'bg-success-soft', text: 'text-success', border: 'border-success/30', glow: '' },
  Medium: { bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/30', glow: '' },
  High: { bg: 'bg-warning-soft', text: 'text-warning', border: 'border-warning/40', glow: 'shadow-lg' },
  Critical: { bg: 'bg-danger-soft', text: 'text-danger', border: 'border-danger/40', glow: 'shadow-lg' },
};

// Simulated 30-day mood timeline data
const generateTimelineData = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const base = 5 + Math.sin(i * 0.3) * 2;
    const noise = (Math.random() - 0.5) * 3;
    const score = Math.max(1, Math.min(10, Math.round((base + noise) * 10) / 10));
    data.push({ day: dayStr, score, date: date.toISOString() });
  }
  return data;
};

const timelineData = generateTimelineData();

// Mood distribution for pie chart
const moodDistribution = [
  { name: 'Happy', value: 35, color: CHART.primary },
  { name: 'Calm', value: 25, color: CHART.secondary },
  { name: 'Neutral', value: 15, color: CHART.subtle },
  { name: 'Excited', value: 10, color: CHART.accent },
  { name: 'Tired', value: 8, color: CHART.info },
  { name: 'Anxious', value: 4, color: CHART.warning },
  { name: 'Sad', value: 2, color: CHART.info },
  { name: 'Angry', value: 1, color: CHART.danger },
];

// Weekly pattern data (4 weeks × 7 days)
const weeklyPatternData = [
  { day: 'Mon', w1: 7, w2: 6, w3: 8, w4: 7 },
  { day: 'Tue', w1: 6, w2: 5, w3: 7, w4: 8 },
  { day: 'Wed', w1: 5, w2: 4, w3: 6, w4: 7 },
  { day: 'Thu', w1: 8, w2: 7, w3: 8, w4: 9 },
  { day: 'Fri', w1: 7, w2: 6, w3: 7, w4: 8 },
  { day: 'Sat', w1: 9, w2: 8, w3: 9, w4: 9 },
  { day: 'Sun', w1: 8, w2: 7, w3: 8, w4: 8 },
];

// Radar chart data for emotional wellness
const wellnessRadarData = [
  { dimension: 'Positivity', score: 72 },
  { dimension: 'Energy', score: 58 },
  { dimension: 'Calm', score: 65 },
  { dimension: 'Focus', score: 70 },
  { dimension: 'Resilience', score: 60 },
  { dimension: 'Social', score: 55 },
];

// AI recommendations
const wellnessRecommendations = [
  {
    icon: Leaf,
    title: 'Mindful Breathing',
    description: 'Try 5 minutes of deep breathing when anxiety peaks. Box breathing (4-4-4-4) is especially effective.',
    category: 'Anxiety Relief',
    color: 'text-primary',
    bgColor: 'bg-primary-soft',
  },
  {
    icon: Music,
    title: 'Mood Music Therapy',
    description: 'Listen to calming instrumental music for 15 minutes. Nature sounds can reduce stress by 25%.',
    category: 'Stress Relief',
    color: 'text-secondary',
    bgColor: 'bg-secondary-soft',
  },
  {
    icon: Footprints,
    title: 'Gentle Movement',
    description: 'A 10-minute walk can boost your mood significantly. Even seated stretching helps release tension.',
    category: 'Energy Boost',
    color: 'text-warning',
    bgColor: 'bg-warning-soft',
  },
  {
    icon: Bed,
    title: 'Sleep Hygiene Check',
    description: 'Your tiredness pattern suggests improving sleep. Try a consistent bedtime routine with no screens.',
    category: 'Rest',
    color: 'text-info',
    bgColor: 'bg-info-soft',
  },
  {
    icon: HandHeart,
    title: 'Self-Compassion Pause',
    description: 'Acknowledge your feelings without judgment. Write one kind thing about yourself today.',
    category: 'Emotional Care',
    color: 'text-danger',
    bgColor: 'bg-danger-soft',
  },
  {
    icon: BookOpen,
    title: 'Gratitude Journaling',
    description: 'List 3 things you are grateful for. Gratitude practice rewires the brain for positivity over time.',
    category: 'Positivity',
    color: 'text-success',
    bgColor: 'bg-success-soft',
  },
];

// Face expression simulation
const faceExpressions = [
  { expression: 'Neutral', confidence: 78 },
  { expression: 'Slight Smile', confidence: 15 },
  { expression: 'Brow Furrow', confidence: 5 },
  { expression: 'Eye Contact', confidence: 92 },
];

// --- Helper ---
function getMoodScore(mood: MoodType | null, defaultScore: number): number {
  if (!mood) return defaultScore;
  const found = MOOD_OPTIONS.find((m) => m.key === mood);
  return found ? found.score : defaultScore;
}

function computeRisk(entries: MoodEntry[]): RiskLevel {
  if (entries.length === 0) return 'Low';
  const recent = entries.slice(-5);
  const avgScore = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
  const avgStress = recent.reduce((sum, e) => sum + e.stress, 0) / recent.length;
  const sadCount = recent.filter((e) => e.mood === 'sad' || e.mood === 'angry').length;

  if (avgScore <= 2.5 || avgStress >= 8.5 || sadCount >= 4) return 'Critical';
  if (avgScore <= 4 || avgStress >= 7 || sadCount >= 3) return 'High';
  if (avgScore <= 5.5 || avgStress >= 5.5 || sadCount >= 2) return 'Medium';
  return 'Low';
}

// --- Component ---
export default function MoodMonitor() {
  const addToast = useToastStore((s) => s.addToast);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [productivity, setProductivity] = useState([5]);
  const [energy, setEnergy] = useState([5]);
  const [stress, setStress] = useState([5]);
  const [journalNote, setJournalNote] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([
    {
      id: '1',
      mood: 'calm',
      score: 8,
      productivity: 6,
      energy: 5,
      stress: 3,
      note: 'Had a good morning walk',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: '2',
      mood: 'happy',
      score: 9,
      productivity: 7,
      energy: 7,
      stress: 2,
      note: 'Great therapy session today',
      timestamp: new Date(Date.now() - 43200000),
    },
  ]);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceAnalysis, setFaceAnalysis] = useState(false);

  const riskLevel = useMemo(() => computeRisk(moodEntries), [moodEntries]);
  const riskColors = RISK_COLORS[riskLevel];
  const showCriticalAlert = riskLevel === 'Critical' || riskLevel === 'High';

  const handleLogMood = () => {
    if (!selectedMood) return;
    const entry: MoodEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      score: getMoodScore(selectedMood, 5),
      productivity: productivity[0],
      energy: energy[0],
      stress: stress[0],
      note: journalNote,
      timestamp: new Date(),
    };
    setMoodEntries((prev) => [...prev, entry]);
    setJournalNote('');
    addToast({ type: 'success', title: 'Mood Logged', description: 'Your mood has been recorded successfully' });
  };

  const handleSimulateFaceAnalysis = () => {
    setCameraActive(true);
    setTimeout(() => {
      setFaceAnalysis(true);
    }, 2000);
  };

  // Heatmap color based on score 1-10
  const getHeatColor = (value: number) => {
    if (value >= 8) return 'bg-success';
    if (value >= 6) return 'bg-primary';
    if (value >= 4) return 'bg-warning';
    if (value >= 2) return 'bg-warning/70';
    return 'bg-danger';
  };
  const reduced = useReduced();
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const journalCrisis = CRISIS_PATTERN.test(journalNote);

  // Line chart data with gradient
  const monthlyLineData = monthlyMoodData.map((d) => ({
    week: d.week,
    happy: d.happy,
    calm: d.calm,
    anxious: d.anxious,
    sad: d.sad,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <SectionHeader
        eyebrow="MOOD"
        title="How are you feeling today?"
        description="Check in with yourself — a mood, a few sliders, and anything you want to write down. Everything stays on your device."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary-soft text-primary">
              <Activity className="h-3 w-3" /> Tracking Active
            </Badge>
            <Badge variant="outline" className={`gap-1.5 ${riskColors.border} ${riskColors.bg} ${riskColors.text}`}>
              <Shield className="h-3 w-3" /> Risk: {riskLevel}
            </Badge>
          </div>
        }
      />

      {/* Anti-Suicide Prevention Alert - Show when risk is High or Critical */}
      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0.14 : 0.4 }}
          >
            <Alert className="border-danger/40 bg-danger-soft">
              <Heart className="h-5 w-5 text-danger" />
              <AlertTitle className="flex items-center gap-2 text-base font-semibold text-danger">
                {riskLevel === 'Critical'
                  ? 'We care about you — You are not alone'
                  : 'We notice you may be going through a tough time'}
                <TTSSpeaker
                  text={riskLevel === 'Critical'
                    ? 'We care about you. You are not alone. Your recent mood patterns suggest you might be going through a very difficult period. Please know that help is always available, and people care about you deeply. Call 988 for the Suicide and Crisis Lifeline, available 24 hours a day, 7 days a week.'
                    : 'We notice you may be going through a tough time. Your emotional data indicates some challenging moments. It is okay to reach out. Speaking with someone can make a real difference.'}
                  size="sm"
                  voice="tongtong"
                  speed={0.85}
                  className="text-danger hover:text-danger/80"
                />
              </AlertTitle>
              <AlertDescription className="space-y-3 text-foreground">
                <p className="text-sm">
                  {riskLevel === 'Critical'
                    ? 'Your recent mood patterns suggest you might be going through a very difficult period. Please know that help is always available, and people care about you deeply.'
                    : 'Your emotional data indicates some challenging moments. It\'s okay to reach out — speaking with someone can make a real difference.'}
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="tel:988"
                    className="flex min-h-12 items-center gap-2 rounded-[14px] bg-danger px-4 py-2 text-danger-foreground"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">988 Suicide &amp; Crisis Lifeline</p>
                      <p className="text-xs opacity-90">Call or text 988 — Available 24/7</p>
                    </div>
                  </a>
                  <div className="flex min-h-12 items-center gap-2 rounded-[14px] border border-danger/30 bg-surface px-4 py-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-danger" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Crisis Text Line</p>
                      <p className="text-xs text-foreground-muted">Text HOME to 741741</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('crisis')}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border-2 border-danger/50 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-soft"
                  >
                    Open Crisis Support
                  </button>
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  You matter. Your feelings are valid. Reaching out is a sign of strength, not weakness.
                </p>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Mood Logger + Sliders + Journal */}
        <div className="space-y-6">
          {/* Mood Logger */}
          <motion.div
            initial={{ opacity: 0, x: reduced ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : 0.1, duration: reduced ? 0.14 : 0.4 }}
          >
            <GlassPanel>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smile className="h-5 w-5 text-primary" />
                  How are you feeling?
                </CardTitle>
                <CardDescription>Select the mood that best describes your current state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.key}
                      onClick={() => setSelectedMood(mood.key)}
                      aria-pressed={selectedMood === mood.key}
                      className={`flex min-h-[72px] cursor-pointer flex-col items-center gap-1 rounded-[18px] border-2 p-3 transition-colors duration-150 ${
                        selectedMood === mood.key
                          ? 'border-primary/60 bg-primary-soft'
                          : 'border-transparent bg-surface-raised/60 hover:border-primary/30'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl">{mood.emoji}</span>
                      <span className="text-xs font-medium text-foreground-muted">
                        {mood.label}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </GlassPanel>
          </motion.div>

          {/* Productivity / Energy / Stress Sliders */}
          <motion.div
            initial={{ opacity: 0, x: reduced ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : 0.2, duration: reduced ? 0.14 : 0.4 }}
          >
            <GlassPanel>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-secondary" />
                  Daily Metrics
                </CardTitle>
                <CardDescription>Rate your productivity, energy, and stress levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Productivity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-success" /> Productivity
                    </label>
                    <Badge variant="outline" className="border-success/30 text-success">
                      {productivity[0]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={productivity}
                    onValueChange={setProductivity}
                    min={1}
                    max={10}
                    step={1}
                    className="[&_[data-slot=slider-range]]:bg-success [&_[data-slot=slider-thumb]]:border-success"
                  />
                </div>

                {/* Energy */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Sun className="h-4 w-4 text-warning" /> Energy
                    </label>
                    <Badge variant="outline" className="border-warning/30 text-warning">
                      {energy[0]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={energy}
                    onValueChange={setEnergy}
                    min={1}
                    max={10}
                    step={1}
                    className="[&_[data-slot=slider-range]]:bg-warning [&_[data-slot=slider-thumb]]:border-warning"
                  />
                </div>

                {/* Stress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-danger" /> Stress
                    </label>
                    <Badge variant="outline" className="border-danger/30 text-danger">
                      {stress[0]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={stress}
                    onValueChange={setStress}
                    min={1}
                    max={10}
                    step={1}
                    className="[&_[data-slot=slider-range]]:bg-danger [&_[data-slot=slider-thumb]]:border-danger"
                  />
                </div>
              </CardContent>
            </GlassPanel>
          </motion.div>

          {/* Mood Journal */}
          <motion.div
            initial={{ opacity: 0, x: reduced ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduced ? 0 : 0.3, duration: reduced ? 0.14 : 0.4 }}
          >
            <GlassPanel>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Mood Journal
                </CardTitle>
                <CardDescription>Write down what&apos;s on your mind — no judgment, just expression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="How was your day? What are you grateful for? What challenged you?"
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                    className="min-h-[100px] resize-none border-border/70 pr-10 focus:border-primary"
                  />
                  <div className="absolute bottom-2 right-2">
                    <VoiceInput
                      onTranscription={(text) => setJournalNote(text)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Crisis-language inline notice (features.md §6.5) */}
                {journalCrisis && (
                  <div className="space-y-3 rounded-[14px] border border-danger/30 bg-danger-soft p-3" role="alert">
                    <p className="text-sm font-medium text-foreground">
                      It sounds like things are really heavy right now. You deserve support — reaching out is free and confidential.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="tel:988"
                        className="flex min-h-11 items-center gap-1.5 rounded-[14px] bg-danger px-4 text-sm font-semibold text-danger-foreground"
                      >
                        <Phone className="h-4 w-4" /> Call 988
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveSection('crisis')}
                        className="min-h-11 rounded-[14px] border-2 border-danger/50 px-4 text-sm font-semibold text-danger hover:bg-danger/10"
                      >
                        Open Crisis Support
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleLogMood}
                  disabled={!selectedMood}
                  className="btn-aurora-primary h-12 w-full gap-2 rounded-[14px] text-[15px] font-semibold"
                >
                  <Heart className="h-4 w-4" />
                  Save check-in
                </Button>
                {!selectedMood && !journalCrisis && (
                  <p className="text-center text-xs text-foreground-subtle">
                    Please select a mood above before logging
                  </p>
                )}
              </CardContent>
            </GlassPanel>
          </motion.div>
        </div>

        {/* Middle Column - Charts */}
        <div className="space-y-6">
          {/* Mood Timeline Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  30-Day Mood Timeline
                </CardTitle>
                <CardDescription>Your emotional journey over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10 }}
                        interval={4}
                        stroke={CHART.axis}
                      />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke={CHART.axis} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={CHART.secondary}
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: CHART.secondary }}
                        activeDot={{ r: 5, fill: CHART.secondary, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Mood Breakdown - Multi-line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="w-5 h-5 text-accent" />
                  Monthly Mood Breakdown
                </CardTitle>
                <CardDescription>Mood categories over recent weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke={CHART.axis} />
                      <YAxis tick={{ fontSize: 11 }} stroke={CHART.axis} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="happy" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="calm" stroke={CHART.secondary} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="anxious" stroke={CHART.warning} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="sad" stroke={CHART.info} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {[
                    { label: 'Happy', color: CHART.primary },
                    { label: 'Calm', color: CHART.secondary },
                    { label: 'Anxious', color: CHART.warning },
                    { label: 'Sad', color: CHART.info },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Distribution - Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smile className="w-5 h-5 text-primary" />
                  Mood Distribution
                </CardTitle>
                <CardDescription>Overall mood pattern breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {moodDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Risk + Face + Pattern + Radar */}
        <div className="space-y-6">
          {/* Risk Assessment Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`glass-panel border ${riskColors.border} ${riskColors.bg} ${riskColors.glow}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className={`w-5 h-5 ${riskColors.text}`} />
                  AI Risk Assessment
                </CardTitle>
                <CardDescription>AI-analyzed emotional wellness risk level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Level</span>
                  <motion.div
                    key={riskLevel}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Badge
                      className={`text-sm px-3 py-1 ${
                        riskLevel === 'Low'
                          ? 'bg-success-soft text-success border-success/30'
                          : riskLevel === 'Medium'
                            ? 'bg-warning-soft text-warning border-warning/30'
                            : riskLevel === 'High'
                              ? 'bg-warning-soft text-warning border-warning/40'
                              : 'bg-danger-soft text-danger border-danger/40'
                      }`}
                    >
                      {riskLevel === 'Critical' && (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {riskLevel}
                    </Badge>
                  </motion.div>
                </div>

                {/* Risk meter */}
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
                    <div
                      className="h-full bg-success transition-all duration-700"
                      style={{ width: riskLevel === 'Low' ? '25%' : '0%' }}
                    />
                    <div
                      className="h-full bg-warning transition-all duration-700"
                      style={{
                        width:
                          riskLevel === 'Medium'
                            ? '25%'
                            : riskLevel === 'High'
                              ? '25%'
                              : riskLevel === 'Critical'
                                ? '25%'
                                : '0%',
                      }}
                    />
                    <div
                      className="h-full bg-warning/70 transition-all duration-700"
                      style={{
                        width:
                          riskLevel === 'High'
                            ? '25%'
                            : riskLevel === 'Critical'
                              ? '25%'
                              : '0%',
                      }}
                    />
                    <div
                      className="h-full bg-danger transition-all duration-700"
                      style={{ width: riskLevel === 'Critical' ? '25%' : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Critical</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-lg font-bold text-primary">{moodEntries.length}</p>
                    <p className="text-xs text-muted-foreground">Entries Logged</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-lg font-bold text-accent">
                      {moodEntries.length > 0
                        ? (
                            moodEntries.reduce((s, e) => s + e.score, 0) / moodEntries.length
                          ).toFixed(1)
                        : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Mood Score</p>
                  </div>
                </div>

                {riskLevel !== 'Low' && (
                  <p className="text-xs text-muted-foreground bg-white/50 rounded-lg p-2">
                    💡 Based on your recent mood entries, stress levels, and pattern analysis, our AI suggests
                    {riskLevel === 'Medium' && ' practicing some calming activities.'}
                    {riskLevel === 'High' && ' reaching out to a trusted person or counselor.'}
                    {riskLevel === 'Critical' && ' speaking with a professional as soon as possible.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Face Expression Analysis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="w-5 h-5 text-accent" />
                  Face Expression Analysis
                </CardTitle>
                <CardDescription>AI-powered expression detection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-[140px] flex items-center justify-center overflow-hidden">
                  {!cameraActive ? (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Camera inactive</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSimulateFaceAnalysis}
                        className="mt-2 text-xs"
                      >
                        <Camera className="w-3 h-3 mr-1" /> Enable Camera
                      </Button>
                    </div>
                  ) : !faceAnalysis ? (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-accent">Analyzing expression...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center">
                          <span className="text-2xl">😐</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          {faceExpressions.map((expr) => (
                            <div key={expr.expression} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{expr.expression}</span>
                                <span className="font-medium">{expr.confidence}%</span>
                              </div>
                              <Progress
                                value={expr.confidence}
                                className="h-1.5 [&_[data-slot=progress-indicator]]:bg-primary"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCameraActive(false);
                      setFaceAnalysis(false);
                    }}
                    className="flex-1 text-xs"
                  >
                    <CameraOff className="w-3 h-3 mr-1" /> Disable
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateFaceAnalysis}
                    className="flex-1 text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" /> Re-analyze
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wellness Radar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-primary" />
                  Emotional Wellness Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wellnessRadarData}>
                      <PolarGrid stroke={CHART.grid} />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} stroke={CHART.axis} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} stroke="#d1d5db" />
                      <Radar
                        name="Wellness"
                        dataKey="score"
                        stroke={CHART.secondary}
                        fill={CHART.secondary}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Weekly Mood Pattern - Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="w-5 h-5 text-warning" />
              Weekly Mood Pattern
            </CardTitle>
            <CardDescription>Heatmap of mood patterns across the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Header */}
                <div className="flex items-center mb-2">
                  <div className="w-16" />
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w) => (
                    <div key={w} className="flex-1 text-center text-xs font-medium text-muted-foreground">
                      {w}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {weeklyPatternData.map((row) => (
                  <div key={row.day} className="flex items-center mb-1.5">
                    <div className="w-16 text-xs font-medium text-muted-foreground">{row.day}</div>
                    {[
                      { val: row.w1, label: `W1: ${row.w1}` },
                      { val: row.w2, label: `W2: ${row.w2}` },
                      { val: row.w3, label: `W3: ${row.w3}` },
                      { val: row.w4, label: `W4: ${row.w4}` },
                    ].map((cell, ci) => (
                      <motion.div
                        key={ci}
                        whileHover={{ scale: 1.1 }}
                        className={`flex-1 mx-0.5 h-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-default ${getHeatColor(cell.val)} text-white`}
                        title={cell.label}
                      >
                        {cell.val}
                      </motion.div>
                    ))}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  {[
                    { label: 'Low (1-2)', color: 'bg-danger' },
                    { label: 'Below (3-4)', color: 'bg-warning/70' },
                    { label: 'Moderate (5-6)', color: 'bg-warning' },
                    { label: 'Good (7-8)', color: 'bg-primary' },
                    { label: 'Great (9-10)', color: 'bg-success' },
                  ].map((leg) => (
                    <div key={leg.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`w-3 h-3 rounded ${leg.color}`} />
                      {leg.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Wellness Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Wellness Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions based on your mood patterns and emotional data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wellnessRecommendations.map((rec, idx) => (
                <motion.div
                  key={rec.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.08 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer group">
                        <Card className="h-full border-border/60 bg-surface/70 hover:border-primary/40 transition-colors duration-150 hover:shadow-md">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${rec.bgColor}`}>
                                <rec.icon className={`w-5 h-5 ${rec.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm">{rec.title}</h4>
                                  <TTSSpeaker
                                    text={`${rec.title}. ${rec.description}`}
                                    size="sm"
                                    voice="tongtong"
                                    speed={0.9}
                                  />
                                </div>
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs border-primary/30 text-primary"
                                >
                                  {rec.category}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {rec.description}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${rec.bgColor}`}>
                            <rec.icon className={`w-5 h-5 ${rec.color}`} />
                          </div>
                          {rec.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {rec.category}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="bg-primary-soft rounded-[14px] p-3 text-sm">
                          <p className="font-medium text-primary mb-1">How to start:</p>
                          <ul className="list-disc list-inside text-foreground-muted text-xs space-y-1">
                            <li>Set a reminder for the same time each day</li>
                            <li>Start with just 2-3 minutes and build up</li>
                            <li>Track your progress in the mood journal</li>
                            <li>Be patient with yourself — progress takes time</li>
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mood History / Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-panel overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-danger" />
                  Recent Mood History
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {moodEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No entries yet. Log your first mood above!
                    </p>
                  ) : (
                    [...moodEntries].reverse().map((entry) => {
                      const moodOpt = MOOD_OPTIONS.find((m) => m.key === entry.mood);
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 bg-muted/30 rounded-lg p-3"
                        >
                          <span className="text-2xl">{moodOpt?.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{moodOpt?.label}</span>
                              <Badge variant="outline" className="text-xs">
                                Score: {entry.score}
                              </Badge>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                &ldquo;{entry.note}&rdquo;
                              </p>
                            )}
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                              <span>⚡ Energy: {entry.energy}</span>
                              <span>📊 Prod: {entry.productivity}</span>
                              <span>😰 Stress: {entry.stress}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {entry.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center w-64 bg-primary-soft/40 p-6">
                <ImageWithFallback />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Weekly comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Frown className="w-5 h-5 text-primary" />
              Mood Trend by Category
            </CardTitle>
            <CardDescription>Comparison of mood categories across weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMoodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke={CHART.axis} />
                  <YAxis tick={{ fontSize: 11 }} stroke={CHART.axis} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="happy" fill={CHART.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="calm" fill={CHART.secondary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anxious" fill={CHART.warning} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sad" fill={CHART.info} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 justify-center">
              {[
                { label: 'Happy', color: CHART.primary },
                { label: 'Calm', color: CHART.secondary },
                { label: 'Anxious', color: CHART.warning },
                { label: 'Sad', color: CHART.info },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Image component with fallback
function ImageWithFallback() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-6xl">🧠</div>
        <p className="text-sm text-primary font-medium">Your mind matters</p>
        <p className="text-xs text-muted-foreground">Track, understand, and nurture your emotional health</p>
      </div>
    );
  }

  return (
    <img
      src="/images/mood.png"
      alt="Mood monitoring illustration"
      className="max-w-full max-h-48 object-contain"
      onError={() => setImgError(true)}
    />
  );
}
