'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Dumbbell,
  Filter,
  Clock,
  Flame,
  ChevronRight,
  Heart,
  Star,
  Play,
  Pause,
  Timer,
  CheckCircle2,
  X,
  Youtube,
  Target,
  Accessibility,
  ClipboardList,
} from 'lucide-react';
import VoiceInput from '@/components/features/voice-input';
import TTSSpeaker from '@/components/features/tts-speaker';
import HealthSearch from '@/components/features/health-search';
import WorkoutPlanBuilder from '@/components/features/workout-plan-builder';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToastStore } from '@/components/features/toast-provider';
import {
  adaptiveExercises,
  exerciseCategories,
  youtubeExerciseVideos,
} from '@/lib/mock-data';

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

const difficultyDots: Record<string, string> = {
  easy: 'bg-emerald-500',
  medium: 'bg-amber-500',
  hard: 'bg-red-500',
};

const categoryColorMap: Record<string, string> = {
  adaptive: 'bg-teal-100 text-teal-700 border-teal-200',
  rehab: 'bg-rose-100 text-rose-700 border-rose-200',
  strength: 'bg-orange-100 text-orange-700 border-orange-200',
  flexibility: 'bg-violet-100 text-violet-700 border-violet-200',
  cardio: 'bg-pink-100 text-pink-700 border-pink-200',
  balance: 'bg-sky-100 text-sky-700 border-sky-200',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function ExerciseLibrary() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>('all');
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [sessionExercise, setSessionExercise] =
    useState<(typeof adaptiveExercises)[number] | null>(null);

  const filteredExercises = useMemo(() => {
    return adaptiveExercises.filter((exercise) => {
      const matchesCategory =
        activeCategory === 'all' || exercise.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.targetMuscles.some((m) =>
          m.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesDifficulty =
        difficultyFilter === 'all' || exercise.difficulty === difficultyFilter;
      return matchesCategory && matchesSearch && matchesDifficulty;
    });
  }, [activeCategory, searchQuery, difficultyFilter]);

  const handleWatchVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
    setVideoDialogOpen(true);
  };

  const extractYoutubeId = (url: string): string => {
    const match = url.match(/embed\/([\w-]+)/);
    return match ? match[1] : 'dQw4w9WgXcQ';
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <Dumbbell className="inline-block mr-2 h-7 w-7 text-emerald-600" />
            Adaptive Exercise Library
          </h2>
          <p className="text-muted-foreground mt-1">
            Personalized exercises designed for every ability level
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Accessibility className="h-3.5 w-3.5 mr-1" />
            {adaptiveExercises.length} Exercises
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises by name or muscle group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-background"
          />
        </div>
        <VoiceInput onTranscription={(text) => setSearchQuery(text)} size="md" />
      </div>

      {/* Category Filter Pills */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-md'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            All
          </button>
          {exerciseCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-md'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }`}
            >
              <span>{category.icon}</span>
              {category.label}
              <span className="ml-1 text-xs opacity-70">({category.count})</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Difficulty Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground mr-1">
          Difficulty:
        </span>
        {(['all', 'easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
          <button
            key={diff}
            onClick={() => setDifficultyFilter(diff)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
              difficultyFilter === diff
                ? diff === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-sm'
                  : diff === 'easy'
                    ? 'bg-emerald-500 text-white border-transparent shadow-sm'
                    : diff === 'medium'
                      ? 'bg-amber-500 text-white border-transparent shadow-sm'
                      : 'bg-red-500 text-white border-transparent shadow-sm'
                : 'bg-background text-foreground border-border hover:bg-accent'
            }`}
          >
            {diff !== 'all' && (
              <span
                className={`h-2 w-2 rounded-full ${difficultyFilter === diff ? 'bg-white/80' : difficultyDots[diff]}`}
              />
            )}
            {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="exercises" className="gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" />
            Exercises
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5">
            <Youtube className="h-3.5 w-3.5" />
            Video Library
          </TabsTrigger>
          <TabsTrigger value="workout-plans" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Workout Plans
          </TabsTrigger>
        </TabsList>

        {/* Exercises Tab */}
        <TabsContent value="exercises">
          {filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Dumbbell className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                No exercises found
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try adjusting your filters or search terms
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setDifficultyFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={`${activeCategory}-${difficultyFilter}-${searchQuery}`}
            >
              <AnimatePresence mode="popLayout">
                {filteredExercises.map((exercise) => (
                  <motion.div
                    key={exercise.id}
                    variants={cardVariants}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-snug">
                            {exercise.name}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${difficultyColors[exercise.difficulty]}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full mr-1 ${difficultyDots[exercise.difficulty]}`}
                            />
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        <Badge
                          variant="outline"
                          className={`w-fit text-xs mt-1 ${categoryColorMap[exercise.category] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {exerciseCategories.find((c) => c.id === exercise.category)?.icon}{' '}
                          {exerciseCategories.find((c) => c.id === exercise.category)?.label || exercise.category}
                        </Badge>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col gap-3">
                        {/* Target Muscles */}
                        <div className="flex flex-wrap gap-1.5">
                          {exercise.targetMuscles.map((muscle) => (
                            <Badge
                              key={muscle}
                              variant="secondary"
                              className="text-xs px-2 py-0.5 rounded-full"
                            >
                              <Target className="h-2.5 w-2.5 mr-0.5" />
                              {muscle}
                            </Badge>
                          ))}
                        </div>

                        {/* Description */}
                        <div className="flex items-start gap-1.5">
                          <CardDescription className="text-xs leading-relaxed line-clamp-2 flex-1">
                            {exercise.description}
                          </CardDescription>
                          <TTSSpeaker
                            text={`${exercise.name}. ${exercise.description}. Target muscles: ${exercise.targetMuscles.join(', ')}. Duration: ${exercise.duration}. Difficulty: ${exercise.difficulty}.`}
                            size="sm"
                            voice="xiaochen"
                            speed={1.0}
                          />
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                            {exercise.duration} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            {exercise.calories} cal
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            {exercise.difficulty === 'easy'
                              ? '4.8'
                              : exercise.difficulty === 'medium'
                                ? '4.6'
                                : '4.5'}
                          </span>
                        </div>

                        {/* Adaptations */}
                        {exercise.adaptations.length > 0 && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900/50">
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                              <Accessibility className="h-3 w-3" />
                              Adaptations Available
                            </p>
                            <ul className="space-y-0.5">
                              {exercise.adaptations.map((adaptation, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-emerald-600 dark:text-emerald-300/80 flex items-start gap-1"
                                >
                                  <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                                  {adaptation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto pt-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
                            onClick={() => setSessionExercise(exercise)}
                          >
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Start Exercise
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            onClick={() =>
                              handleWatchVideo(exercise.videoUrl, exercise.name)
                            }
                          >
                            <Youtube className="h-3.5 w-3.5 mr-1" />
                            Watch Video
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        {/* Video Library Tab */}
        <TabsContent value="videos">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeExerciseVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-video bg-muted overflow-hidden"
                    onClick={() =>
                      handleWatchVideo(
                        `https://www.youtube.com/embed/dQw4w9WgXcQ`,
                        video.title
                      )
                    }
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <Play className="h-5 w-5 text-white ml-0.5" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs border-0 px-1.5 py-0.5">
                      {video.duration}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{video.channel}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Play className="h-3 w-3" />
                        {video.views} views
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Workout Plans Tab */}
        <TabsContent value="workout-plans">
          <WorkoutPlanBuilder />
        </TabsContent>
      </Tabs>

      {/* YouTube Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-0" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedVideo?.title || 'Video Player'}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {selectedVideo && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`${selectedVideo.url}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Guided Exercise Session Dialog */}
      <Dialog
        open={sessionExercise !== null}
        onOpenChange={(open) => {
          if (!open) setSessionExercise(null);
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-emerald-500" />
              {sessionExercise?.name}
            </DialogTitle>
          </DialogHeader>
          {sessionExercise && (
            <GuidedSession
              key={sessionExercise.id}
              exercise={sessionExercise}
              onClose={() => setSessionExercise(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Health Search Integration */}
      <HealthSearch defaultQuery="adaptive exercises for disabilities" />
    </div>
  );
}

// Guided session shown when "Start Exercise" is pressed: a real countdown timer
// with pause/resume, accessibility adaptations, text-to-speech, and completion
// logging to /api/exercise-logs.
function GuidedSession({
  exercise,
  onClose,
}: {
  exercise: (typeof adaptiveExercises)[number];
  onClose: () => void;
}) {
  const addToast = useToastStore((s) => s.addToast);
  const totalSeconds = Math.max(1, exercise.duration) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const savedRef = useRef(false);

  const finish = useCallback(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    setRunning(false);
    setDone(true);
    const elapsedMin = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));
    void fetch('/api/exercise-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'default-user',
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        duration: elapsedMin,
        notes: 'Completed via guided session',
      }),
    }).catch(() => {
      /* logging is best-effort; the session still completes locally */
    });
    addToast({
      type: 'success',
      title: 'Exercise complete! 🎉',
      description: `${exercise.name} logged — ${elapsedMin} min. Great work!`,
    });
  }, [exercise, secondsLeft, totalSeconds, addToast]);

  useEffect(() => {
    if (!running || done) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, done]);

  useEffect(() => {
    if (secondsLeft === 0 && !done) finish();
  }, [secondsLeft, done, finish]);

  const circumference = 2 * Math.PI * 52;
  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <p className="text-sm text-muted-foreground flex-1">{exercise.description}</p>
        <TTSSpeaker
          text={`${exercise.name}. ${exercise.description}. Target muscles: ${exercise.targetMuscles.join(', ')}.`}
          size="sm"
          voice="xiaochen"
          speed={1.0}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {exercise.targetMuscles.map((m) => (
          <Badge key={m} variant="secondary" className="text-xs">
            {m}
          </Badge>
        ))}
      </div>

      <div className="relative grid place-items-center py-1">
        <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="9" className="stroke-muted" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className="stroke-emerald-500 transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
          />
        </svg>
        <div className="absolute text-center">
          {done ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          ) : (
            <>
              <div className="text-3xl font-bold tabular-nums">
                {mm}:{ss}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {running ? 'remaining' : 'paused'}
              </div>
            </>
          )}
        </div>
      </div>

      {exercise.adaptations.length > 0 && !done && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-100 dark:border-emerald-900/50">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
            <Accessibility className="h-3 w-3" />
            Adaptations
          </p>
          <ul className="space-y-0.5">
            {exercise.adaptations.map((a, i) => (
              <li
                key={i}
                className="text-xs text-emerald-600 dark:text-emerald-300/80 flex items-start gap-1"
              >
                <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {done ? (
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Nice work — session complete!
          </p>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-1.5"
            variant="secondary"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Resume
              </>
            )}
          </Button>
          <Button
            className="flex-1 gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            onClick={finish}
          >
            <CheckCircle2 className="h-4 w-4" /> Finish now
          </Button>
        </div>
      )}
    </div>
  );
}
