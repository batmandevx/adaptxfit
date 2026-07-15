'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Heart,
  CheckCircle2,
  Loader2,
  Clock,
  Plus,
  X,
  TrendingUp,
  Flame,
  Calendar,
  Trophy,
  ChevronRight,
  Activity,
  Target,
  Sparkles,
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
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Types ────────────────────────────────────────────────────────────────────

interface Milestone {
  id: string;
  userId?: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  dayNumber: number;
  targetDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  progress?: number;
  exercises?: string[];
  createdAt?: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MILESTONES: Milestone[] = [
  {
    id: '1',
    title: 'Initial Assessment',
    description: 'Comprehensive physical evaluation to establish baseline measurements and create a personalized rehabilitation plan.',
    category: 'assessment',
    status: 'completed',
    dayNumber: 1,
    targetDate: '2025-01-15',
    completedAt: '2025-01-15T10:30:00Z',
    notes: 'Baseline range of motion measured. Starting with gentle movements. Good attitude and motivation.',
    progress: 100,
    exercises: ['Range of motion assessment', 'Pain threshold mapping', 'Strength baseline test'],
  },
  {
    id: '2',
    title: 'First Seated Exercises',
    description: 'Completed first full set of seated strengthening exercises with proper form and minimal discomfort.',
    category: 'strength',
    status: 'completed',
    dayNumber: 7,
    targetDate: '2025-01-21',
    completedAt: '2025-01-21T14:00:00Z',
    notes: 'Able to complete 3 sets of 10 reps. Feeling more confident with each session.',
    progress: 100,
    exercises: ['Seated leg extensions', 'Chair-assisted arm raises', 'Core engagement holds'],
  },
  {
    id: '3',
    title: 'Pain Level Reduced by 30%',
    description: 'Achieved significant pain reduction through consistent therapy and proper medication management.',
    category: 'pain',
    status: 'completed',
    dayNumber: 14,
    targetDate: '2025-01-28',
    completedAt: '2025-01-28T09:15:00Z',
    notes: 'Pain score down from 7/10 to 4/10. Sleep quality improving as a result.',
    progress: 100,
    exercises: ['Pain mapping exercises', 'Gentle stretching routine', 'Breathing techniques for pain management'],
  },
  {
    id: '4',
    title: 'Independent Wheelchair Transfer',
    description: 'Successfully performing wheelchair transfers independently — a major step toward autonomy.',
    category: 'mobility',
    status: 'completed',
    dayNumber: 21,
    targetDate: '2025-02-04',
    completedAt: '2025-02-04T11:30:00Z',
    notes: 'First time doing it alone! Occupational therapist confirmed safe technique. Big confidence boost.',
    progress: 100,
    exercises: ['Transfer technique practice', 'Upper body strengthening', 'Balance awareness drills'],
  },
  {
    id: '5',
    title: 'Standing Exercise 5 Minutes',
    description: 'Maintained standing position for 5 continuous minutes with minimal support — rebuilding leg strength and balance.',
    category: 'strength',
    status: 'completed',
    dayNumber: 30,
    targetDate: '2025-02-13',
    completedAt: '2025-02-13T15:45:00Z',
    notes: 'Legs were shaking but held strong. Physical therapist very pleased with progress.',
    progress: 100,
    exercises: ['Parallel bar standing', 'Weight shifting exercises', 'Ankle stability work'],
  },
  {
    id: '6',
    title: 'Walked 100m with Assistance',
    description: 'Walked 100 meters using a walker with therapist assistance — first real walking milestone.',
    category: 'mobility',
    status: 'completed',
    dayNumber: 40,
    targetDate: '2025-02-23',
    completedAt: '2025-02-23T10:00:00Z',
    notes: 'Amazing feeling to be walking again, even with support. Each step feels like victory.',
    progress: 100,
    exercises: ['Walker-assisted ambulation', 'Gait training', 'Step-over-step stair practice'],
  },
  {
    id: '7',
    title: 'Balance Training Progress',
    description: 'Currently working on advanced balance exercises — single-leg stands, dynamic movement, and proprioception training.',
    category: 'endurance',
    status: 'in-progress',
    dayNumber: 47,
    targetDate: '2025-03-02',
    notes: 'Making steady progress. Can hold single-leg stand for 8 seconds on good days.',
    progress: 65,
    exercises: ['Single-leg balance holds', 'BOSU ball exercises', 'Dynamic weight transfers'],
  },
  {
    id: '8',
    title: 'Walk Independently 500m',
    description: 'The ultimate milestone — walking 500 meters independently without any assistive device.',
    category: 'milestone',
    status: 'upcoming',
    dayNumber: 60,
    targetDate: '2025-03-15',
    notes: null,
    progress: 0,
    exercises: ['Independent walking drills', 'Endurance building walks', 'Community mobility practice'],
  },
];

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  assessment: {
    label: 'Assessment',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-300 dark:border-cyan-800/50',
    icon: '📋',
  },
  strength: {
    label: 'Strength',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-300 dark:border-emerald-800/50',
    icon: '💪',
  },
  mobility: {
    label: 'Mobility',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-950/40',
    borderColor: 'border-teal-300 dark:border-teal-800/50',
    icon: '🦿',
  },
  pain: {
    label: 'Pain Mgmt',
    color: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-100 dark:bg-rose-950/40',
    borderColor: 'border-rose-300 dark:border-rose-800/50',
    icon: '🩹',
  },
  endurance: {
    label: 'Endurance',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    borderColor: 'border-amber-300 dark:border-amber-800/50',
    icon: '🏃',
  },
  milestone: {
    label: 'Milestone',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-950/40',
    borderColor: 'border-violet-300 dark:border-violet-800/50',
    icon: '🏆',
  },
};

const STATUS_CONFIG = {
  completed: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-400',
    lineColor: 'bg-emerald-400',
    glowColor: 'shadow-emerald-500/30',
    icon: CheckCircle2,
  },
  'in-progress': {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500',
    ringColor: 'ring-amber-400',
    lineColor: 'bg-amber-400',
    glowColor: 'shadow-amber-500/30',
    icon: Loader2,
  },
  upcoming: {
    color: 'text-gray-400 dark:text-gray-500',
    bgColor: 'bg-gray-300 dark:bg-gray-600',
    ringColor: 'ring-gray-300 dark:ring-gray-600',
    lineColor: 'bg-gray-200 dark:bg-gray-700',
    glowColor: '',
    icon: Clock,
  },
};

// ── Progress Ring Component ──────────────────────────────────────────────────

function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-gray-200 dark:stroke-gray-700"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-emerald-500 dark:stroke-emerald-400"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// ── Milestone Node Component ─────────────────────────────────────────────────

function MilestoneNode({
  milestone,
  index,
  isSelected,
  onClick,
  isLast,
}: {
  milestone: Milestone;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isLast: boolean;
}) {
  const statusConfig = STATUS_CONFIG[milestone.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.upcoming;
  const categoryConfig = CATEGORY_CONFIG[milestone.category] || CATEGORY_CONFIG.milestone;
  const StatusIcon = statusConfig.icon;
  const isCompleted = milestone.status === 'completed';
  const isInProgress = milestone.status === 'in-progress';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="relative flex gap-4"
    >
      {/* Timeline line & node */}
      <div className="flex flex-col items-center shrink-0">
        <motion.button
          onClick={onClick}
          className={`
            relative z-10 w-10 h-10 rounded-full flex items-center justify-center
            ring-2 ${statusConfig.ringColor}
            ${isCompleted ? `shadow-lg ${statusConfig.glowColor}` : ''}
            transition-all duration-300 hover:scale-110
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className={`w-full h-full rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : isInProgress ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <Clock className="w-4 h-4 text-white" />
            )}
          </div>
          {/* Glow effect for completed */}
          {isCompleted && (
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400"
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          {/* Pulse for in-progress */}
          {isInProgress && (
            <motion.div
              className="absolute inset-0 rounded-full bg-amber-400"
              initial={{ opacity: 0.3, scale: 1 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>

        {/* Connecting line */}
        {!isLast && (
          <div className="relative w-0.5 flex-1 min-h-[40px]">
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
            {isCompleted && (
              <motion.div
                className="absolute inset-0 bg-emerald-400"
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              />
            )}
            {isInProgress && (
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400 to-gray-200 dark:to-gray-700" />
            )}
            {!isCompleted && !isInProgress && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 border-l-2 border-dashed border-gray-300 dark:border-gray-600 opacity-60" style={{ background: 'none' }} />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <motion.div
        onClick={onClick}
        className={`
          flex-1 pb-6 cursor-pointer group
        `}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`
            relative rounded-xl p-4 border transition-all duration-300
            ${isSelected
              ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
              : isCompleted
                ? 'border-emerald-200/60 dark:border-emerald-800/40 bg-white/60 dark:bg-gray-800/40 hover:border-emerald-300 dark:hover:border-emerald-700'
                : isInProgress
                  ? 'border-amber-200/60 dark:border-amber-800/40 bg-white/60 dark:bg-gray-800/40 hover:border-amber-300 dark:hover:border-amber-700'
                  : 'border-gray-200/40 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/20 hover:border-gray-300 dark:hover:border-gray-600'
            }
            backdrop-blur-sm
          `}
        >
          {/* Selected indicator */}
          {isSelected && (
            <motion.div
              layoutId="selected-indicator"
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-emerald-500"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  Day {milestone.dayNumber}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 ${categoryConfig.bgColor} ${categoryConfig.color} ${categoryConfig.borderColor}`}
                >
                  {categoryConfig.icon} {categoryConfig.label}
                </Badge>
              </div>
              <h4 className={`text-sm font-semibold ${isCompleted ? 'text-gray-800 dark:text-gray-100' : isInProgress ? 'text-amber-800 dark:text-amber-200' : 'text-gray-500 dark:text-gray-400'} group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors`}>
                {milestone.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {milestone.description}
              </p>

              {/* Progress bar for in-progress */}
              {isInProgress && milestone.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Progress</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-1.5 bg-amber-100 dark:bg-amber-900/30 [&>div]:bg-amber-500" />
                </div>
              )}
            </div>

            <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-colors ${isSelected ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 group-hover:text-emerald-500'}`} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Milestone Details Panel ──────────────────────────────────────────────────

function MilestoneDetails({
  milestone,
  onClose,
}: {
  milestone: Milestone;
  onClose: () => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[milestone.category] || CATEGORY_CONFIG.milestone;
  const isCompleted = milestone.status === 'completed';
  const isInProgress = milestone.status === 'in-progress';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`text-xs ${categoryConfig.bgColor} ${categoryConfig.color} ${categoryConfig.borderColor}`}
            >
              {categoryConfig.icon} {categoryConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                  : isInProgress
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
              }`}
            >
              {isCompleted ? '✓ Completed' : isInProgress ? '🔄 In Progress' : '🔮 Upcoming'}
            </Badge>
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
            {milestone.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Day {milestone.dayNumber} of journey</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        {milestone.description}
      </p>

      {/* Progress */}
      {(isInProgress || isCompleted) && milestone.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Completion</span>
            <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {milestone.progress}%
            </span>
          </div>
          <Progress
            value={milestone.progress}
            className={`h-2 ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 [&>div]:bg-emerald-500' : 'bg-amber-100 dark:bg-amber-900/30 [&>div]:bg-amber-500'}`}
          />
        </div>
      )}

      {/* Exercises */}
      {milestone.exercises && milestone.exercises.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Exercises & Activities
          </h4>
          <div className="space-y-1.5">
            {milestone.exercises.map((exercise, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 text-xs"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : 'bg-gray-400'}`} />
                <span className="text-gray-600 dark:text-gray-300">{exercise}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {milestone.notes && (
        <div className="rounded-lg bg-gray-50/80 dark:bg-gray-700/30 p-3 border border-gray-100 dark:border-gray-700/50">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Notes & Reflections
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
            &ldquo;{milestone.notes}&rdquo;
          </p>
        </div>
      )}

      {/* Date info */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        {milestone.targetDate && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Calendar className="w-3 h-3" />
            Target: {new Date(milestone.targetDate).toLocaleDateString()}
          </div>
        )}
        {milestone.completedAt && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-500">
            <CheckCircle2 className="w-3 h-3" />
            Completed: {new Date(milestone.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Add Milestone Form ───────────────────────────────────────────────────────

function AddMilestoneForm({
  onSave,
  onCancel,
}: {
  onSave: (milestone: Partial<Milestone>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('milestone');
  const [dayNumber, setDayNumber] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !dayNumber) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      dayNumber: parseInt(dayNumber),
      targetDate: targetDate || undefined,
      notes: notes.trim() || undefined,
      status: 'upcoming',
      progress: 0,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-teal-200/60 dark:border-teal-800/40 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Custom Milestone
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 w-7 p-0 text-gray-400"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2.5">
        <div>
          <Label className="text-xs text-gray-600 dark:text-gray-300">Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., First 200m Walk"
            className="mt-1 h-8 text-sm bg-white/80 dark:bg-gray-900/50"
          />
        </div>

        <div>
          <Label className="text-xs text-gray-600 dark:text-gray-300">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this milestone..."
            className="mt-1 text-sm bg-white/80 dark:bg-gray-900/50 min-h-[60px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-300">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 h-8 text-sm bg-white/80 dark:bg-gray-900/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assessment">📋 Assessment</SelectItem>
                <SelectItem value="strength">💪 Strength</SelectItem>
                <SelectItem value="mobility">🦿 Mobility</SelectItem>
                <SelectItem value="pain">🩹 Pain Mgmt</SelectItem>
                <SelectItem value="endurance">🏃 Endurance</SelectItem>
                <SelectItem value="milestone">🏆 Milestone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-300">Day Number *</Label>
            <Input
              type="number"
              value={dayNumber}
              onChange={(e) => setDayNumber(e.target.value)}
              placeholder="e.g., 75"
              min={1}
              className="mt-1 h-8 text-sm bg-white/80 dark:bg-gray-900/50"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-gray-600 dark:text-gray-300">Target Date</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="mt-1 h-8 text-sm bg-white/80 dark:bg-gray-900/50"
          />
        </div>

        <div>
          <Label className="text-xs text-gray-600 dark:text-gray-300">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any personal notes or goals..."
            className="mt-1 text-sm bg-white/80 dark:bg-gray-900/50 min-h-[40px]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !dayNumber}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Milestone
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="h-8 text-xs border-gray-300 dark:border-gray-600"
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ── Stats Summary Component ──────────────────────────────────────────────────

function RehabStats({ milestones }: { milestones: Milestone[] }) {
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const total = milestones.length;

  // Calculate streaks based on day numbers (simulated)
  const completedDays = milestones
    .filter((m) => m.status === 'completed')
    .map((m) => m.dayNumber)
    .sort((a, b) => a - b);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Simple streak calculation based on consecutive day ranges
  for (let i = 1; i < completedDays.length; i++) {
    const gap = completedDays[i] - completedDays[i - 1];
    if (gap <= 7) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  currentStreak = completedDays.length > 0 ? Math.min(completedDays.length, 47) : 0;
  longestStreak = Math.max(longestStreak, currentStreak);

  // Average progress per week
  const totalDays = milestones.length > 0 ? Math.max(...milestones.map((m) => m.dayNumber)) : 1;
  const avgProgressPerWeek = total > 0 ? ((completed / total) * 100) / (totalDays / 7) : 0;

  const stats = [
    {
      label: 'Milestones Achieved',
      value: `${completed}/${total}`,
      icon: Trophy,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    },
    {
      label: 'Longest Streak',
      value: `${longestStreak} days`,
      icon: TrendingUp,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-950/40',
    },
    {
      label: 'Avg Progress/Week',
      value: `${avgProgressPerWeek.toFixed(1)}%`,
      icon: Target,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-100 dark:bg-violet-950/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-lg p-3 border border-gray-100 dark:border-gray-700/40 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm"
        >
          <div className={`w-7 h-7 rounded-md ${stat.bgColor} flex items-center justify-center mb-2`}>
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
          </div>
          <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Rehab Timeline Component ────────────────────────────────────────────

export default function RehabTimeline() {
  const [milestones, setMilestones] = useState<Milestone[]>(MOCK_MILESTONES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate overall progress
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const inProgressMilestone = milestones.find((m) => m.status === 'in-progress');
  const overallProgress = milestones.length > 0
    ? ((completedCount + (inProgressMilestone?.progress || 0) / 100) / milestones.length) * 100
    : 0;

  // Find next milestone
  const nextMilestone = milestones.find((m) => m.status === 'in-progress') ||
    milestones.find((m) => m.status === 'upcoming');

  // Current day number
  const currentDay = inProgressMilestone?.dayNumber || 47;

  // Start date calculation
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (currentDay - 1));

  const handleAddMilestone = useCallback((data: Partial<Milestone>) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: data.title || 'New Milestone',
      description: data.description || null,
      category: data.category || 'milestone',
      status: 'upcoming',
      dayNumber: data.dayNumber || milestones.length + 1,
      targetDate: data.targetDate || null,
      notes: data.notes || null,
      progress: 0,
      exercises: [],
    };

    setMilestones((prev) => [...prev, newMilestone].sort((a, b) => a.dayNumber - b.dayNumber));
    setShowAddForm(false);

    // Also POST to API
    fetch('/api/rehab-milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'default-user',
        title: newMilestone.title,
        description: newMilestone.description,
        category: newMilestone.category,
        status: newMilestone.status,
        dayNumber: newMilestone.dayNumber,
        targetDate: newMilestone.targetDate,
        notes: newMilestone.notes,
      }),
    }).catch(() => {
      // Silently handle — mock data takes priority for UI
    });
  }, [milestones.length]);

  const selectedMilestone = milestones.find((m) => m.id === selectedId);

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

  if (!isLoaded) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-emerald-200/50 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-8 h-8 text-emerald-500" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-emerald-200/50 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/5 overflow-hidden">
        <CardHeader className="pb-3">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                  Rehabilitation Journey
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                </CardTitle>
                <CardDescription className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  Day {currentDay} of your journey &middot; Started {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressRing percentage={overallProgress} />
            </div>
          </motion.div>

          {/* Next milestone indicator */}
          {nextMilestone && (
            <motion.div
              variants={itemVariants}
              className="mt-3 rounded-lg bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/40 p-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">
                    Next Milestone
                  </p>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 truncate">
                    {nextMilestone.title}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0"
                >
                  Day {nextMilestone.dayNumber}
                </Badge>
              </div>
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Rehab Stats ──────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <RehabStats milestones={milestones} />
          </motion.div>

          {/* ── Vertical Timeline ────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="space-y-0">
              {milestones.map((milestone, index) => (
                <MilestoneNode
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  isSelected={selectedId === milestone.id}
                  onClick={() => setSelectedId(selectedId === milestone.id ? null : milestone.id)}
                  isLast={index === milestones.length - 1}
                />
              ))}
            </div>
          </motion.div>

          {/* ── Milestone Details Panel ──────────────────────────────────── */}
          <AnimatePresence>
            {selectedMilestone && (
              <motion.div variants={itemVariants}>
                <MilestoneDetails
                  milestone={selectedMilestone}
                  onClose={() => setSelectedId(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Add Milestone ────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {showAddForm ? (
                <AddMilestoneForm
                  onSave={handleAddMilestone}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  className="w-full border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 h-10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Milestone
                </Button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between pt-2 border-t border-emerald-100 dark:border-emerald-900/30"
          >
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {completedCount}
                </span>{' '}
                of {milestones.length} milestones completed
              </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {Math.round(overallProgress)}% overall
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
