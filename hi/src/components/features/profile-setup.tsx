'use client';

/**
 * Profile Setup — Clinical Aurora redesign (design/features.md §11).
 *
 * 4-step dialog wizard (About you → Your journey → Physical stats →
 * Diet & safety) plus a completion step. All Zustand store contracts and
 * persistence behavior are preserved exactly (userName, userProfile fields,
 * profileSetupComplete/Dismissed/Open, auto-open on first visit, dismissal
 * tracking, athlete-category conditional). Styling, step transitions
 * (x ±32px / 280ms, opacity-only when reduced), and completion treatment
 * (one success pulse; confetti only with full motion) follow the spec.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReduced, EASE } from '@/components/ui/aurora';
import { cn } from '@/lib/utils';
import {
  User,
  HeartPulse,
  Accessibility,
  Dumbbell,
  Apple,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Award,
} from 'lucide-react';

// ===== Constants =====
const AVATAR_EMOJIS = [
  '💪', '🏋️', '🧘', '🎯', '🔥', '⚡',
  '🌟', '🦾', '🏆', '💪🏽', '🤸', '🧠',
  '❤️', '🦿', '🦽', '🛡️', '🎖️', '🏅',
];

const DISABILITY_OPTIONS = [
  { id: 'visual', label: 'Visual Impairment', emoji: '👁️' },
  { id: 'hearing', label: 'Hearing Impairment', emoji: '👂' },
  { id: 'mobility-wheelchair', label: 'Mobility Impairment (Wheelchair)', emoji: '♿' },
  { id: 'lower-limb', label: 'Lower Limb Amputation', emoji: '🦿' },
  { id: 'upper-limb', label: 'Upper Limb Amputation', emoji: '🦾' },
  { id: 'combat-injury', label: 'Combat Injury', emoji: '🎖️' },
  { id: 'spinal-cord', label: 'Spinal Cord Injury', emoji: '🦴' },
  { id: 'cerebral-palsy', label: 'Cerebral Palsy', emoji: '🧠' },
  { id: 'autism', label: 'Autism Spectrum', emoji: '🌈' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

const USER_TYPES = [
  { id: 'soldier', label: 'Injured Soldier / Veteran', emoji: '🎖️' },
  { id: 'paralympic', label: 'Paralympic Athlete', emoji: '🏅' },
  { id: 'disability', label: 'Person with Disability', emoji: '♿' },
  { id: 'rehabilitation', label: 'Rehabilitation Patient', emoji: '🏥' },
];

const INJURY_TYPES = [
  'Combat injury - right leg',
  'Combat injury - left leg',
  'Combat injury - right arm',
  'Combat injury - left arm',
  'Road accident - spinal',
  'Road accident - limb',
  'Sports injury - knee',
  'Sports injury - shoulder',
  'Workplace injury',
  'Congenital condition',
  'Progressive condition',
  'Post-surgery recovery',
  'Other',
];

const TARGET_GOALS = [
  'Improve mobility',
  'Build strength',
  'Lose weight',
  'Pain management',
  'Prepare for competition',
  'Post-surgery recovery',
  'Increase flexibility',
  'Mental wellness',
  'General fitness',
  'Rehabilitation',
];

const DIET_PREFERENCES = [
  'No preference',
  'High protein',
  'Low carb',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Mediterranean',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Kosher',
];

const ALLERGY_OPTIONS = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish',
  'Dairy', 'Eggs', 'Wheat', 'Soy',
  'Gluten', 'Lactose', 'Sesame', 'Mustard',
];

const STEP_INFO = [
  { icon: User, label: 'About you' },
  { icon: Accessibility, label: 'Your journey' },
  { icon: Dumbbell, label: 'Physical stats' },
  { icon: Apple, label: 'Diet & safety' },
];

// ===== Confetti (full motion only) =====
function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    'bg-primary', 'bg-secondary', 'bg-accent',
    'bg-success', 'bg-info', 'bg-warning',
  ];
  const color = colors[index % colors.length];
  const startX = 20 + (index * 37) % 60;
  const drift = ((index * 53) % 30) - 15;
  const delay = (index % 8) * 0.06;

  return (
    <motion.div
      className={cn('absolute h-2 w-2 rounded-full', color)}
      style={{ left: `${startX}%`, top: '30%' }}
      initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
      animate={{
        y: [0, 200 + ((index * 41) % 100)],
        x: [0, drift],
        opacity: [1, 0],
        scale: [1, 0.3],
        rotate: [0, 360],
      }}
      transition={{ duration: 1.5 + (index % 5) * 0.2, delay, ease: 'easeOut' }}
    />
  );
}

// ===== Main Component =====
export default function ProfileSetup() {
  const {
    userName,
    setUserName,
    userProfile,
    setUserProfile,
    profileSetupComplete,
    setProfileSetupComplete,
    profileSetupOpen,
    setProfileSetupOpen,
    profileSetupDismissed,
    setProfileSetupDismissed,
  } = useAppStore();
  const reduced = useReduced();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-open on first visit — but not if the user already dismissed it once
  // (B-05). It stays reachable from the header avatar at any time.
  useEffect(() => {
    if (!profileSetupComplete && !profileSetupDismissed) {
      const timer = setTimeout(() => setProfileSetupOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Closing the dialog without completing the wizard counts as a dismissal:
  // remember it so the dialog stops re-nagging on every reload.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !useAppStore.getState().profileSetupComplete) {
        setProfileSetupDismissed(true);
      }
      setProfileSetupOpen(open);
    },
    [setProfileSetupDismissed, setProfileSetupOpen]
  );

  // Local form state
  const [localName, setLocalName] = useState(userName || '');
  const [localAge, setLocalAge] = useState(userProfile.age ? String(userProfile.age) : '');
  const [localAvatarEmoji, setLocalAvatarEmoji] = useState(userProfile.avatarEmoji || '💪');
  const [localUserType, setLocalUserType] = useState(userProfile.userType || '');
  const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>(
    userProfile.disability ? userProfile.disability.split(', ').filter(Boolean) : []
  );
  const [localInjuryType, setLocalInjuryType] = useState(userProfile.injuryType || '');
  const [localWeight, setLocalWeight] = useState(userProfile.weight ? String(userProfile.weight) : '');
  const [localHeight, setLocalHeight] = useState(userProfile.height ? String(userProfile.height) : '');
  const [localTargetGoals, setLocalTargetGoals] = useState(userProfile.targetGoals || '');
  const [localDietPreference, setLocalDietPreference] = useState(userProfile.dietPreference || '');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    userProfile.allergies ? userProfile.allergies.split(', ').filter(Boolean) : []
  );
  const [localEmergencyContact, setLocalEmergencyContact] = useState(userProfile.emergencyContact || '');

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleComplete = useCallback(() => {
    // Save all data to store
    setUserName(localName);
    setUserProfile({
      age: Number(localAge) || 0,
      avatarEmoji: localAvatarEmoji,
      userType: localUserType,
      disability: selectedDisabilities.join(', '),
      injuryType: localInjuryType,
      weight: Number(localWeight) || 0,
      height: Number(localHeight) || 0,
      targetGoals: localTargetGoals,
      dietPreference: localDietPreference,
      allergies: selectedAllergies.join(', '),
      emergencyContact: localEmergencyContact,
    });
    setProfileSetupComplete(true);
    setDirection(1);
    setStep(4);
    setShowConfetti(true);

    // Auto-close after celebration
    setTimeout(() => {
      setShowConfetti(false);
      setProfileSetupOpen(false);
    }, 3500);
  }, [
    localName, localAge, localAvatarEmoji, localUserType,
    selectedDisabilities, localInjuryType, localWeight, localHeight,
    localTargetGoals, localDietPreference, selectedAllergies,
    localEmergencyContact, setUserName, setUserProfile, setProfileSetupComplete,
    setProfileSetupOpen,
  ]);

  const toggleDisability = useCallback((id: string) => {
    setSelectedDisabilities((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }, []);

  const toggleAllergy = useCallback((item: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  }, []);

  // Step transition: x ±32px over 280ms; opacity-only when reduced (§11.5)
  const slideVariants = {
    enter: (dir: number) =>
      reduced ? { opacity: 0 } : { x: dir > 0 ? 32 : -32, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: (dir: number) =>
      reduced ? { opacity: 0 } : { x: dir > 0 ? -32 : 32, opacity: 0 },
  };
  const stepTransition = reduced
    ? { duration: 0.14, ease: 'linear' as const }
    : { duration: 0.28, ease: EASE.careOut };

  return (
    <Dialog open={profileSetupOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="glass-overlay max-h-[90vh] w-[calc(100%-2rem)] max-w-[760px] gap-0 overflow-y-auto rounded-[28px] p-0"
        showCloseButton={!showConfetti}
        aria-describedby={undefined}
      >
        {/* Sticky header: step icon, title, 4-step progress */}
        <div className="sticky top-0 z-10 border-b border-border bg-[color-mix(in_srgb,var(--surface-overlay)_92%,transparent)] px-6 py-4 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              {step < 4 ? (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    {(() => {
                      const StepIcon = STEP_INFO[step].icon;
                      return <StepIcon className="h-5 w-5" aria-hidden="true" />;
                    })()}
                  </span>
                  <span className="font-display">{STEP_INFO[step].label}</span>
                </>
              ) : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Award className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display">All done!</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-foreground-muted">
            A few choices help AdaptiFit adapt safely.
          </p>

          {/* Progress nodes: 36px, completed check, current ring, animated rail */}
          <div className="mt-3 flex items-center justify-center gap-1" aria-hidden="true">
            {STEP_INFO.map((s, i) => {
              const isActive = i === step;
              const isCompleted = i < step || step === 4;
              return (
                <div key={s.label} className="flex items-center">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      if (isCompleted && i < step) {
                        setDirection(-1);
                        setStep(i);
                      }
                    }}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                          ? 'bg-primary-soft text-primary ring-2 ring-primary'
                          : 'bg-surface-raised text-foreground-subtle',
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                  </button>
                  {i < STEP_INFO.length - 1 && (
                    <div className="mx-1 h-0.5 w-8 overflow-hidden rounded-full bg-surface-raised">
                      <motion.div
                        className="h-full bg-primary"
                        initial={false}
                        animate={{ width: i < step || step === 4 ? '100%' : '0%' }}
                        transition={reduced ? { duration: 0 } : { duration: 0.24 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="relative min-h-[400px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ===== STEP 0: About you ===== */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="space-y-6 p-6"
              >
                <div className="mb-2 text-center">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Tell us about yourself
                  </h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    We&apos;ll personalize your experience based on this info
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-sm font-semibold">
                    Your Name
                  </Label>
                  <Input
                    id="profile-name"
                    placeholder="Enter your name"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="h-12 rounded-[14px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-age" className="text-sm font-semibold">
                    Age
                  </Label>
                  <Input
                    id="profile-age"
                    type="number"
                    placeholder="Enter your age"
                    value={localAge}
                    onChange={(e) => setLocalAge(e.target.value)}
                    className="h-12 rounded-[14px]"
                    min={1}
                    max={120}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Choose Your Avatar</Label>
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
                    {AVATAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`Select ${emoji} as avatar`}
                        aria-pressed={localAvatarEmoji === emoji}
                        onClick={() => setLocalAvatarEmoji(emoji)}
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl transition-colors',
                          localAvatarEmoji === emoji
                            ? 'border-primary bg-primary-soft'
                            : 'border-transparent bg-surface-raised hover:border-border-strong',
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-foreground-muted">Selected:</span>
                    <span className="inline-flex items-center rounded-full bg-secondary-soft px-3 py-1 text-sm font-semibold text-secondary">
                      {localAvatarEmoji} {localName || 'You'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== STEP 1: Your journey ===== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="space-y-6 p-6"
              >
                <div className="mb-2 text-center">
                  <h3 className="font-display text-xl font-bold text-foreground">Your Journey</h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Help us understand your unique needs
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">I am a...</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {USER_TYPES.map((ut) => {
                      const isSelected = localUserType === ut.id;
                      return (
                        <button
                          key={ut.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setLocalUserType(ut.id)}
                          className={cn(
                            'relative flex min-h-[56px] items-center gap-3 rounded-[14px] border-2 p-4 text-left transition-colors',
                            isSelected
                              ? 'border-primary bg-primary-soft'
                              : 'border-border bg-surface hover:bg-surface-raised',
                          )}
                        >
                          <span className="text-2xl" aria-hidden="true">{ut.emoji}</span>
                          <span className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                            {ut.label}
                          </span>
                          {isSelected && (
                            <Check className="ml-auto h-5 w-5 text-primary" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Condition / Disability Type
                    <span className="ml-1 font-normal text-foreground-subtle">(select all that apply)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DISABILITY_OPTIONS.map((dis) => {
                      const isActive = selectedDisabilities.includes(dis.id);
                      return (
                        <button
                          key={dis.id}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => toggleDisability(dis.id)}
                          className={cn(
                            'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'border-primary bg-primary-soft text-primary'
                              : 'border-border bg-surface text-foreground-muted hover:bg-surface-raised',
                          )}
                        >
                          <span aria-hidden="true">{dis.emoji}</span>
                          <span>{dis.label}</span>
                          {isActive && <Check className="ml-0.5 h-3.5 w-3.5" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Injury Type</Label>
                  <Select value={localInjuryType} onValueChange={setLocalInjuryType}>
                    <SelectTrigger className="h-12 w-full rounded-[14px]">
                      <SelectValue placeholder="Select injury type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INJURY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(localUserType === 'paralympic' || localUserType === 'soldier') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-semibold">Athlete Category</Label>
                    <Select
                      value={userProfile.athleteCategory}
                      onValueChange={(val) => setUserProfile({ athleteCategory: val })}
                    >
                      <SelectTrigger className="h-12 w-full rounded-[14px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paralympic Swimming">Paralympic Swimming</SelectItem>
                        <SelectItem value="Wheelchair Basketball">Wheelchair Basketball</SelectItem>
                        <SelectItem value="Wheelchair Racing">Wheelchair Racing</SelectItem>
                        <SelectItem value="Para Powerlifting">Para Powerlifting</SelectItem>
                        <SelectItem value="Blind Football">Blind Football</SelectItem>
                        <SelectItem value="Sitting Volleyball">Sitting Volleyball</SelectItem>
                        <SelectItem value="Para Archery">Para Archery</SelectItem>
                        <SelectItem value="Adaptive Rowing">Adaptive Rowing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ===== STEP 2: Physical stats ===== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="space-y-6 p-6"
              >
                <div className="mb-2 text-center">
                  <h3 className="font-display text-xl font-bold text-foreground">Physical Stats</h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Help us tailor exercises and nutrition for you
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-weight" className="text-sm font-semibold">
                      Weight (kg)
                    </Label>
                    <Input
                      id="profile-weight"
                      type="number"
                      placeholder="e.g., 75"
                      value={localWeight}
                      onChange={(e) => setLocalWeight(e.target.value)}
                      className="h-12 rounded-[14px]"
                      min={20}
                      max={300}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-height" className="text-sm font-semibold">
                      Height (cm)
                    </Label>
                    <Input
                      id="profile-height"
                      type="number"
                      placeholder="e.g., 178"
                      value={localHeight}
                      onChange={(e) => setLocalHeight(e.target.value)}
                      className="h-12 rounded-[14px]"
                      min={50}
                      max={250}
                    />
                  </div>
                </div>

                {localWeight && localHeight && Number(localHeight) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3 rounded-[14px] bg-primary-soft p-4">
                      <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          BMI: {(Number(localWeight) / (Number(localHeight) / 100) ** 2).toFixed(1)}
                        </p>
                        <p className="text-xs text-primary/80">
                          {(() => {
                            const bmi = Number(localWeight) / (Number(localHeight) / 100) ** 2;
                            if (bmi < 18.5) return 'Underweight';
                            if (bmi < 25) return 'Normal weight';
                            if (bmi < 30) return 'Overweight';
                            return 'Obese';
                          })()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    What are your primary goals?
                    <span className="ml-1 font-normal text-foreground-subtle">(select one)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TARGET_GOALS.map((goal) => {
                      const isSelected = localTargetGoals === goal;
                      return (
                        <button
                          key={goal}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setLocalTargetGoals(goal)}
                          className={cn(
                            'flex min-h-11 flex-col items-center justify-center gap-1 rounded-[14px] border-2 p-3 text-center text-sm font-medium transition-colors',
                            isSelected
                              ? 'border-accent bg-accent-soft text-accent'
                              : 'border-transparent bg-surface-raised text-foreground-muted hover:border-border-strong',
                          )}
                        >
                          <Dumbbell className="h-4 w-4" aria-hidden="true" />
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== STEP 3: Diet & safety ===== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={stepTransition}
                className="space-y-6 p-6"
              >
                <div className="mb-2 text-center">
                  <h3 className="font-display text-xl font-bold text-foreground">Diet &amp; Safety</h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    We&apos;ll customize meal plans and safety alerts for you
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Diet Preference</Label>
                  <Select value={localDietPreference} onValueChange={setLocalDietPreference}>
                    <SelectTrigger className="h-12 w-full rounded-[14px]">
                      <SelectValue placeholder="Select diet preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIET_PREFERENCES.map((diet) => (
                        <SelectItem key={diet} value={diet}>
                          {diet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    Food Allergies
                    <span className="ml-1 font-normal text-foreground-subtle">(select all that apply)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ALLERGY_OPTIONS.map((allergy) => {
                      const isChecked = selectedAllergies.includes(allergy);
                      return (
                        <label
                          key={allergy}
                          className={cn(
                            'flex min-h-11 cursor-pointer items-center gap-2 rounded-[14px] border p-3 text-sm transition-colors',
                            isChecked
                              ? 'border-danger/50 bg-danger-soft text-danger'
                              : 'border-transparent bg-surface-raised text-foreground-muted hover:border-border-strong',
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleAllergy(allergy)}
                          />
                          <span className={isChecked ? 'font-medium' : ''}>{allergy}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-contact" className="text-sm font-semibold">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergency-contact"
                    placeholder="Phone number or name + number"
                    value={localEmergencyContact}
                    onChange={(e) => setLocalEmergencyContact(e.target.value)}
                    className="h-12 rounded-[14px]"
                  />
                  <p className="text-xs text-foreground-subtle">
                    This will be used only in case of emergencies during your workout sessions
                  </p>
                </div>
              </motion.div>
            )}

            {/* ===== COMPLETION STEP ===== */}
            {step === 4 && (
              <motion.div
                key="step-complete"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={
                  reduced
                    ? { opacity: 1, transition: { duration: 0.14 } }
                    : { scale: [0.96, 1.025, 1], opacity: 1, transition: { duration: 0.56, times: [0, 0.58, 1], ease: EASE.careOut } }
                }
                className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden p-6"
              >
                {/* Gentle radial success glow */}
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden="true"
                  style={{
                    background:
                      'radial-gradient(420px 320px at 50% 30%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)',
                  }}
                />

                {/* Confetti only when full motion is enabled (§11.5) */}
                {showConfetti && !reduced && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <ConfettiPiece key={i} index={i} />
                    ))}
                  </div>
                )}

                <div className="relative z-10 space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft ring-4 ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]">
                    <span className="text-4xl" aria-hidden="true">{localAvatarEmoji}</span>
                  </div>

                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Welcome, {localName || 'friend'}!
                  </h2>

                  <p className="mx-auto max-w-md text-foreground-muted">
                    Your personalized experience is ready. You can change any of this later.
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {selectedDisabilities.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                        <Accessibility className="h-3 w-3" aria-hidden="true" />
                        {selectedDisabilities.length} condition{selectedDisabilities.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {localTargetGoals && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                        <Dumbbell className="h-3 w-3" aria-hidden="true" />
                        {localTargetGoals}
                      </span>
                    )}
                    {localDietPreference && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-secondary">
                        <Apple className="h-3 w-3" aria-hidden="true" />
                        {localDietPreference}
                      </span>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="btn-aurora-primary h-12 rounded-[14px] px-8 text-sm font-semibold"
                      onClick={() => setProfileSetupOpen(false)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                      Start my journey
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky footer: Back / step count / Next */}
        {step < 4 && (
          <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-[color-mix(in_srgb,var(--surface-overlay)_92%,transparent)] px-6 py-4 backdrop-blur-xl">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={step === 0}
              className="h-12 gap-1 rounded-[14px]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>

            <div className="text-xs text-foreground-subtle">Step {step + 1} of 4</div>

            {step < 3 ? (
              <Button
                onClick={goNext}
                className="btn-aurora-primary h-12 gap-1 rounded-[14px] px-5"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="btn-aurora-primary h-12 gap-1 rounded-[14px] px-5"
              >
                Complete
                <Check className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
