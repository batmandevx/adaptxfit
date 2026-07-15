import { useState } from 'react';
import { FEEDBACK_OPTIONS } from '../data/options';
import { OptionChips } from '../components/Inputs';

export interface FeedbackDraft {
  ratings: string[];
  comfort: number;
  confidence: number;
  note?: string;
}

interface FeedbackScreenProps {
  onSubmit: (feedback: FeedbackDraft) => void;
  onSkip: () => void;
}

const SCALE = [1, 2, 3, 4, 5];

function Scale({ label, value, onChange, lowLabel, highLabel }: { label: string; value: number; onChange: (v: number) => void; lowLabel: string; highLabel: string }) {
  return (
    <fieldset className="field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="field-label">{label}</legend>
      <div className="option-grid" role="radiogroup" aria-label={label}>
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`option ${value === n ? 'option--selected' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="row-between" style={{ marginTop: 4 }}>
        <small className="muted">{lowLabel}</small>
        <small className="muted">{highLabel}</small>
      </div>
    </fieldset>
  );
}

export function FeedbackScreen({ onSubmit, onSkip }: FeedbackScreenProps) {
  const [ratings, setRatings] = useState<string[]>([]);
  const [comfort, setComfort] = useState(4);
  const [confidence, setConfidence] = useState(4);
  const [note, setNote] = useState('');

  return (
    <div className="screen stack" style={{ maxWidth: 680, margin: '0 auto' }}>
      <span className="eyebrow">After your session</span>
      <h1 style={{ margin: 0 }}>How did this workout feel?</h1>
      <p className="muted">Your feedback shapes your next routine. There are no wrong answers.</p>

      <div className="card card-lg stack">
        <OptionChips legend="Select anything that fits" options={FEEDBACK_OPTIONS} values={ratings} onChange={setRatings} />
        <Scale label="Comfort" value={comfort} onChange={setComfort} lowLabel="Uncomfortable" highLabel="Very comfortable" />
        <Scale label="Confidence" value={confidence} onChange={setConfidence} lowLabel="Building it" highLabel="Very confident" />
        <label className="field" style={{ display: 'block', margin: 0 }}>
          <span className="field-label">Anything you would like to note? (optional)</span>
          <textarea
            className="text-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Only what you want to share"
          />
        </label>
      </div>

      <div className="row-between">
        <button className="btn btn--ghost" onClick={onSkip}>
          Skip for now
        </button>
        <button className="btn btn--primary btn--lg" onClick={() => onSubmit({ ratings, comfort, confidence, note: note.trim() || undefined })}>
          See my summary →
        </button>
      </div>
    </div>
  );
}
