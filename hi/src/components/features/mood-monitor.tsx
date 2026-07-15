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
  { key: 'happy', emoji: '😊', label: 'Happy', score: 9, color: '#10b981' },
  { key: 'calm', emoji: '😌', label: 'Calm', score: 8, color: '#14b8a6' },
  { key: 'excited', emoji: '🤩', label: 'Excited', score: 9.5, color: '#f59e0b' },
  { key: 'neutral', emoji: '😐', label: 'Neutral', score: 5, color: '#6b7280' },
  { key: 'tired', emoji: '😴', label: 'Tired', score: 4, color: '#8b5cf6' },
  { key: 'anxious', emoji: '😰', label: 'Anxious', score: 3, color: '#f97316' },
  { key: 'sad', emoji: '😢', label: 'Sad', score: 2, color: '#3b82f6' },
  { key: 'angry', emoji: '😠', label: 'Angry', score: 1, color: '#ef4444' },
];

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; glow: string }> = {
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: '' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', glow: '' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', glow: 'shadow-orange-200/50 shadow-lg' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', glow: 'shadow-red-300/50 shadow-xl' },
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
  { name: 'Happy', value: 35, color: '#10b981' },
  { name: 'Calm', value: 25, color: '#14b8a6' },
  { name: 'Neutral', value: 15, color: '#6b7280' },
  { name: 'Excited', value: 10, color: '#f59e0b' },
  { name: 'Tired', value: 8, color: '#8b5cf6' },
  { name: 'Anxious', value: 4, color: '#f97316' },
  { name: 'Sad', value: 2, color: '#3b82f6' },
  { name: 'Angry', value: 1, color: '#ef4444' },
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
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    icon: Music,
    title: 'Mood Music Therapy',
    description: 'Listen to calming instrumental music for 15 minutes. Nature sounds can reduce stress by 25%.',
    category: 'Stress Relief',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Footprints,
    title: 'Gentle Movement',
    description: 'A 10-minute walk can boost your mood significantly. Even seated stretching helps release tension.',
    category: 'Energy Boost',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    icon: Bed,
    title: 'Sleep Hygiene Check',
    description: 'Your tiredness pattern suggests improving sleep. Try a consistent bedtime routine with no screens.',
    category: 'Rest',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: HandHeart,
    title: 'Self-Compassion Pause',
    description: 'Acknowledge your feelings without judgment. Write one kind thing about yourself today.',
    category: 'Emotional Care',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    icon: BookOpen,
    title: 'Gratitude Journaling',
    description: 'List 3 things you are grateful for. Gratitude practice rewires the brain for positivity over time.',
    category: 'Positivity',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
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
    if (value >= 8) return 'bg-emerald-400';
    if (value >= 6) return 'bg-teal-300';
    if (value >= 4) return 'bg-amber-300';
    if (value >= 2) return 'bg-orange-300';
    return 'bg-red-400';
  };

  // Line chart data with gradient
  const monthlyLineData = monthlyMoodData.map((d) => ({
    week: d.week,
    happy: d.happy,
    calm: d.calm,
    anxious: d.anxious,
    sad: d.sad,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 text-white">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              Mood & Emotion Monitor
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered emotional wellness tracking &amp; support
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Badge variant="outline" className="gap-1.5 text-teal-600 border-teal-200 bg-teal-50">
            <Activity className="w-3 h-3" /> Tracking Active
          </Badge>
          <Badge variant="outline" className="gap-1.5 text-purple-600 border-purple-200 bg-purple-50">
            <Sparkles className="w-3 h-3" /> AI Enabled
          </Badge>
        </div>
      </motion.div>

      {/* Anti-Suicide Prevention Alert - Show when risk is High or Critical */}
      <AnimatePresence>
        {showCriticalAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              className={`border-red-300 ${
                riskLevel === 'Critical'
                  ? 'bg-gradient-to-r from-red-50 via-red-100 to-rose-50'
                  : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50'
              }`}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Heart className="h-5 w-5 text-red-500" />
              </motion.div>
              <AlertTitle className="text-red-800 text-base font-semibold flex items-center gap-2">
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
                  className="text-red-600 hover:text-red-800"
                />
              </AlertTitle>
              <AlertDescription className="text-red-700 space-y-3">
                <p className="text-sm">
                  {riskLevel === 'Critical'
                    ? 'Your recent mood patterns suggest you might be going through a very difficult period. Please know that help is always available, and people care about you deeply.'
                    : 'Your emotional data indicates some challenging moments. It\'s okay to reach out — speaking with someone can make a real difference.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2">
                    <Phone className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">988 Suicide &amp; Crisis Lifeline</p>
                      <p className="text-xs text-red-600">Call or text 988 — Available 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2">
                    <MessageCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Crisis Text Line</p>
                      <p className="text-xs text-red-600">Text HOME to 741741</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-red-600/80 mt-1">
                  💙 You matter. Your feelings are valid. Reaching out is a sign of strength, not weakness.
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-teal-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smile className="w-5 h-5 text-teal-500" />
                  How are you feeling?
                </CardTitle>
                <CardDescription>Select the mood that best describes your current state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <motion.button
                      key={mood.key}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedMood(mood.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedMood === mood.key
                          ? 'border-teal-400 bg-teal-50 shadow-md shadow-teal-100'
                          : 'border-transparent bg-muted/30 hover:bg-muted/60'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl">{mood.emoji}</span>
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                        {mood.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Productivity / Energy / Stress Sliders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Daily Metrics
                </CardTitle>
                <CardDescription>Rate your productivity, energy, and stress levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Productivity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Productivity
                    </label>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      {productivity[0]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={productivity}
                    onValueChange={setProductivity}
                    min={1}
                    max={10}
                    step={1}
                    className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
                  />
                </div>

                {/* Energy */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" /> Energy
                    </label>
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      {energy[0]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={energy}
                    onValueChange={setEnergy}
                    min={1}
                    max={10}
                    step={1}
                    className="[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"
                  />
                </div>

                {/* Stress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-red-500" /> Stress
                    </label>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      {stress[0]}/10
                    </Badge>
                  </div>
                  <Slider
                    value={stress}
                    onValueChange={setStress}
                    min={1}
                    max={10}
                    step={1}
                    className="[&_[data-slot=slider-range]]:bg-red-400 [&_[data-slot=slider-thumb]]:border-red-400"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Journal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-peach-100 bg-gradient-to-br from-white to-orange-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-orange-500" />
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
                    className="min-h-[100px] resize-none border-orange-200 focus:border-orange-300 pr-10"
                  />
                  <div className="absolute bottom-2 right-2">
                    <VoiceInput
                      onTranscription={(text) => setJournalNote(text)}
                      size="sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleLogMood}
                  disabled={!selectedMood}
                  className="w-full bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Log Mood Entry
                </Button>
                {!selectedMood && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please select a mood above before logging
                  </p>
                )}
              </CardContent>
            </Card>
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
            <Card className="border-teal-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-teal-500" />
                  30-Day Mood Timeline
                </CardTitle>
                <CardDescription>Your emotional journey over the past month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10 }}
                        interval={4}
                        stroke="#9ca3af"
                      />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="url(#moodGradientLine)"
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: '#14b8a6' }}
                        activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <defs>
                        <linearGradient id="moodGradientLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
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
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="w-5 h-5 text-purple-500" />
                  Monthly Mood Breakdown
                </CardTitle>
                <CardDescription>Mood categories over recent weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyLineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                      />
                      <Line type="monotone" dataKey="happy" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="calm" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="anxious" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="sad" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {[
                    { label: 'Happy', color: '#10b981' },
                    { label: 'Calm', color: '#14b8a6' },
                    { label: 'Anxious', color: '#f97316' },
                    { label: 'Sad', color: '#3b82f6' },
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
            <Card className="border-teal-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smile className="w-5 h-5 text-teal-500" />
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
                          border: '1px solid #e5e7eb',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {moodDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
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
            <Card className={`border ${riskColors.border} ${riskColors.bg} ${riskColors.glow}`}>
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
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : riskLevel === 'Medium'
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : riskLevel === 'High'
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-red-100 text-red-700 border-red-300'
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
                      className="h-full bg-emerald-400 transition-all duration-700"
                      style={{ width: riskLevel === 'Low' ? '25%' : '0%' }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all duration-700"
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
                      className="h-full bg-orange-400 transition-all duration-700"
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
                      className="h-full bg-red-400 transition-all duration-700"
                      style={{ width: riskLevel === 'Critical' ? '25%' : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Critical</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-lg font-bold text-teal-600">{moodEntries.length}</p>
                    <p className="text-[10px] text-muted-foreground">Entries Logged</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-lg font-bold text-purple-600">
                      {moodEntries.length > 0
                        ? (
                            moodEntries.reduce((s, e) => s + e.score, 0) / moodEntries.length
                          ).toFixed(1)
                        : '—'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg Mood Score</p>
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
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="w-5 h-5 text-purple-500" />
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
                      <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-purple-600">Analyzing expression...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-200 to-purple-200 flex items-center justify-center">
                          <span className="text-2xl">😐</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          {faceExpressions.map((expr) => (
                            <div key={expr.expression} className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span>{expr.expression}</span>
                                <span className="font-medium">{expr.confidence}%</span>
                              </div>
                              <Progress
                                value={expr.confidence}
                                className="h-1.5 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-teal-400 [&_[data-slot=progress-indicator]]:to-purple-400"
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
            <Card className="border-teal-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-teal-500" />
                  Emotional Wellness Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wellnessRadarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} stroke="#d1d5db" />
                      <Radar
                        name="Wellness"
                        dataKey="score"
                        stroke="#14b8a6"
                        fill="#14b8a6"
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
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="w-5 h-5 text-amber-500" />
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
                    { label: 'Low (1-2)', color: 'bg-red-400' },
                    { label: 'Below (3-4)', color: 'bg-orange-300' },
                    { label: 'Moderate (5-6)', color: 'bg-amber-300' },
                    { label: 'Good (7-8)', color: 'bg-teal-300' },
                    { label: 'Great (9-10)', color: 'bg-emerald-400' },
                  ].map((leg) => (
                    <div key={leg.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
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
        <Card className="border-teal-100 bg-gradient-to-br from-white via-teal-50/20 to-purple-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-teal-500" />
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
                        <Card className="h-full border-transparent hover:border-teal-200 transition-all hover:shadow-md">
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
                                  className="mt-1 text-[10px] border-teal-200 text-teal-600"
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
                        <Badge variant="outline" className="border-teal-200 text-teal-600">
                          {rec.category}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="bg-teal-50 rounded-lg p-3 text-sm">
                          <p className="font-medium text-teal-700 mb-1">How to start:</p>
                          <ul className="list-disc list-inside text-teal-600 text-xs space-y-1">
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
        <Card className="border-purple-100 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
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
                              <Badge variant="outline" className="text-[10px]">
                                Score: {entry.score}
                              </Badge>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                &ldquo;{entry.note}&rdquo;
                              </p>
                            )}
                            <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>⚡ Energy: {entry.energy}</span>
                              <span>📊 Prod: {entry.productivity}</span>
                              <span>😰 Stress: {entry.stress}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
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
              <div className="hidden md:flex items-center justify-center w-64 bg-gradient-to-br from-teal-50 to-purple-50 p-6">
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
        <Card className="border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Frown className="w-5 h-5 text-teal-500" />
              Mood Trend by Category
            </CardTitle>
            <CardDescription>Comparison of mood categories across weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMoodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="happy" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="calm" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anxious" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 justify-center">
              {[
                { label: 'Happy', color: '#10b981' },
                { label: 'Calm', color: '#14b8a6' },
                { label: 'Anxious', color: '#f97316' },
                { label: 'Sad', color: '#3b82f6' },
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
        <p className="text-sm text-teal-600 font-medium">Your mind matters</p>
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
