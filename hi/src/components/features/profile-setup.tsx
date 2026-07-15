'use client';

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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Heart,
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
  {
    id: 'soldier',
    label: 'Injured Soldier / Veteran',
    emoji: '🎖️',
    gradient: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/50',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-950/50',
    ring: 'ring-amber-500',
  },
  {
    id: 'paralympic',
    label: 'Paralympic Athlete',
    emoji: '🏅',
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
    ring: 'ring-emerald-500',
  },
  {
    id: 'disability',
    label: 'Person with Disability',
    emoji: '♿',
    gradient: 'from-cyan-500 to-sky-600',
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    hoverBg: 'hover:bg-cyan-100 dark:hover:bg-cyan-950/50',
    ring: 'ring-cyan-500',
  },
  {
    id: 'rehabilitation',
    label: 'Rehabilitation Patient',
    emoji: '🏥',
    gradient: 'from-rose-500 to-pink-600',
    border: 'border-rose-500/50',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-950/50',
    ring: 'ring-rose-500',
  },
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
  { icon: User, label: 'Personal Info', color: 'emerald' },
  { icon: Accessibility, label: 'Condition', color: 'cyan' },
  { icon: Dumbbell, label: 'Physical Stats', color: 'amber' },
  { icon: Apple, label: 'Diet & Allergies', color: 'rose' },
];

// ===== Sparkle Component =====
function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={style}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      <Sparkles className="w-5 h-5 text-yellow-400" />
    </motion.div>
  );
}

// ===== Confetti Component =====
function ConfettiPiece({ index }: { index: number }) {
  const colors = [
    'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400',
    'bg-amber-400', 'bg-rose-400', 'bg-violet-400',
    'bg-pink-400', 'bg-yellow-400',
  ];
  const color = colors[index % colors.length];
  const startX = 20 + Math.random() * 60;
  const drift = (Math.random() - 0.5) * 30;
  const delay = Math.random() * 0.5;

  return (
    <motion.div
      className={`absolute w-2 h-2 rounded-full ${color}`}
      style={{ left: `${startX}%`, top: '30%' }}
      initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
      animate={{
        y: [0, 200 + Math.random() * 100],
        x: [0, drift],
        opacity: [1, 0],
        scale: [1, 0.3],
        rotate: [0, 360],
      }}
      transition={{ duration: 1.5 + Math.random(), delay, ease: 'easeOut' }}
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
  } = useAppStore();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-open on first visit
  useEffect(() => {
    if (!profileSetupComplete) {
      const timer = setTimeout(() => setProfileSetupOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  // Sparkle positions for completion
  const sparklePositions = [
    { top: '10%', left: '15%' },
    { top: '5%', left: '50%' },
    { top: '15%', right: '15%' },
    { top: '40%', left: '8%' },
    { top: '35%', right: '10%' },
    { top: '60%', left: '20%' },
    { top: '55%', right: '18%' },
    { bottom: '25%', left: '12%' },
    { bottom: '20%', right: '15%' },
  ];

  return (
    <Dialog open={profileSetupOpen} onOpenChange={setProfileSetupOpen}>
      <DialogContent
        className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto p-0 gap-0"
        showCloseButton={!showConfetti}
        aria-describedby={undefined}
      >
        {/* Progress Indicator */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {step < 4 ? (
                <>
                  {(() => {
                    const StepIcon = STEP_INFO[step].icon;
                    return <StepIcon className="w-5 h-5 text-emerald-500" />;
                  })()}
                  <span>{STEP_INFO[step].label}</span>
                </>
              ) : (
                <>
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>All Done!</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {STEP_INFO.map((s, i) => {
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <div key={s.label} className="flex items-center">
                  <motion.div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300 cursor-pointer
                      ${isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : isActive
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isCompleted) {
                        setDirection(i < step ? -1 : 1);
                        setStep(i);
                      }
                    }}
                    layout
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </motion.div>
                  {i < STEP_INFO.length - 1 && (
                    <div className="w-8 h-0.5 mx-1">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ backgroundColor: 'oklch(0.97 0 0)' }}
                        animate={{
                          backgroundColor: isCompleted
                            ? '#10b981'
                            : 'oklch(0.97 0 0)',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="relative overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ===== STEP 0: Personal Info ===== */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-6 space-y-6"
              >
                <div className="text-center mb-2">
                  <h3 className="text-xl font-bold gradient-text">Tell us about yourself</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We&apos;ll personalize your experience based on this info
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-sm font-medium">
                    Your Name
                  </Label>
                  <Input
                    id="profile-name"
                    placeholder="Enter your name"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="profile-age" className="text-sm font-medium">
                    Age
                  </Label>
                  <Input
                    id="profile-age"
                    type="number"
                    placeholder="Enter your age"
                    value={localAge}
                    onChange={(e) => setLocalAge(e.target.value)}
                    className="h-11"
                    min={1}
                    max={120}
                  />
                </div>

                {/* Avatar Emoji */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Choose Your Avatar</Label>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                    {AVATAR_EMOJIS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        type="button"
                        className={`
                          w-11 h-11 rounded-xl flex items-center justify-center text-xl
                          transition-all duration-200 border-2
                          ${localAvatarEmoji === emoji
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/20 scale-110'
                            : 'border-transparent bg-muted/50 hover:bg-muted hover:border-emerald-500/30'
                          }
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setLocalAvatarEmoji(emoji)}
                        aria-label={`Select ${emoji} as avatar`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">Selected:</span>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {localAvatarEmoji} {localName || 'You'}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== STEP 1: Condition/Disability ===== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-6 space-y-6"
              >
                <div className="text-center mb-2">
                  <h3 className="text-xl font-bold gradient-text">Your Journey</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help us understand your unique needs
                  </p>
                </div>

                {/* User Type Selector */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">I am a...</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {USER_TYPES.map((ut) => {
                      const isSelected = localUserType === ut.id;
                      return (
                        <motion.button
                          key={ut.id}
                          type="button"
                          className={`
                            relative p-4 rounded-xl border-2 text-left transition-all duration-200
                            ${ut.bg} ${ut.hoverBg}
                            ${isSelected
                              ? `${ut.border} ring-2 ${ut.ring}/30 shadow-lg`
                              : 'border-border hover:border-emerald-500/30'
                            }
                          `}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setLocalUserType(ut.id)}
                          aria-pressed={isSelected}
                          role="button"
                        >
                          {/* Gradient border overlay */}
                          {isSelected && (
                            <motion.div
                              className={`absolute inset-0 rounded-xl bg-gradient-to-br ${ut.gradient} opacity-10`}
                              layoutId="userTypeHighlight"
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          <div className="relative flex items-center gap-3">
                            <span className="text-2xl">{ut.emoji}</span>
                            <span className="font-semibold text-sm">{ut.label}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto"
                              >
                                <Check className="w-5 h-5 text-emerald-500" />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Disability Type - Multi-select Pills */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Condition / Disability Type
                    <span className="text-muted-foreground font-normal ml-1">(select all that apply)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DISABILITY_OPTIONS.map((dis) => {
                      const isActive = selectedDisabilities.includes(dis.id);
                      return (
                        <motion.button
                          key={dis.id}
                          type="button"
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                            font-medium transition-all duration-200 border
                            ${isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-sm'
                              : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-emerald-500/30'
                            }
                          `}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleDisability(dis.id)}
                          aria-pressed={isActive}
                        >
                          <span>{dis.emoji}</span>
                          <span>{dis.label}</span>
                          {isActive && <Check className="w-3 h-3 ml-0.5" />}
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedDisabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedDisabilities.map((id) => {
                        const dis = DISABILITY_OPTIONS.find((d) => d.id === id);
                        return dis ? (
                          <Badge key={id} variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            {dis.emoji} {dis.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Injury Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Injury Type</Label>
                  <Select value={localInjuryType} onValueChange={setLocalInjuryType}>
                    <SelectTrigger className="w-full h-11">
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

                {/* Athlete Category (conditional based on user type) */}
                {(localUserType === 'paralympic' || localUserType === 'soldier') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-medium">Athlete Category</Label>
                    <Select
                      value={userProfile.athleteCategory}
                      onValueChange={(val) => setUserProfile({ athleteCategory: val })}
                    >
                      <SelectTrigger className="w-full h-11">
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

            {/* ===== STEP 2: Physical Stats ===== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-6 space-y-6"
              >
                <div className="text-center mb-2">
                  <h3 className="text-xl font-bold gradient-text">Physical Stats</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help us tailor exercises and nutrition for you
                  </p>
                </div>

                {/* Weight & Height - Side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-weight" className="text-sm font-medium">
                      Weight (kg)
                    </Label>
                    <Input
                      id="profile-weight"
                      type="number"
                      placeholder="e.g., 75"
                      value={localWeight}
                      onChange={(e) => setLocalWeight(e.target.value)}
                      className="h-11"
                      min={20}
                      max={300}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-height" className="text-sm font-medium">
                      Height (cm)
                    </Label>
                    <Input
                      id="profile-height"
                      type="number"
                      placeholder="e.g., 178"
                      value={localHeight}
                      onChange={(e) => setLocalHeight(e.target.value)}
                      className="h-11"
                      min={50}
                      max={250}
                    />
                  </div>
                </div>

                {/* BMI Preview */}
                {localWeight && localHeight && Number(localHeight) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-medium">
                            BMI: {(
                              Number(localWeight) /
                              ((Number(localHeight) / 100) ** 2)
                            ).toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const bmi =
                                Number(localWeight) /
                                ((Number(localHeight) / 100) ** 2);
                              if (bmi < 18.5) return 'Underweight';
                              if (bmi < 25) return 'Normal weight';
                              if (bmi < 30) return 'Overweight';
                              return 'Obese';
                            })()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Target Goals */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    What are your primary goals?
                    <span className="text-muted-foreground font-normal ml-1">(select one)</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TARGET_GOALS.map((goal) => {
                      const isSelected = localTargetGoals === goal;
                      return (
                        <motion.button
                          key={goal}
                          type="button"
                          className={`
                            p-3 rounded-xl text-sm font-medium text-center transition-all duration-200
                            border-2 cursor-pointer
                            ${isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                              : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:border-amber-500/30'
                            }
                          `}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setLocalTargetGoals(goal)}
                          aria-pressed={isSelected}
                        >
                          <Dumbbell className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                          {goal}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== STEP 3: Diet & Allergies ===== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-6 space-y-6"
              >
                <div className="text-center mb-2">
                  <h3 className="text-xl font-bold gradient-text">Diet & Allergies</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We&apos;ll customize meal plans and safety alerts for you
                  </p>
                </div>

                {/* Diet Preference */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Diet Preference</Label>
                  <Select value={localDietPreference} onValueChange={setLocalDietPreference}>
                    <SelectTrigger className="w-full h-11">
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

                {/* Allergies - Multi-select with Checkboxes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Food Allergies
                    <span className="text-muted-foreground font-normal ml-1">(select all that apply)</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALLERGY_OPTIONS.map((allergy) => {
                      const isChecked = selectedAllergies.includes(allergy);
                      return (
                        <label
                          key={allergy}
                          className={`
                            flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer
                            transition-all duration-200 text-sm
                            ${isChecked
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700'
                              : 'bg-muted/20 border-transparent hover:bg-muted/40'
                            }
                          `}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleAllergy(allergy)}
                            className={isChecked ? 'border-rose-500 data-[state=checked]:bg-rose-500' : ''}
                          />
                          <span className={isChecked ? 'text-rose-700 dark:text-rose-300 font-medium' : 'text-muted-foreground'}>
                            {allergy}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAllergies.map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                          ⚠️ {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="space-y-2">
                  <Label htmlFor="emergency-contact" className="text-sm font-medium">
                    Emergency Contact
                  </Label>
                  <Input
                    id="emergency-contact"
                    placeholder="Phone number or name + number"
                    value={localEmergencyContact}
                    onChange={(e) => setLocalEmergencyContact(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used only in case of emergencies during your workout sessions
                  </p>
                </div>
              </motion.div>
            )}

            {/* ===== COMPLETION STEP ===== */}
            {step === 4 && (
              <motion.div
                key="step-complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative p-6 min-h-[400px] flex flex-col items-center justify-center overflow-hidden"
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent" />

                {/* Confetti */}
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <ConfettiPiece key={i} index={i} />
                    ))}
                  </div>
                )}

                {/* Sparkles */}
                {sparklePositions.map((pos, i) => (
                  <Sparkle
                    key={i}
                    style={{
                      ...pos,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}

                {/* Content */}
                <motion.div
                  className="relative z-10 text-center space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="text-4xl">{localAvatarEmoji}</span>
                  </motion.div>

                  <motion.h2
                    className="text-2xl font-bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Welcome, {localName || 'Champion'}! 🎉
                  </motion.h2>

                  <motion.p
                    className="text-muted-foreground max-w-md mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    Your personalized fitness journey is ready. We&apos;ve tailored everything
                    to your unique needs and goals. Let&apos;s make it happen!
                  </motion.p>

                  <motion.div
                    className="flex flex-wrap gap-2 justify-center mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {selectedDisabilities.length > 0 && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                        <Accessibility className="w-3 h-3 mr-1" />
                        {selectedDisabilities.length} condition{selectedDisabilities.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {localTargetGoals && (
                      <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        <Dumbbell className="w-3 h-3 mr-1" />
                        {localTargetGoals}
                      </Badge>
                    )}
                    {localDietPreference && (
                      <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                        <Apple className="w-3 h-3 mr-1" />
                        {localDietPreference}
                      </Badge>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="pt-4"
                  >
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 px-8"
                      size="lg"
                      onClick={() => {
                        setProfileSetupOpen(false);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start My Journey
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        {step < 4 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t px-6 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="text-xs text-muted-foreground">
              Step {step + 1} of 4
            </div>

            {step < 3 ? (
              <Button
                onClick={goNext}
                className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              >
                Complete
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
