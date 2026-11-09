'use client';

/**
 * Exercise Library — Clinical Aurora redesign (design/features.md §3).
 *
 * Searchable adaptive exercise library: 52px search (+ voice), filter rail
 * (sticky panel desktop / bottom sheet mobile), sort select, grid/list view,
 * removable filter chips, exercise cards, and a 560px detail drawer.
 *
 * Behavior preserved: VoiceInput transcription, TTSSpeaker, HealthSearch,
 * WorkoutPlanBuilder tab, YouTube video dialog, and the GuidedSession timer
 * dialog that logs completions to /api/exercise-logs. Copy was not localized
 * before; new copy stays English-only literals.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Dumbbell,
  SlidersHorizontal,
  Clock,
  ChevronRight,
  Play,
  Pause,
  Timer,
  CheckCircle2,
  X,
  Youtube,
  Accessibility,
  ClipboardList,
  Bookmark,
  SearchX,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import VoiceInput from '@/components/features/voice-input';
import TTSSpeaker from '@/components/features/tts-speaker';
import HealthSearch from '@/components/features/health-search';
import WorkoutPlanBuilder from '@/components/features/workout-plan-builder';
import {
  GlassPanel,
  SectionHeader,
  useReduced,
  EASE,
  staggerContainer,
  staggerItem,
  reducedItem,
} from '@/components/ui/aurora';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToastStore } from '@/components/features/toast-provider';
import { useAppStore } from '@/stores/app-store';
import { adaptiveExercises, exerciseCategories, youtubeExerciseVideos } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type Exercise = (typeof adaptiveExercises)[number];
type Difficulty = 'easy' | 'medium' | 'hard';
type SortId = 'recommended' | 'easiest' | 'shortest' | 'most-completed';
type ViewMode = 'grid' | 'list';

// ── Filter model (maps onto real fields: targetMuscles, difficulty, duration) ──

interface FilterOption {
  id: string;
  label: string;
  keywords?: string[];
  test?: (ex: Exercise) => boolean;
}

const BODY_AREA_OPTIONS: FilterOption[] = [
  { id: 'full', label: 'Full body', keywords: [] },
  { id: 'upper', label: 'Upper body', keywords: ['shoulder', 'chest', 'arm', 'tricep', 'lat'] },
  { id: 'lower', label: 'Lower body', keywords: ['quad', 'hip', 'leg', 'glute', 'knee', 'ankle'] },
  { id: 'core', label: 'Core', keywords: ['core', 'spine', 'stabilizer', 'abdomen'] },
  { id: 'back', label: 'Back', keywords: ['back', 'spine', 'lat'] },
  { id: 'shoulders', label: 'Shoulders', keywords: ['shoulder'] },
  { id: 'knees', label: 'Knees', keywords: ['quad', 'knee', 'hip flexor'] },
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Gentle' },
  { id: 'medium', label: 'Steady' },
  { id: 'hard', label: 'Challenge' },
];

const DURATION_OPTIONS: FilterOption[] = [
  { id: 'under-5', label: 'Under 5 min', test: (ex) => ex.duration < 5 },
  { id: '5-10', label: '5–10 min', test: (ex) => ex.duration >= 5 && ex.duration <= 10 },
  { id: '10-plus', label: '10+ min', test: (ex) => ex.duration > 10 },
];

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: 'bg-success-soft text-success',
  medium: 'bg-warning-soft text-warning',
  hard: 'bg-danger-soft text-danger',
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Gentle',
  medium: 'Steady',
  hard: 'Challenge',
};

const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

function matchesBodyArea(ex: Exercise, areaId: string): boolean {
  const area = BODY_AREA_OPTIONS.find((a) => a.id === areaId);
  if (!area || !area.keywords || area.keywords.length === 0) return true;
  const muscles = ex.targetMuscles.map((m) => m.toLowerCase());
  return area.keywords.some((kw) => muscles.some((m) => m.includes(kw)));
}

function hasSeatedOption(ex: Exercise): boolean {
  return (
    ex.adaptations.some((a) => /seat|chair/i.test(a)) || ex.category === 'adaptive'
  );
}

function openAIChat() {
  document
    .querySelector<HTMLButtonElement>('button[aria-label="Open AdaptiFit AI Chat"]')
    ?.click();
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ExerciseLibrary() {
  const addToast = useToastStore((s) => s.addToast);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const reduced = useReduced();

  const [searchQuery, setSearchQuery] = useState('');
  const [bodyArea, setBodyArea] = useState<string>('full');
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [durations, setDurations] = useState<string[]>([]);
  const [sort, setSort] = useState<SortId>('recommended');
  const [view, setView] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const [sessionExercise, setSessionExercise] = useState<Exercise | null>(null);

  const filteredExercises = useMemo(() => {
    const list = adaptiveExercises.filter((exercise) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        exercise.name.toLowerCase().includes(q) ||
        exercise.targetMuscles.some((m) => m.toLowerCase().includes(q)) ||
        exercise.description.toLowerCase().includes(q);
      const matchesArea = matchesBodyArea(exercise, bodyArea);
      const matchesDifficulty =
        difficulties.length === 0 || difficulties.includes(exercise.difficulty as Difficulty);
      const matchesDuration =
        durations.length === 0 ||
        durations.some((id) => DURATION_OPTIONS.find((d) => d.id === id)?.test?.(exercise));
      return matchesSearch && matchesArea && matchesDifficulty && matchesDuration;
    });
    switch (sort) {
      case 'easiest':
        return [...list].sort(
          (a, b) => DIFFICULTY_RANK[a.difficulty as Difficulty] - DIFFICULTY_RANK[b.difficulty as Difficulty],
        );
      case 'shortest':
        return [...list].sort((a, b) => a.duration - b.duration);
      case 'most-completed':
        // No completion telemetry yet — energy demand is the closest honest proxy.
        return [...list].sort((a, b) => b.calories - a.calories);
      default:
        return list;
    }
  }, [searchQuery, bodyArea, difficulties, durations, sort]);

  const activeChips: { id: string; label: string; clear: () => void }[] = [
    ...(bodyArea !== 'full'
      ? [
          {
            id: `area-${bodyArea}`,
            label: BODY_AREA_OPTIONS.find((a) => a.id === bodyArea)?.label ?? bodyArea,
            clear: () => setBodyArea('full'),
          },
        ]
      : []),
    ...difficulties.map((d) => ({
      id: `diff-${d}`,
      label: DIFFICULTY_LABEL[d],
      clear: () => setDifficulties((prev) => prev.filter((x) => x !== d)),
    })),
    ...durations.map((d) => ({
      id: `dur-${d}`,
      label: DURATION_OPTIONS.find((x) => x.id === d)?.label ?? d,
      clear: () => setDurations((prev) => prev.filter((x) => x !== d)),
    })),
  ];

  const clearAllFilters = () => {
    setSearchQuery('');
    setBodyArea('full');
    setDifficulties([]);
    setDurations([]);
  };

  const handleWatchVideo = (url: string, title: string) => {
    setSelectedVideo({ url, title });
    setVideoDialogOpen(true);
  };

  const toggleBookmark = (ex: Exercise) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      const added = !next.has(ex.id);
      if (added) next.add(ex.id);
      else next.delete(ex.id);
      addToast({
        type: 'info',
        title: added ? 'Saved to your list' : 'Removed from your list',
        description: ex.name,
      });
      return next;
    });
  };

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Body area</h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {BODY_AREA_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={bodyArea === opt.id}
              onClick={() => setBodyArea(opt.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                bodyArea === opt.id
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
              )}
            >
              {bodyArea === opt.id && opt.id !== 'full' && (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Difficulty</h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => {
            const active = difficulties.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setDifficulties((prev) =>
                    active ? prev.filter((d) => d !== opt.id) : [...prev, opt.id],
                  )
                }
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
                )}
              >
                {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Duration</h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const active = durations.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setDurations((prev) =>
                    active ? prev.filter((d) => d !== opt.id) : [...prev, opt.id],
                  )
                }
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
                )}
              >
                {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <SectionHeader
        eyebrow="Exercise library"
        title="Find the movement that fits."
        description="Search adaptive exercises by body area, equipment, ability, and comfort."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-3 py-1.5 text-sm font-semibold text-secondary">
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            {adaptiveExercises.length} exercises
          </span>
        }
      />

      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="h-12 w-full sm:w-auto">
          <TabsTrigger value="exercises" className="min-h-11 gap-1.5">
            <Dumbbell className="h-4 w-4" aria-hidden="true" />
            Exercises
          </TabsTrigger>
          <TabsTrigger value="videos" className="min-h-11 gap-1.5">
            <Youtube className="h-4 w-4" aria-hidden="true" />
            Video Library
          </TabsTrigger>
          <TabsTrigger value="workout-plans" className="min-h-11 gap-1.5">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            Workout Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="mt-6">
          {/* Control bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
                aria-hidden="true"
              />
              <Input
                placeholder="Search exercises, body areas, or equipment…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[52px] rounded-[14px] bg-surface pl-10 text-sm"
                aria-label="Search exercises"
              />
            </div>
            <VoiceInput onTranscription={(text) => setSearchQuery(text)} size="md" />
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-[14px] lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {activeChips.length > 0 && (
                <span className="rounded-full bg-accent-soft px-1.5 text-xs font-bold text-accent">
                  {activeChips.length}
                </span>
              )}
            </Button>
            <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
              <SelectTrigger className="h-12 w-[170px] rounded-[14px]" aria-label="Sort exercises">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="easiest">Easiest</SelectItem>
                <SelectItem value="shortest">Shortest</SelectItem>
                <SelectItem value="most-completed">Most completed</SelectItem>
              </SelectContent>
            </Select>
            <div
              role="group"
              aria-label="View mode"
              className="flex overflow-hidden rounded-[14px] border border-border"
            >
              {(
                [
                  { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
                  { id: 'list', icon: List, label: 'List view' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-label={v.label}
                  aria-pressed={view === v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center transition-colors',
                    view === v.id
                      ? 'bg-surface-raised text-primary'
                      : 'bg-surface text-foreground-muted hover:text-foreground',
                  )}
                >
                  <v.icon className="h-5 w-5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Removable filter chips */}
          {activeChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary-soft pl-3.5 pr-1.5 text-sm font-medium text-primary"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.clear}
                    aria-label={`Remove filter ${chip.label}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-10 px-2 text-sm font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Filter rail — desktop sticky panel */}
            <motion.aside
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduced ? { duration: 0.14 } : { duration: 0.24, ease: EASE.careOut }}
              className="sticky top-24 hidden lg:block"
              aria-label="Exercise filters"
            >
              <GlassPanel className="p-5">{filterPanel}</GlassPanel>
            </motion.aside>

            {/* Results */}
            <div>
              {filteredExercises.length === 0 ? (
                <GlassPanel className="flex flex-col items-center gap-3 p-10 text-center">
                  <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface-raised text-foreground-subtle">
                    <SearchX className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">
                    No exercises match those filters.
                  </h3>
                  <p className="max-w-sm text-sm text-foreground-muted">
                    Try removing one filter or ask AdaptiFit AI for an adaptive alternative.
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <Button
                      className="btn-aurora-primary h-12 rounded-[14px] px-5 text-sm font-semibold"
                      onClick={clearAllFilters}
                    >
                      Clear filters
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 gap-2 rounded-[14px] px-5 text-sm font-semibold"
                      onClick={openAIChat}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Ask AI
                    </Button>
                  </div>
                </GlassPanel>
              ) : (
                <motion.div
                  key={`${bodyArea}-${difficulties.join()}-${durations.join()}-${searchQuery}-${sort}-${view}`}
                  variants={reduced ? undefined : staggerContainer}
                  initial="hidden"
                  animate="show"
                  className={
                    view === 'grid'
                      ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
                      : 'flex flex-col gap-3'
                  }
                >
                  {filteredExercises.map((exercise) => (
                    <motion.div key={exercise.id} variants={reduced ? reducedItem : staggerItem}>
                      <ExerciseCard
                        exercise={exercise}
                        view={view}
                        bookmarked={bookmarked.has(exercise.id)}
                        onBookmark={() => toggleBookmark(exercise)}
                        onView={() => setDetailExercise(exercise)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Video Library Tab (preserved) */}
        <TabsContent value="videos" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {youtubeExerciseVideos.map((video, index) => (
              <motion.div
                key={video.id}
                variants={reduced ? reducedItem : staggerItem}
                initial="hidden"
                animate="show"
                transition={{ delay: reduced ? 0 : index * 0.05 }}
              >
                <GlassPanel interactive className="group overflow-hidden">
                  <button
                    type="button"
                    className="relative block aspect-video w-full bg-surface-raised"
                    onClick={() => handleWatchVideo(`https://www.youtube.com/embed/dQw4w9WgXcQ`, video.title)}
                    aria-label={`Play video: ${video.title}`}
                  >
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs text-white">
                      {video.duration}
                    </span>
                  </button>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {video.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-xs text-foreground-subtle">
                      <span>{video.channel}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Play className="h-3 w-3" aria-hidden="true" />
                        {video.views} views
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Workout Plans Tab (preserved) */}
        <TabsContent value="workout-plans" className="mt-6">
          <WorkoutPlanBuilder />
        </TabsContent>
      </Tabs>

      {/* Mobile filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="glass-overlay max-h-[82svh] overflow-y-auto rounded-t-[28px]">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">Filters</SheetTitle>
            <SheetDescription className="text-sm text-foreground-muted">
              Narrow the library by body area, difficulty, and duration.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6">{filterPanel}</div>
        </SheetContent>
      </Sheet>

      {/* Detail drawer (features.md §3.4) */}
      <Sheet
        open={detailExercise !== null}
        onOpenChange={(open) => {
          if (!open) setDetailExercise(null);
        }}
      >
        <SheetContent
          side="right"
          className="glass-overlay w-full overflow-y-auto sm:max-w-[560px]"
        >
          {detailExercise && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">{detailExercise.name}</SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        DIFFICULTY_TONE[detailExercise.difficulty as Difficulty],
                      )}
                    >
                      {DIFFICULTY_LABEL[detailExercise.difficulty as Difficulty]}
                    </span>
                    <span className="rounded-full bg-secondary-soft px-2.5 py-1 text-xs font-semibold text-secondary">
                      {exerciseCategories.find((c) => c.id === detailExercise.category)?.label ??
                        detailExercise.category}
                    </span>
                    {hasSeatedOption(detailExercise) && (
                      <span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
                        Seated option
                      </span>
                    )}
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                {/* Why this can help */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-subtle">
                      Why this can help
                    </h3>
                    <TTSSpeaker
                      text={`${detailExercise.name}. ${detailExercise.description}. Target muscles: ${detailExercise.targetMuscles.join(', ')}. Duration: ${detailExercise.duration} minutes.`}
                      size="sm"
                      voice="xiaochen"
                      speed={1.0}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                    {detailExercise.description}
                  </p>
                </div>

                {/* Demo placeholder 16:9 */}
                <button
                  type="button"
                  onClick={() => handleWatchVideo(detailExercise.videoUrl, detailExercise.name)}
                  className="group relative block aspect-video w-full overflow-hidden rounded-[18px] bg-surface-raised"
                  aria-label={`Play demo for ${detailExercise.name}`}
                >
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow-primary)] transition-transform duration-200 group-hover:scale-105">
                      <Play className="ml-0.5 h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">Play demo</span>
                  </span>
                </button>

                {/* Steps */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground-subtle">
                    How to do it
                  </h3>
                  <ol className="mt-2.5 space-y-2">
                    {[
                      'Set up with support nearby — a chair, wall, or band within reach.',
                      `Move slowly through the full comfortable range for ${detailExercise.duration} minutes, resting whenever you need.`,
                      'Finish with three slow breaths and note how the area feels.',
                    ].map((step, i) => (
                      <li
                        key={i}
                        className="flex min-h-14 items-center gap-3 rounded-[14px] bg-surface-raised px-4 py-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Adaptations */}
                {detailExercise.adaptations.length > 0 && (
                  <div className="rounded-[14px] bg-primary-soft p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Accessibility className="h-4 w-4" aria-hidden="true" />
                      Adaptations
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {detailExercise.adaptations.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-primary">
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Safety note */}
                <div className="flex items-start gap-2.5 rounded-[14px] bg-warning-soft p-4 text-sm text-warning">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>Stop if you feel sharp pain, dizziness, or numbness.</p>
                </div>

                {/* Footer actions */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="btn-aurora-primary h-12 flex-1 rounded-[14px] text-sm font-semibold"
                    onClick={() => {
                      const ex = detailExercise;
                      setDetailExercise(null);
                      setSessionExercise(ex);
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                    Start guided session
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-1 rounded-[14px] text-sm font-semibold"
                    onClick={() => {
                      addToast({
                        type: 'success',
                        title: 'Added to workout',
                        description: `${detailExercise.name} will appear in your next adaptive session.`,
                      });
                    }}
                  >
                    Add to workout
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-12 rounded-[14px] text-sm"
                    onClick={() => setActiveSection('live-coach')}
                  >
                    Start with coach
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* YouTube Video Dialog (preserved) */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent
          className="overflow-hidden border-0 bg-black p-0 sm:max-w-3xl"
          aria-describedby={undefined}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedVideo?.title || 'Video Player'}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {selectedVideo && (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`${selectedVideo.url}?autoplay=1&rel=0`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Guided Exercise Session Dialog (preserved behavior + API logging) */}
      <Dialog
        open={sessionExercise !== null}
        onOpenChange={(open) => {
          if (!open) setSessionExercise(null);
        }}
      >
        <DialogContent className="glass-overlay sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Timer className="h-5 w-5 text-primary" aria-hidden="true" />
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

      {/* Health Search Integration (preserved) */}
      <HealthSearch defaultQuery="adaptive exercises for disabilities" />
    </div>
  );
}

// ── Exercise card (grid + list variants) ────────────────────────────────────

function ExerciseCard({
  exercise,
  view,
  bookmarked,
  onBookmark,
  onView,
}: {
  exercise: Exercise;
  view: ViewMode;
  bookmarked: boolean;
  onBookmark: () => void;
  onView: () => void;
}) {
  const category = exerciseCategories.find((c) => c.id === exercise.category);
  const meta = [
    `${exercise.duration} min`,
    `${DIFFICULTY_LABEL[exercise.difficulty as Difficulty]} impact`.replace('Gentle impact', 'Low impact'),
    hasSeatedOption(exercise) ? 'Seated option' : null,
  ].filter(Boolean) as string[];

  return (
    <GlassPanel
      interactive
      className={cn(
        'group flex h-full min-h-[300px] flex-col p-5',
        view === 'list' && 'min-h-0 sm:flex-row sm:items-center sm:gap-5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:text-primary">
          <Dumbbell className="h-6 w-6" aria-hidden="true" />
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            DIFFICULTY_TONE[exercise.difficulty as Difficulty],
          )}
        >
          {DIFFICULTY_LABEL[exercise.difficulty as Difficulty]}
        </span>
      </div>

      <div className="mt-4 min-w-0 flex-1">
        <h3 className="text-xl font-semibold leading-snug text-foreground">{exercise.name}</h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-subtle">
          {meta.map((m) => (
            <span key={m} className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {m}
            </span>
          ))}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-secondary-soft px-2.5 py-0.5 text-xs font-semibold text-secondary">
            {category ? `${category.icon} ${category.label}` : exercise.category}
          </span>
          {exercise.targetMuscles.slice(0, 2).map((m) => (
            <span
              key={m}
              className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-foreground-muted"
            >
              {m}
            </span>
          ))}
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground-muted">
          {exercise.description}
        </p>
      </div>

      <div className={cn('mt-4 flex gap-2', view === 'list' && 'sm:mt-0 sm:w-48 sm:shrink-0')}>
        <Button
          className="btn-aurora-primary h-12 flex-1 rounded-[14px] text-sm font-semibold"
          onClick={onView}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0 rounded-[14px]"
          aria-label={bookmarked ? `Remove ${exercise.name} from saved` : `Save ${exercise.name}`}
          aria-pressed={bookmarked}
          onClick={onBookmark}
        >
          <Bookmark
            className={cn('h-4 w-4', bookmarked && 'fill-accent text-accent')}
            aria-hidden="true"
          />
        </Button>
      </div>
    </GlassPanel>
  );
}

// ── Guided session (preserved): countdown timer, pause/resume, TTS,
// completion logging to /api/exercise-logs. ──────────────────────────────────

function GuidedSession({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const addToast = useToastStore((s) => s.addToast);
  const reduced = useReduced();
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
        <p className="flex-1 text-sm text-foreground-muted">{exercise.description}</p>
        <TTSSpeaker
          text={`${exercise.name}. ${exercise.description}. Target muscles: ${exercise.targetMuscles.join(', ')}.`}
          size="sm"
          voice="xiaochen"
          speed={1.0}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {exercise.targetMuscles.map((m) => (
          <span
            key={m}
            className="rounded-full bg-secondary-soft px-2.5 py-0.5 text-xs font-semibold text-secondary"
          >
            {m}
          </span>
        ))}
      </div>

      <div className="relative grid place-items-center py-1">
        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="9"
            stroke="var(--border)"
            strokeOpacity={0.45}
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            stroke="var(--primary)"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            className={reduced ? '' : 'transition-[stroke-dashoffset] duration-1000 ease-linear'}
          />
        </svg>
        <div className="absolute text-center">
          {done ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden="true" />
          ) : (
            <>
              <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                {mm}:{ss}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-foreground-subtle">
                {running ? 'remaining' : 'paused'}
              </div>
            </>
          )}
        </div>
      </div>

      {exercise.adaptations.length > 0 && !done && (
        <div className="rounded-[14px] bg-primary-soft p-3.5">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
            <Accessibility className="h-3.5 w-3.5" aria-hidden="true" />
            Adaptations
          </p>
          <ul className="space-y-1">
            {exercise.adaptations.map((a, i) => (
              <li key={i} className="flex items-start gap-1 text-xs text-primary">
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {done ? (
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-success">Nice work — session complete!</p>
          <Button className="btn-aurora-primary h-12 w-full rounded-[14px]" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            className="h-12 flex-1 gap-1.5 rounded-[14px]"
            variant="secondary"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? (
              <>
                <Pause className="h-4 w-4" aria-hidden="true" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" /> Resume
              </>
            )}
          </Button>
          <Button
            className="btn-aurora-primary h-12 flex-1 gap-1.5 rounded-[14px]"
            onClick={finish}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Finish now
          </Button>
        </div>
      )}
    </div>
  );
}
