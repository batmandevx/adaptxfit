import { useState } from 'react';
import type { AbilityProfile, RegenerationMode, ReplacementReason, Workout } from '../types';
import { REGENERATION_OPTIONS } from '../data/options';
import { ExerciseCard } from '../components/ExerciseCard';
import { AiCoachCard } from '../components/AiCoachCard';
import { useSpeech } from '../hooks/useSpeech';

interface PlanScreenProps {
  profile: AbilityProfile;
  workout: Workout;
  message: string | null;
  onReplace: (index: number, reason: ReplacementReason) => void;
  onRegenerate: (mode: RegenerationMode) => void;
  onRegenerateFresh: () => void;
  onStartSession: () => void;
  onEditProfile: () => void;
}

export function PlanScreen({
  profile,
  workout,
  message,
  onReplace,
  onRegenerate,
  onRegenerateFresh,
  onStartSession,
  onEditProfile,
}: PlanScreenProps) {
  const speech = useSpeech(true);
  const [showChange, setShowChange] = useState(false);

  return (
    <div className="screen stack">
      <div className="row-between">
        <div>
          <span className="eyebrow">Your adapted routine</span>
          <h1 style={{ margin: '8px 0 4px', fontSize: '1.8rem' }}>{workout.style}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {workout.exercises.length} exercises • about {workout.estimatedMinutes} minutes • {workout.intensity} intensity
          </p>
        </div>
        <button className="btn btn--primary btn--lg" onClick={onStartSession}>
          ▶ Start guided workout
        </button>
      </div>

      <div className="tag-group" aria-label="Adaptations applied">
        {workout.adaptationsUsed.map((a) => (
          <span key={a} className="tag tag--support">
            {a}
          </span>
        ))}
      </div>

      <div className="notice notice--safety" role="note">
        <span className="ic" aria-hidden="true">⚠️</span>
        <span>
          Every exercise here passed a safety check against your profile. This is general movement guidance, not medical
          advice. Stop if you feel pain, dizziness, numbness, or discomfort.
        </span>
      </div>

      {message ? (
        <div className="notice notice--success" role="status">
          <span className="ic" aria-hidden="true">✅</span>
          <span>{message}</span>
        </div>
      ) : null}

      <div className="card">
        <div className="row-between">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Change this workout anytime</h2>
            <p className="muted" style={{ margin: '2px 0 0' }}>
              You are always in control. Reshape the whole routine without losing your place.
            </p>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setShowChange((v) => !v)} aria-expanded={showChange}>
            {showChange ? 'Hide options' : 'Show options'}
          </button>
        </div>
        {showChange ? (
          <div className="reason-grid" style={{ marginTop: 'var(--space-3)' }}>
            {REGENERATION_OPTIONS.map((opt) => (
              <button key={opt.value} className="btn btn--subtle btn--sm" onClick={() => onRegenerate(opt.value as RegenerationMode)}>
                {opt.label}
              </button>
            ))}
            <button className="btn btn--subtle btn--sm" onClick={onRegenerateFresh}>
              🔄 Fresh routine
            </button>
          </div>
        ) : null}
      </div>

      <div className="stack">
        {workout.exercises.map((exercise, index) => (
          <ExerciseCard
            key={`${exercise.id}-${index}`}
            exercise={exercise}
            index={index}
            usesWheelchair={profile.usesWheelchair}
            body={profile.bodyProfile}
            onReplace={(reason) => onReplace(index, reason)}
            onSpeak={speech.speak}
            canSpeak={speech.supported}
          />
        ))}
      </div>

      <AiCoachCard
        payload={{
          style: workout.style,
          adaptations: workout.adaptationsUsed,
          equipment: [...new Set([...profile.equipment, ...profile.supportSystems])],
          goals: profile.goals,
          targetMuscles: profile.targetMuscles,
          protect: [...new Set([...profile.painAreas, ...profile.injuryAreas])],
          exercises: workout.exercises.map((e) => e.name),
          tone: profile.preferences.coachingTone,
        }}
      />

      <div className="row-between">
        <button className="btn btn--ghost" onClick={onEditProfile}>
          ✎ Edit profile
        </button>
        <button className="btn btn--primary btn--lg" onClick={onStartSession}>
          ▶ Start guided workout
        </button>
      </div>
    </div>
  );
}
