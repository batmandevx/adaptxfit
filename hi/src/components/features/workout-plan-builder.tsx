'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Dumbbell,
  Heart,
  Flame,
  Wind,
  Scale,
  Save,
  Play,
  CheckCircle2,
  Calendar,
  FileText,
  X,
  AlertCircle,
  Sparkles,
  Timer,
  RotateCcw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Types
interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  rest: number;
}

interface WorkoutPlanData {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  difficulty: string;
  category: string;
  duration: number;
  exercises: ExerciseItem[];
  scheduledAt: string | null;
  completedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanCounts {
  total: number;
  active: number;
  completed: number;
  draft: number;
}

// Exercise Library Data
const exerciseLibrary = {
  'Upper Body': [
    { id: 'ub-1', name: 'Seated Dumbbell Curls' },
    { id: 'ub-2', name: 'Wall Push-ups' },
    { id: 'ub-3', name: 'Resistance Band Rows' },
    { id: 'ub-4', name: 'Shoulder Rotations' },
    { id: 'ub-5', name: 'Wrist Curls' },
  ],
  'Lower Body': [
    { id: 'lb-1', name: 'Seated Leg Extensions' },
    { id: 'lb-2', name: 'Ankle Circles' },
    { id: 'lb-3', name: 'Glute Bridges' },
    { id: 'lb-4', name: 'Calf Raises' },
    { id: 'lb-5', name: 'Hip Flexor Stretch' },
  ],
  Core: [
    { id: 'co-1', name: 'Seated Crunches' },
    { id: 'co-2', name: 'Plank Hold' },
    { id: 'co-3', name: 'Russian Twists' },
    { id: 'co-4', name: 'Bird Dog' },
    { id: 'co-5', name: 'Dead Bug' },
  ],
  Flexibility: [
    { id: 'fl-1', name: 'Seated Forward Fold' },
    { id: 'fl-2', name: 'Cat-Cow Stretch' },
    { id: 'fl-3', name: 'Spinal Twist' },
    { id: 'fl-4', name: 'Neck Rolls' },
    { id: 'fl-5', name: 'Shoulder Stretch' },
  ],
  Cardio: [
    { id: 'ca-1', name: 'Seated Boxing' },
    { id: 'ca-2', name: 'Arm Ergometer' },
    { id: 'ca-3', name: 'Marching in Place' },
    { id: 'ca-4', name: 'Jumping Jacks (Adaptive)' },
    { id: 'ca-5', name: 'Swimming Motion' },
  ],
};

// Quick Plan Templates
const quickTemplates = [
  {
    id: 'tpl-1',
    name: 'Morning Stretch Routine',
    description: 'A gentle morning routine to wake up your body and improve flexibility.',
    difficulty: 'beginner' as const,
    category: 'flexibility',
    exercises: [
      { id: 'fl-4', name: 'Neck Rolls', sets: 1, reps: 10, rest: 15 },
      { id: 'fl-5', name: 'Shoulder Stretch', sets: 2, reps: 8, rest: 20 },
      { id: 'fl-2', name: 'Cat-Cow Stretch', sets: 2, reps: 10, rest: 20 },
      { id: 'fl-1', name: 'Seated Forward Fold', sets: 2, reps: 8, rest: 30 },
      { id: 'fl-3', name: 'Spinal Twist', sets: 2, reps: 8, rest: 20 },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Rehab Recovery Day',
    description: 'A carefully designed routine for rehabilitation and recovery.',
    difficulty: 'beginner' as const,
    category: 'rehabilitation',
    exercises: [
      { id: 'ub-4', name: 'Shoulder Rotations', sets: 2, reps: 10, rest: 30 },
      { id: 'lb-2', name: 'Ankle Circles', sets: 2, reps: 12, rest: 20 },
      { id: 'lb-5', name: 'Hip Flexor Stretch', sets: 2, reps: 8, rest: 30 },
      { id: 'co-5', name: 'Dead Bug', sets: 2, reps: 8, rest: 30 },
    ],
  },
  {
    id: 'tpl-3',
    name: 'Strength Builder',
    description: 'Build functional strength with progressive adaptive exercises.',
    difficulty: 'intermediate' as const,
    category: 'strength',
    exercises: [
      { id: 'ub-1', name: 'Seated Dumbbell Curls', sets: 3, reps: 12, rest: 45 },
      { id: 'ub-3', name: 'Resistance Band Rows', sets: 3, reps: 10, rest: 45 },
      { id: 'ub-2', name: 'Wall Push-ups', sets: 3, reps: 10, rest: 40 },
      { id: 'lb-1', name: 'Seated Leg Extensions', sets: 3, reps: 12, rest: 45 },
      { id: 'lb-3', name: 'Glute Bridges', sets: 3, reps: 10, rest: 40 },
      { id: 'co-1', name: 'Seated Crunches', sets: 3, reps: 15, rest: 30 },
    ],
  },
  {
    id: 'tpl-4',
    name: 'Balance & Coordination',
    description: 'Improve your balance and coordination with targeted exercises.',
    difficulty: 'intermediate' as const,
    category: 'balance',
    exercises: [
      { id: 'co-4', name: 'Bird Dog', sets: 3, reps: 8, rest: 30 },
      { id: 'co-5', name: 'Dead Bug', sets: 3, reps: 8, rest: 30 },
      { id: 'lb-4', name: 'Calf Raises', sets: 3, reps: 12, rest: 25 },
      { id: 'fl-3', name: 'Spinal Twist', sets: 2, reps: 10, rest: 20 },
      { id: 'co-3', name: 'Russian Twists', sets: 3, reps: 10, rest: 30 },
    ],
  },
];

// Difficulty config
const difficultyConfig = {
  beginner: {
    label: 'Beginner',
    icon: '🌱',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    badgeColor: 'bg-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  intermediate: {
    label: 'Intermediate',
    icon: '🔥',
    color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    badgeColor: 'bg-amber-500',
    gradient: 'from-amber-400 to-amber-600',
  },
  advanced: {
    label: 'Advanced',
    icon: '💪',
    color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
    badgeColor: 'bg-rose-500',
    gradient: 'from-rose-400 to-rose-600',
  },
};

// Category config
const categoryConfig: Record<string, { label: string; icon: React.ReactNode; emoji: string }> = {
  strength: { label: 'Strength', icon: <Dumbbell className="h-4 w-4" />, emoji: '💪' },
  flexibility: { label: 'Flexibility', icon: <Wind className="h-4 w-4" />, emoji: '🧘' },
  cardio: { label: 'Cardio', icon: <Flame className="h-4 w-4" />, emoji: '🏃' },
  rehabilitation: { label: 'Rehabilitation', icon: <Heart className="h-4 w-4" />, emoji: '🩹' },
  balance: { label: 'Balance', icon: <Scale className="h-4 w-4" />, emoji: '⚖️' },
};

// Status config
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    icon: <FileText className="h-3 w-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    icon: <Calendar className="h-3 w-3" />,
  },
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: <Play className="h-3 w-3" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

const exerciseCardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

// Calculate total duration from exercises
function calculateDuration(exercises: ExerciseItem[]): number {
  let totalMinutes = 0;
  for (const ex of exercises) {
    const exerciseMinutes = ex.duration
      ? ex.duration
      : Math.ceil((ex.sets * ex.reps * 0.05) + (ex.sets * ex.rest / 60));
    totalMinutes += exerciseMinutes;
  }
  return Math.max(5, Math.round(totalMinutes / 5) * 5);
}

export default function WorkoutPlanBuilder() {
  // State
  const [plans, setPlans] = useState<WorkoutPlanData[]>([]);
  const [counts, setCounts] = useState<PlanCounts>({ total: 0, active: 0, completed: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form state
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [category, setCategory] = useState<string>('strength');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);

  // Add exercise dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedExerciseLib, setSelectedExerciseLib] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newSets, setNewSets] = useState(3);
  const [newReps, setNewReps] = useState(10);
  const [newRest, setNewRest] = useState(30);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/workout-plans');
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Reset form
  const resetForm = () => {
    setPlanName('');
    setPlanDescription('');
    setDifficulty('beginner');
    setCategory('strength');
    setExercises([]);
    setEditingPlanId(null);
    setShowBuilder(false);
  };

  // Apply template
  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setPlanName(template.name);
    setPlanDescription(template.description);
    setDifficulty(template.difficulty);
    setCategory(template.category);
    setExercises([...template.exercises]);
    setEditingPlanId(null);
    setShowBuilder(true);
  };

  // Edit plan
  const editPlan = (plan: WorkoutPlanData) => {
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setDifficulty(plan.difficulty);
    setCategory(plan.category);
    setExercises([...plan.exercises]);
    setEditingPlanId(plan.id);
    setShowBuilder(true);
  };

  // Delete plan
  const deletePlan = async (id: string) => {
    try {
      await fetch(`/api/workout-plans?id=${id}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setCounts((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  // Save plan
  const savePlan = async (status: string) => {
    if (!planName.trim()) return;
    if (exercises.length === 0) return;

    const duration = calculateDuration(exercises);

    try {
      if (editingPlanId) {
        // Update existing plan
        const res = await fetch('/api/workout-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPlanId,
            name: planName,
            description: planDescription,
            difficulty,
            category,
            duration,
            exercises,
            status,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPlans((prev) =>
            prev.map((p) => (p.id === editingPlanId ? data.data : p))
          );
        }
      } else {
        // Create new plan
        const res = await fetch('/api/workout-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: planName,
            description: planDescription,
            difficulty,
            category,
            duration,
            exercises,
            status,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPlans((prev) => [data.data, ...prev]);
          setCounts((prev) => ({
            ...prev,
            total: prev.total + 1,
            [status === 'draft' ? 'draft' : 'active']: prev[status === 'draft' ? 'draft' : 'active'] + 1,
          }));
        }
      }
      resetForm();
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
    }
  };

  // Add exercise from library
  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    const newEx: ExerciseItem = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      sets: newSets,
      reps: newReps,
      rest: newRest,
    };
    setExercises((prev) => [...prev, newEx]);
    setNewExerciseName('');
    setNewSets(3);
    setNewReps(10);
    setNewRest(30);
    setAddDialogOpen(false);
  };

  // Remove exercise
  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // Move exercise up/down
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    setExercises((prev) => {
      const newExercises = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newExercises.length) return prev;
      [newExercises[index], newExercises[targetIndex]] = [newExercises[targetIndex], newExercises[index]];
      return newExercises;
    });
  };

  // Select exercise from library dialog
  const selectFromLibrary = (name: string) => {
    setNewExerciseName(name);
  };

  const estimatedDuration = calculateDuration(exercises);

  return (
    <div className="w-full space-y-8">
      {/* ==================== MY WORKOUT PLANS SECTION ==================== */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <Dumbbell className="inline-block mr-2 h-7 w-7 text-emerald-600" />
              My Workout Plans
            </h2>
            <p className="text-muted-foreground mt-1">
              Create and manage your personalized adaptive workout plans
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowBuilder(true);
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            New Plan
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Plans', value: counts.total, icon: <FileText className="h-4 w-4" />, color: 'text-gray-600 dark:text-gray-400' },
            { label: 'Active', value: counts.active, icon: <Play className="h-4 w-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Completed', value: counts.completed, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-teal-600 dark:text-teal-400' },
            { label: 'Drafts', value: counts.draft, icon: <FileText className="h-4 w-4" />, color: 'text-gray-500 dark:text-gray-500' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`${stat.color}`}>{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0 shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <Dumbbell className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">No workout plans yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Create your first plan or use a template below to get started
            </p>
            <Button
              onClick={() => setShowBuilder(true)}
              className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Plan
            </Button>
          </motion.div>
        ) : (
          <ScrollArea className="max-h-[480px]">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {plans.slice(0, 6).map((plan) => {
                  const diffConfig = difficultyConfig[plan.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;
                  const catConfig = categoryConfig[plan.category];
                  const statConfig = statusConfig[plan.status] || statusConfig.draft;

                  return (
                    <motion.div
                      key={plan.id}
                      variants={cardVariants}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {plan.name}
                            </CardTitle>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0.5 ${diffConfig.color}`}
                              >
                                {diffConfig.label}
                              </Badge>
                            </div>
                          </div>
                          {plan.description && (
                            <CardDescription className="text-xs line-clamp-1 mt-0.5">
                              {plan.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {/* Category & Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs gap-1">
                              {catConfig?.emoji} {catConfig?.label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs gap-1 ${statConfig.color} ${plan.status === 'active' ? 'animate-pulse' : ''}`}
                            >
                              {statConfig.icon}
                              {statConfig.label}
                            </Badge>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Dumbbell className="h-3.5 w-3.5 text-emerald-500" />
                              {plan.exercises.length} exercises
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-teal-500" />
                              {plan.duration} min
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                editPlan(plan);
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Workout Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{plan.name}&quot;? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deletePlan(plan.id)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </ScrollArea>
        )}
      </section>

      {/* ==================== PLAN BUILDER FORM ==================== */}
      <AnimatePresence>
        {showBuilder && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      <Sparkles className="inline-block mr-2 h-5 w-5 text-emerald-600" />
                      {editingPlanId ? 'Edit Workout Plan' : 'Create Workout Plan'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Build your personalized adaptive workout plan
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetForm}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Plan Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Name *</label>
                  <Input
                    placeholder="e.g., Morning Stretch Routine"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="What is this workout plan about?"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(difficultyConfig).map(([key, config]) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setDifficulty(key)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          difficulty === key
                            ? `border-emerald-500 ${config.color} shadow-md`
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">{config.icon}</span>
                        <div className="text-left">
                          <p className="font-medium text-sm">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {key === 'beginner' ? 'Just starting out' : key === 'intermediate' ? 'Some experience' : 'Challenging workouts'}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Category Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCategory(key)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                          category === key
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-foreground hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-lg">{config.emoji}</span>
                        {config.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Estimated Duration */}
                {exercises.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800"
                  >
                    <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Estimated Duration</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{estimatedDuration} min</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{exercises.length} exercises</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {exercises.reduce((a, e) => a + e.sets, 0)} total sets
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Exercise List Builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Exercises</label>
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Exercise
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Exercise to Plan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {/* Exercise Library Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Choose from Library</label>
                            <ScrollArea className="h-48 rounded-lg border p-2">
                              <div className="space-y-3">
                                {Object.entries(exerciseLibrary).map(([group, exs]) => (
                                  <div key={group}>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                                      {group}
                                    </p>
                                    <div className="space-y-1">
                                      {exs.map((ex) => (
                                        <button
                                          key={ex.id}
                                          onClick={() => selectFromLibrary(ex.name)}
                                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                            newExerciseName === ex.name
                                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                          }`}
                                        >
                                          {ex.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>

                          {/* Or type custom name */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Or type custom exercise name</label>
                            <Input
                              placeholder="Exercise name"
                              value={newExerciseName}
                              onChange={(e) => setNewExerciseName(e.target.value)}
                            />
                          </div>

                          <Separator />

                          {/* Sets, Reps, Rest */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <label className="text-xs font-medium">Sets</label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={newSets}
                                onChange={(e) => setNewSets(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium">Reps</label>
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                value={newReps}
                                onChange={(e) => setNewReps(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium">Rest (sec)</label>
                              <Input
                                type="number"
                                min={10}
                                max={120}
                                step={5}
                                value={newRest}
                                onChange={(e) => setNewRest(Math.max(10, Math.min(120, parseInt(e.target.value) || 30)))}
                              />
                            </div>
                          </div>

                          <Button
                            onClick={addExercise}
                            disabled={!newExerciseName.trim()}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Exercise
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Current exercises list */}
                  {exercises.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No exercises added yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Click &quot;Add Exercise&quot; to start building your plan
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-2">
                        {exercises.map((exercise, index) => (
                          <motion.div
                            key={`${exercise.id}-${index}`}
                            variants={exerciseCardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
                          >
                            {/* Order indicator */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveExercise(index, 'up')}
                                disabled={index === 0}
                                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-20 transition-colors"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-xs font-bold text-muted-foreground text-center">
                                {index + 1}
                              </span>
                              <button
                                onClick={() => moveExercise(index, 'down')}
                                disabled={index === exercises.length - 1}
                                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-20 transition-colors"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Exercise info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{exercise.name}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Dumbbell className="h-3 w-3 text-emerald-500" />
                                  {exercise.sets} × {exercise.reps}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Timer className="h-3 w-3 text-teal-500" />
                                  {exercise.rest}s rest
                                </span>
                              </div>
                            </div>

                            {/* Remove button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExercise(index)}
                              className="shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>
                  )}
                </div>

                {/* Validation Warning */}
                {planName.trim() && exercises.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Add at least one exercise to save your plan
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="sm:flex-1 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!planName.trim() || exercises.length === 0}
                    onClick={() => savePlan('draft')}
                    className="sm:flex-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save as Draft
                  </Button>
                  <Button
                    disabled={!planName.trim() || exercises.length === 0}
                    onClick={() => savePlan('active')}
                    className="sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ==================== QUICK PLAN TEMPLATES ==================== */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <Sparkles className="inline-block mr-2 h-7 w-7 text-teal-600" />
            Quick Plan Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Start with a pre-built template and customize it to your needs
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickTemplates.map((template) => {
            const diffConfig = difficultyConfig[template.difficulty];
            const catConfig = categoryConfig[template.category];
            const templateDuration = calculateDuration(template.exercises);

            return (
              <motion.div
                key={template.id}
                variants={cardVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">
                        {template.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs px-2 py-0.5 ${diffConfig.color}`}
                      >
                        {diffConfig.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {/* Template Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <Badge variant="secondary" className="text-xs gap-1">
                        {catConfig?.emoji} {catConfig?.label}
                      </Badge>
                      <span className="inline-flex items-center gap-1">
                        <Dumbbell className="h-3 w-3 text-emerald-500" />
                        {template.exercises.length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-teal-500" />
                        {templateDuration} min
                      </span>
                    </div>

                    {/* Preview exercises */}
                    <div className="space-y-1 mb-4 flex-1">
                      {template.exercises.slice(0, 3).map((ex, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground truncate">
                          <span className="text-emerald-500 mr-1">•</span>
                          {ex.name} ({ex.sets}×{ex.reps})
                        </p>
                      ))}
                      {template.exercises.length > 3 && (
                        <p className="text-xs text-muted-foreground/60">
                          +{template.exercises.length - 3} more exercises
                        </p>
                      )}
                    </div>

                    {/* Use Template Button */}
                    <Button
                      onClick={() => applyTemplate(template)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2"
                      size="sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
