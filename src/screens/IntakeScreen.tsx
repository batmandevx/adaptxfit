import { useMemo, useState } from 'react';
import type { AbilityProfile } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  ACTIVITY_LEVELS,
  AGE_RANGES,
  BODY_AREAS,
  COACHING_TONES,
  CONFIDENCE_OPTIONS,
  DURATION_OPTIONS,
  EXERCISE_COUNT_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  GOAL_OPTIONS,
  INTENSITY_OPTIONS,
  LIMB_OPTIONS,
  MOVEMENTS_TO_AVOID,
  MUSCLE_OPTIONS,
  POSTURE_OPTIONS,
  SUPPORT_OPTIONS,
} from '../data/options';
import {
  FormSection,
  OptionChips,
  Segmented,
  SelectField,
  SingleSelect,
  TextField,
  Toggle,
} from '../components/Inputs';
import { BodyScan } from '../components/BodyScan';

interface IntakeScreenProps {
  initialProfile: AbilityProfile;
  quickStart: boolean;
  onComplete: (profile: AbilityProfile) => void;
  onCancel: () => void;
}

type StepId = 'basic' | 'mobility' | 'body' | 'support' | 'protect' | 'goals' | 'prefs' | 'access' | 'consent';

const STEP_LABELS: Record<StepId, string> = {
  basic: 'About you',
  mobility: 'How you move',
  body: 'Body & avatar',
  support: 'Support & equipment',
  protect: 'Areas to protect',
  goals: 'Goals & focus',
  prefs: 'Preferences',
  access: 'Accessibility',
  consent: 'Privacy & consent',
};

const ALL_STEPS: StepId[] = ['basic', 'mobility', 'body', 'support', 'protect', 'goals', 'prefs', 'access', 'consent'];
const QUICK_STEPS: StepId[] = ['mobility', 'support', 'goals', 'prefs'];

const A11Y_CONTROLS = [
  { key: 'highContrast', label: 'High contrast' },
  { key: 'largeText', label: 'Large text' },
  { key: 'reducedMotion', label: 'Reduced motion' },
  { key: 'dyslexiaFont', label: 'Dyslexia-friendly font' },
  { key: 'simpleLanguage', label: 'Simple language' },
  { key: 'voiceGuidance', label: 'Voice guidance' },
  { key: 'captions', label: 'Captions / text instructions' },
  { key: 'soundCues', label: 'Sound cues' },
] as const;

export function IntakeScreen({ initialProfile, quickStart, onComplete, onCancel }: IntakeScreenProps) {
  const { settings, toggle } = useAccessibility();
  const [draft, setDraft] = useState<AbilityProfile>(initialProfile);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const steps = useMemo(() => (quickStart ? QUICK_STEPS : ALL_STEPS), [quickStart]);
  const [stepIndex, setStepIndex] = useState(0);

  const stepId = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const set = (partial: Partial<AbilityProfile>) => setDraft((prev) => ({ ...prev, ...partial }));
  const setPref = (partial: Partial<AbilityProfile['preferences']>) =>
    setDraft((prev) => ({ ...prev, preferences: { ...prev.preferences, ...partial } }));

  // Wheelchair toggle keeps standing / seated settings coherent so deselecting
  // it actually returns standing exercises (and vice-versa).
  const onWheelchair = (v: boolean) => {
    if (v) {
      set({
        usesWheelchair: true,
        standingAbility: 'none',
        walkingAbility: 'none',
        supportSystems: draft.supportSystems.includes('wheelchair')
          ? draft.supportSystems
          : [...draft.supportSystems, 'wheelchair'],
      });
      setPref({ seatedOnly: true });
    } else {
      set({
        usesWheelchair: false,
        standingAbility: 'yes',
        walkingAbility: 'yes',
        movementsToAvoid: draft.movementsToAvoid.filter((m) => m !== 'standing'),
        supportSystems: draft.supportSystems.filter((s) => s !== 'wheelchair'),
      });
      setPref({ seatedOnly: false });
    }
  };

  const units = draft.preferredUnits;
  const heightUnit = units === 'metric' ? 'cm' : 'in';
  const weightUnit = units === 'metric' ? 'kg' : 'lb';
  const heightRange: [number, number] = units === 'metric' ? [120, 210] : [48, 84];
  const weightRange: [number, number] = units === 'metric' ? [30, 180] : [66, 400];
  const heightVal = Number(draft.height) || (units === 'metric' ? 170 : 67);
  const weightVal = Number(draft.weight) || (units === 'metric' ? 70 : 154);

  const finish = () => {
    const finalProfile: AbilityProfile = {
      ...draft,
      accessibility: { ...settings },
      updatedAt: Date.now(),
    };
    onComplete(finalProfile);
  };

  const next = () => (isLast ? finish() : setStepIndex((i) => i + 1));
  const back = () => (stepIndex === 0 ? onCancel() : setStepIndex((i) => i - 1));

  const onImage = (file: File | undefined) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="screen stack" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="row-between">
        <span className="eyebrow">{quickStart ? 'Quick start' : 'Ability Profile'}</span>
        <span className="muted">
          Step {stepIndex + 1} of {steps.length}
        </span>
      </div>
      <div className="progress-bar" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="stepper" aria-hidden="true">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`step ${i === stepIndex ? 'step--active' : i < stepIndex ? 'step--done' : ''}`}
          >
            {STEP_LABELS[s]}
          </span>
        ))}
      </div>

      <div className="card card-lg">
        {stepId === 'basic' && (
          <FormSection title="About you" hint="Optional details that help tailor pacing. Nothing here is required.">
            <TextField label="Preferred name (optional)" value={draft.displayName ?? ''} onChange={(v) => set({ displayName: v })} placeholder="What should we call you?" />
            <SelectField label="Age range" options={AGE_RANGES} value={draft.ageRange} onChange={(v) => set({ ageRange: v })} />
            <div className="field">
              <span className="field-label">Preferred units</span>
              <Segmented
                label="Preferred units"
                options={[{ value: 'metric', label: 'Metric' }, { value: 'imperial', label: 'Imperial' }]}
                value={draft.preferredUnits}
                onChange={(v) => set({ preferredUnits: v as AbilityProfile['preferredUnits'] })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="intake-height">
                Height: <strong>{heightVal} {heightUnit}</strong>
              </label>
              <input
                id="intake-height"
                className="range"
                type="range"
                min={heightRange[0]}
                max={heightRange[1]}
                value={heightVal}
                onChange={(e) => set({ height: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="intake-weight">
                Weight: <strong>{weightVal} {weightUnit}</strong>
              </label>
              <input
                id="intake-weight"
                className="range"
                type="range"
                min={weightRange[0]}
                max={weightRange[1]}
                value={weightVal}
                onChange={(e) => set({ weight: e.target.value })}
              />
            </div>
            <SingleSelect legend="Current activity level" options={ACTIVITY_LEVELS} value={draft.activityLevel} onChange={(v) => set({ activityLevel: v as AbilityProfile['activityLevel'] })} />
            <SingleSelect legend="Movement experience" options={EXPERIENCE_LEVELS} value={draft.fitnessExperience} onChange={(v) => set({ fitnessExperience: v as AbilityProfile['fitnessExperience'] })} />
          </FormSection>
        )}

        {stepId === 'mobility' && (
          <FormSection title="How your body moves today" hint="Answer only what feels right. You can change any of this later.">
            <Toggle label="I use a wheelchair" description="We will prioritise seated and wheelchair-friendly movements" checked={draft.usesWheelchair} onChange={onWheelchair} />
            <SingleSelect legend="Standing" options={POSTURE_OPTIONS} value={draft.standingAbility} onChange={(v) => set({ standingAbility: v as AbilityProfile['standingAbility'] })} />
            <SingleSelect legend="Walking" options={POSTURE_OPTIONS} value={draft.walkingAbility} onChange={(v) => set({ walkingAbility: v as AbilityProfile['walkingAbility'] })} />
            <SingleSelect legend="Balance confidence" options={CONFIDENCE_OPTIONS} value={draft.balanceConfidence} onChange={(v) => set({ balanceConfidence: v as AbilityProfile['balanceConfidence'] })} />
            <div className="grid grid-2">
              <SingleSelect legend="Left arm" options={LIMB_OPTIONS} value={draft.leftArmAbility} onChange={(v) => set({ leftArmAbility: v as AbilityProfile['leftArmAbility'] })} />
              <SingleSelect legend="Right arm" options={LIMB_OPTIONS} value={draft.rightArmAbility} onChange={(v) => set({ rightArmAbility: v as AbilityProfile['rightArmAbility'] })} />
              <SingleSelect legend="Left leg" options={LIMB_OPTIONS} value={draft.leftLegAbility} onChange={(v) => set({ leftLegAbility: v as AbilityProfile['leftLegAbility'] })} />
              <SingleSelect legend="Right leg" options={LIMB_OPTIONS} value={draft.rightLegAbility} onChange={(v) => set({ rightLegAbility: v as AbilityProfile['rightLegAbility'] })} />
            </div>
            <Toggle label="I use a prosthetic" description="Optional — helps us suggest suitable movements" checked={draft.usesProsthetic} onChange={(v) => set({ usesProsthetic: v })} />
            <TextField label="Anything else about how you move? (optional)" value={draft.limbDifferenceNote ?? ''} onChange={(v) => set({ limbDifferenceNote: v })} placeholder="Only what you want to share" />
          </FormSection>
        )}

        {stepId === 'body' && (
          <FormSection title="Body & movement avatar" hint="Optional. Size a rough avatar that demonstrates each movement during your workout.">
            <BodyScan
              value={draft.bodyProfile ?? { heightScale: 1, buildScale: 1, source: 'none' }}
              onChange={(bp) => set({ bodyProfile: bp })}
              seated={draft.preferences.seatedOnly || draft.usesWheelchair || draft.standingAbility === 'none'}
              usesWheelchair={draft.usesWheelchair}
            />
          </FormSection>
        )}

        {stepId === 'support' && (
          <FormSection title="Support and equipment" hint="What helps you feel stable, and what do you have nearby?">
            <OptionChips legend="What support helps you feel stable?" options={SUPPORT_OPTIONS} values={draft.supportSystems} onChange={(v) => set({ supportSystems: v })} />
            <OptionChips legend="Equipment available" options={EQUIPMENT_OPTIONS} values={draft.equipment} onChange={(v) => set({ equipment: v })} />
          </FormSection>
        )}

        {stepId === 'protect' && (
          <FormSection title="Areas to protect" hint="We will keep load off these areas. Leave blank if nothing applies.">
            <OptionChips legend="Which areas feel sensitive or painful?" options={BODY_AREAS} values={draft.painAreas} onChange={(v) => set({ painAreas: v })} />
            <OptionChips legend="Any injury areas to protect?" options={BODY_AREAS} values={draft.injuryAreas} onChange={(v) => set({ injuryAreas: v })} />
            <OptionChips legend="Movements you would like to avoid" options={MOVEMENTS_TO_AVOID} values={draft.movementsToAvoid} onChange={(v) => set({ movementsToAvoid: v })} />
          </FormSection>
        )}

        {stepId === 'goals' && (
          <FormSection title="Goals and focus" hint="What would you like to build confidence in?">
            <OptionChips legend="Your goals" options={GOAL_OPTIONS} values={draft.goals} onChange={(v) => set({ goals: v })} />
            <OptionChips legend="Muscles you would like to focus on" options={MUSCLE_OPTIONS} values={draft.targetMuscles} onChange={(v) => set({ targetMuscles: v })} />
          </FormSection>
        )}

        {stepId === 'prefs' && (
          <FormSection title="Workout preferences" hint="Shape the routine to suit you.">
            <div className="field">
              <span className="field-label">Session length</span>
              <Segmented label="Session length" options={DURATION_OPTIONS} value={String(draft.preferences.durationMinutes)} onChange={(v) => setPref({ durationMinutes: Number(v) })} />
            </div>
            <div className="field">
              <span className="field-label">Number of exercises</span>
              <Segmented label="Number of exercises" options={EXERCISE_COUNT_OPTIONS} value={String(draft.preferences.exerciseCount)} onChange={(v) => setPref({ exerciseCount: Number(v) })} />
            </div>
            <Toggle label="Seated only" description="Every movement will be done seated" checked={draft.preferences.seatedOnly} onChange={(v) => setPref({ seatedOnly: v })} />
            <Toggle label="Allow floor exercises" description="Off by default for accessibility" checked={draft.preferences.floorExercisesAllowed} onChange={(v) => setPref({ floorExercisesAllowed: v })} />
            <SingleSelect legend="Intensity" options={INTENSITY_OPTIONS} value={draft.preferences.intensity} onChange={(v) => setPref({ intensity: v as AbilityProfile['preferences']['intensity'] })} />
            <SingleSelect legend="Coaching tone" options={COACHING_TONES} value={draft.preferences.coachingTone} onChange={(v) => setPref({ coachingTone: v as AbilityProfile['preferences']['coachingTone'] })} />
          </FormSection>
        )}

        {stepId === 'access' && (
          <FormSection title="Accessibility preferences" hint="Turn on whatever helps. You can change these any time from the Accessibility button.">
            {A11Y_CONTROLS.map((control) => (
              <Toggle key={control.key} label={control.label} checked={settings[control.key]} onChange={() => toggle(control.key)} />
            ))}
          </FormSection>
        )}

        {stepId === 'consent' && (
          <FormSection title="Privacy and consent" hint="You are in control of your data.">
            <div className="notice notice--info">
              <span className="ic" aria-hidden="true">🔒</span>
              <span>
                Your Ability Profile is stored only on this device to personalize movement suggestions. You can update
                or reset it any time. We never store camera frames, images, or video.
              </span>
            </div>
            <div className="stack-sm">
              <strong>Optional: add a reference image</strong>
              <p className="muted" style={{ margin: 0 }}>
                You can add a reference image to personalize guidance, or skip it entirely. Images are previewed locally
                and never uploaded or stored.
              </p>
              <input type="file" accept="image/*" aria-label="Optional reference image" onChange={(e) => onImage(e.target.files?.[0])} />
              {imagePreview ? (
                <div className="row">
                  <img src={imagePreview} alt="Your reference preview (local only)" style={{ maxWidth: 120, borderRadius: 12 }} />
                  <button className="btn btn--subtle btn--sm" onClick={() => onImage(undefined)}>
                    Remove image
                  </button>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                  Image-based personalization is not active in this demo, so we will use your profile answers instead.
                </p>
              )}
            </div>
          </FormSection>
        )}
      </div>

      <div className="row-between">
        <button className="btn btn--ghost" onClick={back}>
          {stepIndex === 0 ? 'Cancel' : '← Back'}
        </button>
        <button className="btn btn--primary" onClick={next}>
          {isLast ? 'Save & generate workout' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
