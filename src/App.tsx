import { useCallback, useState } from 'react';
import type { AbilityProfile, RegenerationMode, ReplacementReason, Screen, Workout } from './types';
import { createDefaultProfile } from './data/defaults';
import { personaById } from './data/demoPersonas';
import { evaluateBadges } from './data/badges';
import { applyRegeneration, generateWorkout, replaceExercise } from './engine/workoutGenerator';
import { useProfile } from './context/ProfileContext';
import { useAccessibility } from './context/AccessibilityContext';
import { Header } from './components/Header';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { LandingScreen } from './screens/LandingScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { PlanScreen } from './screens/PlanScreen';
import { SessionScreen } from './screens/SessionScreen';
import { FeedbackScreen } from './screens/FeedbackScreen';
import type { FeedbackDraft } from './screens/FeedbackScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import type { SummaryData } from './screens/SummaryScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const today = () => new Date().toISOString().slice(0, 10);

function buildSummaryText(summary: SummaryData): string {
  const { workout, feedback } = summary;
  return [
    'Adaptive Motion Gym — Session Summary',
    `Routine: ${workout.style} (${workout.intensity})`,
    `Movement minutes: ${summary.movementMinutes}`,
    `Exercises completed: ${summary.exercisesCompleted} of ${workout.exercises.length}`,
    `Muscles trained: ${summary.musclesTargeted.join(', ') || 'gentle mobility'}`,
    `Adaptations used: ${workout.adaptationsUsed.join(', ')}`,
    `Comfort: ${feedback.comfort}/5 | Confidence: ${feedback.confidence}/5`,
    feedback.ratings.length ? `Feedback: ${feedback.ratings.join(', ')}` : '',
    feedback.note ? `Note: ${feedback.note}` : '',
    `Confidence Points earned: +${summary.confidencePointsEarned} (total ${summary.totalConfidencePoints})`,
    summary.earnedBadges.length ? `Badges: ${summary.earnedBadges.map((b) => b.name).join(', ')}` : '',
    'Exercises:',
    ...workout.exercises.map((e, i) => `  ${i + 1}. ${e.name} — ${e.repsOrTime} [${e.status}]`),
    '',
    'Note: general inclusive movement guidance, not medical advice. Stop if you feel pain, dizziness, numbness, or discomfort.',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function App() {
  const { profile, hasProfile, saveProfile, resetProfile, recordWorkout } = useProfile();
  const { settings, applyAll } = useAccessibility();

  const [screen, setScreen] = useState<Screen>('landing');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [workingProfile, setWorkingProfile] = useState<AbilityProfile | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [intakeQuick, setIntakeQuick] = useState(false);
  const [intakeInitial, setIntakeInitial] = useState<AbilityProfile>(createDefaultProfile());
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [a11yOpen, setA11yOpen] = useState(false);

  const generateFrom = useCallback((source: AbilityProfile) => {
    setWorkingProfile(source);
    setWorkout(generateWorkout(source));
    setPlanMessage(null);
    setScreen('plan');
  }, []);

  const startIntake = (quick: boolean) => {
    setIntakeQuick(quick);
    setIntakeInitial(profile ?? createDefaultProfile());
    setScreen('intake');
  };

  const loadPersona = (id: string) => {
    const persona = personaById(id);
    if (!persona) return;
    const cloned: AbilityProfile = { ...persona.profile, createdAt: Date.now(), updatedAt: Date.now() };
    saveProfile(cloned);
    // Apply the persona's accessibility prefs, but keep the user's current
    // theme and colour-vision choices so loading a demo never overrides them.
    applyAll({ ...cloned.accessibility, theme: settings.theme, colorVision: settings.colorVision });
    generateFrom(cloned);
  };

  const handleIntakeComplete = (next: AbilityProfile) => {
    saveProfile(next);
    generateFrom(next);
  };

  const handleReplace = (index: number, reason: ReplacementReason) => {
    if (!workout || !workingProfile) return;
    const outcome = replaceExercise(workout, index, reason, workingProfile);
    setWorkout(outcome.workout);
    setPlanMessage(outcome.message ?? null);
  };

  const handleRegenerate = (mode: RegenerationMode) => {
    if (!workingProfile) return;
    const reshaped = applyRegeneration(workingProfile, mode);
    setWorkingProfile(reshaped);
    setWorkout(generateWorkout(reshaped));
    setPlanMessage('Workout updated to match your request.');
  };

  const handleStatusChange = (index: number, status: 'completed' | 'skipped' | 'pending') => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const exercises = [...prev.exercises];
      exercises[index] = { ...exercises[index], status };
      return { ...prev, exercises };
    });
  };

  const finalize = useCallback(
    (draft: FeedbackDraft) => {
      if (!workout || !profile) return;
      const completed = workout.exercises.filter((e) => e.status === 'completed');
      const exercisesCompleted = completed.length;
      const movementMinutes = Math.max(
        exercisesCompleted > 0 ? 1 : 0,
        Math.round(completed.reduce((s, e) => s + e.durationSeconds + e.restSeconds, 0) / 60),
      );
      const musclesTargeted = [...new Set(completed.flatMap((e) => e.targetMuscles))];
      const confidencePointsEarned = 5 + exercisesCompleted * 5;
      const feedback = { workoutId: workout.id, date: today(), ...draft };
      const earnedBadges = evaluateBadges(profile, workout, feedback);
      const updated = recordWorkout({ workout, feedback, confidencePointsEarned, earnedBadges }) ?? profile;

      setSummary({
        workout,
        feedback,
        earnedBadges,
        confidencePointsEarned,
        totalConfidencePoints: updated.confidencePoints,
        streak: updated.streak,
        movementMinutes,
        exercisesCompleted,
        musclesTargeted,
      });
      setScreen('summary');
    },
    [workout, profile, recordWorkout],
  );

  const goHome = () => setScreen('landing');

  const goBack = () => {
    switch (screen) {
      case 'intake':
        setScreen(hasProfile ? 'profile' : 'landing');
        break;
      case 'session':
        setScreen('plan');
        break;
      case 'feedback':
        setScreen('plan');
        break;
      case 'plan':
      case 'summary':
      case 'profile':
      default:
        setScreen('landing');
    }
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header
        onHome={goHome}
        onBack={screen === 'landing' ? undefined : goBack}
        onOpenA11y={() => setA11yOpen(true)}
        onProfile={() => setScreen('profile')}
        hasProfile={hasProfile}
        confidencePoints={profile?.confidencePoints}
      />

      <main id="main" className="container">
        {screen === 'landing' && (
          <LandingScreen
            hasProfile={hasProfile}
            onStartDetailed={() => startIntake(false)}
            onQuickStart={() => startIntake(true)}
            onLoadPersona={loadPersona}
            onResume={() => (profile ? generateFrom(profile) : startIntake(true))}
          />
        )}

        {screen === 'intake' && (
          <IntakeScreen
            initialProfile={intakeInitial}
            quickStart={intakeQuick}
            onComplete={handleIntakeComplete}
            onCancel={() => setScreen(hasProfile ? 'profile' : 'landing')}
          />
        )}

        {screen === 'plan' && workout && workingProfile && (
          <PlanScreen
            profile={workingProfile}
            workout={workout}
            message={planMessage}
            onReplace={handleReplace}
            onRegenerate={handleRegenerate}
            onRegenerateFresh={() => generateFrom(workingProfile)}
            onStartSession={() => setScreen('session')}
            onEditProfile={() => startIntake(false)}
          />
        )}

        {screen === 'session' && workout && workingProfile && (
          <SessionScreen
            profile={workingProfile}
            workout={workout}
            onStatusChange={handleStatusChange}
            onReplace={handleReplace}
            onFinish={() => setScreen('feedback')}
            onExit={() => setScreen('plan')}
          />
        )}

        {screen === 'feedback' && (
          <FeedbackScreen onSubmit={finalize} onSkip={() => finalize({ ratings: [], comfort: 4, confidence: 4 })} />
        )}

        {screen === 'summary' && summary && (
          <SummaryScreen
            summary={summary}
            onCopy={() => buildSummaryText(summary)}
            onNewWorkout={() => (workingProfile ? generateFrom(workingProfile) : goHome())}
            onHome={goHome}
          />
        )}

        {screen === 'profile' && profile && (
          <ProfileScreen
            profile={profile}
            onEdit={() => startIntake(false)}
            onReset={() => {
              resetProfile();
              setWorkout(null);
              setWorkingProfile(null);
              setScreen('landing');
            }}
            onGenerate={() => generateFrom(profile)}
            onBack={goHome}
          />
        )}

        {screen === 'profile' && !profile && (
          <div className="screen center stack">
            <p className="muted">No Ability Profile yet.</p>
            <button className="btn btn--primary" onClick={() => startIntake(false)}>
              Create your Ability Profile
            </button>
          </div>
        )}
      </main>

      <footer className="footer-note">
        Adaptive Motion Gym provides general inclusive movement suggestions. It does not diagnose, treat, cure, or
        replace professional care. Strength looks different for everyone — every body is welcome.
      </footer>

      <AccessibilityPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />
    </div>
  );
}
