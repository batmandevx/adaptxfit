import { useState } from 'react';
import type { ReplacementReason, WorkoutExercise } from '../types';
import { REPLACEMENT_REASONS } from '../data/options';
import { MotionSketch, animationForExercise } from './MotionSketch';
import { SafetyLabels } from './SafetyLabels';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  usesWheelchair: boolean;
  body?: { heightScale: number; buildScale: number };
  onReplace: (reason: ReplacementReason) => void;
  onSpeak?: (text: string) => void;
  canSpeak?: boolean;
}

export function ExerciseCard({ exercise, index, usesWheelchair, body, onReplace, onSpeak, canSpeak }: ExerciseCardProps) {
  const [showReasons, setShowReasons] = useState(false);

  const handleReason = (reason: ReplacementReason) => {
    setShowReasons(false);
    onReplace(reason);
  };

  return (
    <article className="exercise-card" aria-label={`Exercise ${index + 1}: ${exercise.name}`}>
      <div className="exercise-top">
        <span className="exercise-index" aria-hidden="true">
          {index + 1}
        </span>
        <div style={{ flex: 1 }}>
          <h3 className="exercise-title">{exercise.name}</h3>
          <p className="exercise-meta" style={{ margin: '2px 0 0' }}>
            {exercise.targetMuscles.join(' · ')} • {exercise.difficulty} • {exercise.repsOrTime} • rest {exercise.rest}
          </p>
        </div>
        <div style={{ width: 96, flex: 'none' }}>
          <MotionSketch
            posture={exercise.posture}
            focusRegion={exercise.focusRegion}
            usesWheelchair={usesWheelchair}
            visualDescription={exercise.visualDescription}
            animation={animationForExercise(exercise)}
            body={body}
            compact
          />
        </div>
      </div>

      <SafetyLabels tags={exercise.tags} />

      <p className="exercise-reason">{exercise.selectionReason}</p>

      <details className="exercise-details">
        <summary>How to do it, safely</summary>
        <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
          <div>
            <strong>Starting position</strong>
            <p style={{ margin: '2px 0 0' }}>{exercise.startingPosition}</p>
          </div>
          <div>
            <strong>Steps</strong>
            <ol className="steps-list" style={{ marginTop: 4 }}>
              {exercise.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Easier option</dt>
              <dd>{exercise.easierAlternative}</dd>
            </div>
            <div>
              <dt>Progression</dt>
              <dd>{exercise.harderProgression}</dd>
            </div>
            <div>
              <dt>Seated / supported option</dt>
              <dd>{exercise.seatedAlternative}</dd>
            </div>
            <div>
              <dt>Visual guide</dt>
              <dd>{exercise.visualDescription}</dd>
            </div>
          </dl>
          <div className="notice notice--safety">
            <span className="ic" aria-hidden="true">⚠️</span>
            <span>{exercise.safetyNotes.join(' ')} Stop if you feel pain, dizziness, numbness, or discomfort.</span>
          </div>
        </div>
      </details>

      <div className="exercise-actions">
        <button className="btn btn--ghost btn--sm" onClick={() => setShowReasons((v) => !v)} aria-expanded={showReasons}>
          This does not work for me
        </button>
        {canSpeak && onSpeak ? (
          <button
            className="btn btn--subtle btn--sm"
            onClick={() => onSpeak(`${exercise.name}. ${exercise.voiceGuidance}`)}
          >
            🔊 Hear it
          </button>
        ) : null}
      </div>

      {showReasons ? (
        <div role="group" aria-label="Why does this not work for you?">
          <p className="field-hint" style={{ marginBottom: 4 }}>
            Tell us why, and we will swap in a safer option that respects your profile:
          </p>
          <div className="reason-grid">
            {REPLACEMENT_REASONS.map((reason) => (
              <button
                key={reason.value}
                className="btn btn--subtle btn--sm"
                onClick={() => handleReason(reason.value as ReplacementReason)}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
