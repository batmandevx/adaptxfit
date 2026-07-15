import { useState } from 'react';
import type { Badge, Workout, WorkoutFeedback } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';

export interface SummaryData {
  workout: Workout;
  feedback: WorkoutFeedback;
  earnedBadges: Badge[];
  confidencePointsEarned: number;
  totalConfidencePoints: number;
  streak: number;
  movementMinutes: number;
  exercisesCompleted: number;
  musclesTargeted: string[];
}

interface SummaryScreenProps {
  summary: SummaryData;
  onCopy: () => string;
  onNewWorkout: () => void;
  onHome: () => void;
}

export function SummaryScreen({ summary, onCopy, onNewWorkout, onHome }: SummaryScreenProps) {
  const { settings } = useAccessibility();
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [breathing, setBreathing] = useState(false);
  const [reflecting, setReflecting] = useState(false);

  const handleCopy = async () => {
    const text = onCopy();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFallbackText(text);
    }
  };

  const stats = [
    { value: summary.movementMinutes, label: 'Movement minutes' },
    { value: summary.exercisesCompleted, label: 'Exercises completed' },
    { value: summary.musclesTargeted.length, label: 'Muscle areas trained' },
    { value: summary.workout.adaptationsUsed.length, label: 'Adaptations used' },
    { value: `${summary.feedback.comfort}/5`, label: 'Comfort' },
    { value: `${summary.feedback.confidence}/5`, label: 'Confidence' },
    { value: summary.streak, label: 'Day streak' },
    { value: summary.workout.intensity, label: 'Routine type' },
  ];

  return (
    <div className="screen stack">
      <section className="summary-hero stack" style={{ alignItems: 'center' }}>
        <span className="eyebrow">Session complete</span>
        <div className="confidence-points" aria-label={`${summary.confidencePointsEarned} Confidence Points earned`}>
          +{summary.confidencePointsEarned} CP
        </div>
        <p style={{ margin: 0, maxWidth: '46ch', textAlign: 'center' }}>
          You earned {summary.confidencePointsEarned} Confidence Points for completing a safe, adapted movement session.
          Total: <strong>{summary.totalConfidencePoints} CP</strong>.
        </p>
      </section>

      <section aria-label="Your session in numbers" className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <div className="card stack">
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Muscles you trained</h2>
          <div className="tag-group">
            {summary.musclesTargeted.length ? (
              summary.musclesTargeted.map((m) => (
                <span key={m} className="tag tag--info">
                  {m}
                </span>
              ))
            ) : (
              <span className="muted">Gentle mobility session</span>
            )}
          </div>
        </div>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Adaptations used</h2>
          <div className="tag-group">
            {summary.workout.adaptationsUsed.map((a) => (
              <span key={a} className="tag tag--support">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {summary.earnedBadges.length ? (
        <section aria-label="Badges earned">
          <h2 style={{ fontSize: '1.2rem' }}>Badges earned</h2>
          <div className="badge-grid">
            {summary.earnedBadges.map((badge) => (
              <div className="badge-card" key={badge.id}>
                <div className="ic" aria-hidden="true">
                  {badge.icon}
                </div>
                <strong>{badge.name}</strong>
                <span>{badge.description}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Mental Gym bridge — lightweight, optional. */}
      <div className="card stack" aria-label="Cooldown and reflection">
        <div className="row-between">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Before you go</h2>
            <p className="muted" style={{ margin: '2px 0 0' }}>A gentle bridge to the wider wellbeing tools.</p>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn--subtle btn--sm" onClick={() => setBreathing((v) => !v)} aria-expanded={breathing}>
            🌬️ 1-minute breathing cooldown
          </button>
          <button className="btn btn--subtle btn--sm" onClick={() => setReflecting((v) => !v)} aria-expanded={reflecting}>
            💭 Reflect on how your body feels
          </button>
          <button className="btn btn--subtle btn--sm" onClick={onNewWorkout}>
            💾 Save as a confidence routine
          </button>
        </div>
        {breathing ? (
          <div className="center stack" style={{ alignItems: 'center' }}>
            <div className={`breath-circle ${settings.reducedMotion ? 'breath-circle--static' : ''}`} aria-hidden="true" />
            <p className="muted" role="status">Breathe in slowly… and breathe out. Let your shoulders soften.</p>
          </div>
        ) : null}
        {reflecting ? (
          <label className="field" style={{ display: 'block', margin: 0 }}>
            <span className="field-label">A note to yourself (not stored)</span>
            <textarea className="text-input" rows={2} placeholder="How does your body feel right now?" />
          </label>
        ) : null}
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Share or export</h2>
        <p className="muted" style={{ margin: 0 }}>
          Copy a plain-text summary to share with a caregiver, trainer, physiotherapist, family member, or teammate.
        </p>
        <div className="btn-row">
          <button className="btn btn--primary" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy summary'}
          </button>
          <button className="btn btn--accent" onClick={onNewWorkout}>
            Build another workout
          </button>
          <button className="btn btn--ghost" onClick={onHome}>
            Back to home
          </button>
        </div>
        {fallbackText ? (
          <label className="field" style={{ display: 'block', margin: 0 }}>
            <span className="field-hint">Copy is unavailable here — select and copy the text below:</span>
            <textarea className="text-input" rows={8} readOnly value={fallbackText} />
          </label>
        ) : null}
      </div>
    </div>
  );
}
