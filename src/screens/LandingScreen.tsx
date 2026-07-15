import { DEMO_PERSONAS } from '../data/demoPersonas';
import { useReminders } from '../context/RemindersContext';

interface LandingScreenProps {
  hasProfile: boolean;
  onStartDetailed: () => void;
  onQuickStart: () => void;
  onLoadPersona: (personaId: string) => void;
  onResume: () => void;
}

const PILLARS = [
  { ic: '🧭', title: 'Ability Profile', text: 'Functional questions about how your body moves today — never a “what’s wrong” form.' },
  { ic: '🛡️', title: 'Safety-validated', text: 'A deterministic engine filters out anything that conflicts with your needs.' },
  { ic: '🔁', title: 'Always swappable', text: 'Replace any exercise, or reshape the whole routine, at any time.' },
  { ic: '🔊', title: 'Voice & accessible', text: 'Voice guidance, high contrast, large text, reduced motion and more.' },
  { ic: '🪑', title: 'Seated & supported', text: 'Chair, wall, wheelchair and one-arm friendly movements built in.' },
  { ic: '✨', title: 'Confidence Points', text: 'Progress measured by movement and confidence — never appearance or weight.' },
];

export function LandingScreen({
  hasProfile,
  onStartDetailed,
  onQuickStart,
  onLoadPersona,
  onResume,
}: LandingScreenProps) {
  const { dueToday, acknowledgeToday } = useReminders();
  return (
    <div className="screen stack" style={{ gap: 'var(--space-6)' }}>
      {dueToday ? (
        <div className="notice notice--success" role="status" style={{ maxWidth: 760, margin: '0 auto' }}>
          <span className="ic" aria-hidden="true">⏰</span>
          <span style={{ flex: 1 }}>
            It’s your movement time — ready when you are. Your pace, your ability.
          </span>
          <button className="btn btn--ghost btn--sm" onClick={acknowledgeToday}>
            Not now
          </button>
        </div>
      ) : null}
      <section className="hero">
        <span className="eyebrow">Inclusive AI movement companion</span>
        <h1>Fitness that adapts to every body</h1>
        <p className="tagline">Your pace. Your ability. Your movement.</p>
        <p className="hero-sub">
          Inclusive AI fitness that adapts workouts to your body, ability, mobility, and support needs.
        </p>
        <div className="hero-actions">
          <button className="btn btn--primary btn--lg" onClick={onStartDetailed}>
            Start Adaptive Workout
          </button>
          <button className="btn btn--accent btn--lg" onClick={() => onLoadPersona('wheelchair-upper-body')}>
            Try Demo Profile
          </button>
          {hasProfile ? (
            <button className="btn btn--ghost btn--lg" onClick={onResume}>
              Generate a workout
            </button>
          ) : (
            <button className="btn btn--ghost btn--lg" onClick={onQuickStart}>
              Quick start
            </button>
          )}
        </div>
      </section>

      <div className="notice notice--info" role="note" style={{ maxWidth: 760, margin: '0 auto' }}>
        <span className="ic" aria-hidden="true">💡</span>
        <span>
          Most fitness apps assume everyone can stand, jump, balance, and use both arms and legs. Adaptive Motion Gym
          adapts to your actual ability, support, and comfort — and validates every routine with deterministic safety
          rules.
        </span>
      </div>

      <section aria-label="What makes this different" className="grid grid-3">
        {PILLARS.map((p) => (
          <div className="feature-card" key={p.title}>
            <div className="ic" aria-hidden="true">
              {p.ic}
            </div>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </section>

      <section className="card-lg card" aria-label="Try a demo">
        <span className="eyebrow">Try a demo persona</span>
        <h2 style={{ marginTop: 'var(--space-3)' }}>See the adaptation in action</h2>
        <p className="muted">
          Each demo loads a ready-made Ability Profile so you can instantly see a safe, adapted routine.
        </p>
        <div className="grid grid-3" style={{ marginTop: 'var(--space-3)' }}>
          {DEMO_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              className="persona-card"
              onClick={() => onLoadPersona(persona.id)}
              aria-label={`${persona.buttonLabel}: ${persona.description}`}
            >
              <h3>{persona.name}</h3>
              <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>
                {persona.description}
              </p>
              <div className="tag-group">
                {persona.highlights.map((h) => (
                  <span key={h} className="tag tag--support">
                    {h}
                  </span>
                ))}
              </div>
              <span className="btn btn--primary btn--sm" style={{ marginTop: 'var(--space-2)', pointerEvents: 'none' }}>
                {persona.buttonLabel} →
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="notice notice--safety" role="note">
        <span className="ic" aria-hidden="true">⚠️</span>
        <span>
          Adaptive Motion Gym offers general inclusive movement suggestions. It does not diagnose, treat, cure, or
          replace professional care. Stop if you feel pain, dizziness, numbness, or discomfort.
        </span>
      </div>
    </div>
  );
}
