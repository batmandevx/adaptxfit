import { useState } from 'react';
import type { AbilityProfile } from '../types';
import { badgeById } from '../data/badges';
import { useProfile } from '../context/ProfileContext';
import { BodyScan } from '../components/BodyScan';
import { RemindersCard } from '../components/RemindersCard';

interface ProfileScreenProps {
  profile: AbilityProfile;
  onEdit: () => void;
  onReset: () => void;
  onGenerate: () => void;
  onBack: () => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', fontWeight: 700 }}>
        {label}
      </dt>
      <dd style={{ margin: '2px 0 0' }}>{value || '—'}</dd>
    </div>
  );
}

const fmtList = (list: string[]) => (list.length ? list.join(', ') : 'None');

export function ProfileScreen({ profile, onEdit, onReset, onGenerate, onBack }: ProfileScreenProps) {
  const { updateProfile } = useProfile();
  const [confirming, setConfirming] = useState(false);
  const [showTwin, setShowTwin] = useState(false);
  const seated = profile.preferences.seatedOnly || profile.usesWheelchair || profile.standingAbility === 'none';

  return (
    <div className="screen stack" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="row-between">
        <div>
          <span className="eyebrow">Your Ability Profile</span>
          <h1 style={{ margin: '8px 0 0', fontSize: '1.7rem' }}>
            {profile.displayName ? profile.displayName : 'Movement profile'}
          </h1>
        </div>
        <button className="btn btn--ghost" onClick={onBack}>
          ← Back
        </button>
      </div>

      <section className="stat-grid" aria-label="Your progress">
        <div className="stat-card">
          <div className="stat-value">{profile.confidencePoints}</div>
          <div className="stat-label">Confidence Points</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.completedWorkouts}</div>
          <div className="stat-label">Workouts completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.streak}</div>
          <div className="stat-label">Day streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.earnedBadgeIds.length}</div>
          <div className="stat-label">Badges earned</div>
        </div>
      </section>

      {profile.earnedBadgeIds.length ? (
        <div className="tag-group" aria-label="Your badges">
          {profile.earnedBadgeIds.map((id) => {
            const badge = badgeById(id);
            return badge ? (
              <span key={id} className="tag tag--support">
                {badge.icon} {badge.name}
              </span>
            ) : null;
          })}
        </div>
      ) : null}

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>How your body moves</h2>
        <dl className="detail-grid">
          <Fact label="Uses wheelchair" value={profile.usesWheelchair ? 'Yes' : 'No'} />
          <Fact label="Standing" value={profile.standingAbility} />
          <Fact label="Walking" value={profile.walkingAbility} />
          <Fact label="Balance confidence" value={profile.balanceConfidence} />
          <Fact label="Left / right arm" value={`${profile.leftArmAbility} / ${profile.rightArmAbility}`} />
          <Fact label="Left / right leg" value={`${profile.leftLegAbility} / ${profile.rightLegAbility}`} />
          <Fact label="Uses prosthetic" value={profile.usesProsthetic ? 'Yes' : 'No'} />
        </dl>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Support, goals & protection</h2>
        <dl className="detail-grid">
          <Fact label="Support" value={fmtList(profile.supportSystems)} />
          <Fact label="Equipment" value={fmtList(profile.equipment)} />
          <Fact label="Goals" value={fmtList(profile.goals)} />
          <Fact label="Target muscles" value={fmtList(profile.targetMuscles)} />
          <Fact label="Areas to protect" value={fmtList([...new Set([...profile.painAreas, ...profile.injuryAreas])])} />
          <Fact label="Movements to avoid" value={fmtList(profile.movementsToAvoid)} />
          <Fact label="Intensity" value={profile.preferences.intensity} />
          <Fact label="Coaching tone" value={profile.preferences.coachingTone} />
        </dl>
      </div>

      <div className="card stack">
        <div className="row-between">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Your movement twin</h2>
            <p className="muted" style={{ margin: '2px 0 0' }}>
              Update the stylised avatar that demonstrates movements during your workout.
            </p>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setShowTwin((v) => !v)} aria-expanded={showTwin}>
            {showTwin ? 'Hide' : 'Update twin'}
          </button>
        </div>
        {showTwin ? (
          <BodyScan
            value={profile.bodyProfile ?? { heightScale: 1, buildScale: 1, source: 'none' }}
            onChange={(bp) => updateProfile({ bodyProfile: bp })}
            seated={seated}
            usesWheelchair={profile.usesWheelchair}
          />
        ) : null}
      </div>

      <RemindersCard />

      <div className="card stack">
        <div className="notice notice--info">
          <span className="ic" aria-hidden="true">🔒</span>
          <span>
            Your Ability Profile is stored only on this device to personalize movement suggestions. You can update or
            reset it anytime.
          </span>
        </div>
        <div className="btn-row">
          <button className="btn btn--primary" onClick={onGenerate}>
            Generate a workout
          </button>
          <button className="btn btn--subtle" onClick={onEdit}>
            ✎ Update profile
          </button>
          {confirming ? (
            <>
              <button className="btn btn--danger" onClick={onReset}>
                Yes, delete my profile
              </button>
              <button className="btn btn--ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn--danger" onClick={() => setConfirming(true)}>
              Reset / delete profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
