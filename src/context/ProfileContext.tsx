import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AbilityProfile, Badge, Workout, WorkoutFeedback } from '../types';
import { loadJSON, removeKey, saveJSON, STORAGE_KEYS } from '../utils/storage';

interface RecordWorkoutInput {
  workout: Workout;
  feedback: WorkoutFeedback;
  confidencePointsEarned: number;
  earnedBadges: Badge[];
}

interface ProfileContextValue {
  profile: AbilityProfile | null;
  hasProfile: boolean;
  saveProfile: (profile: AbilityProfile) => void;
  updateProfile: (partial: Partial<AbilityProfile>) => void;
  resetProfile: () => void;
  recordWorkout: (input: RecordWorkoutInput) => AbilityProfile | null;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextStreak(profile: AbilityProfile): number {
  const today = dateKey(new Date());
  const yesterday = dateKey(new Date(Date.now() - 86_400_000));
  if (profile.lastWorkoutDate === today) return Math.max(1, profile.streak);
  if (profile.lastWorkoutDate === yesterday) return profile.streak + 1;
  return 1;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AbilityProfile | null>(
    () => loadJSON<AbilityProfile>(STORAGE_KEYS.profile),
  );

  const saveProfile = useCallback((next: AbilityProfile) => {
    const stamped = { ...next, updatedAt: Date.now() };
    setProfile(stamped);
    saveJSON(STORAGE_KEYS.profile, stamped);
  }, []);

  const updateProfile = useCallback((partial: Partial<AbilityProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial, updatedAt: Date.now() };
      saveJSON(STORAGE_KEYS.profile, next);
      return next;
    });
  }, []);

  const resetProfile = useCallback(() => {
    removeKey(STORAGE_KEYS.profile);
    setProfile(null);
  }, []);

  const recordWorkout = useCallback((input: RecordWorkoutInput): AbilityProfile | null => {
    let updated: AbilityProfile | null = null;
    setProfile((prev) => {
      if (!prev) return prev;
      const earnedBadgeIds = [...new Set([...prev.earnedBadgeIds, ...input.earnedBadges.map((b) => b.id)])];
      const next: AbilityProfile = {
        ...prev,
        completedWorkouts: prev.completedWorkouts + 1,
        confidencePoints: prev.confidencePoints + input.confidencePointsEarned,
        streak: nextStreak(prev),
        earnedBadgeIds,
        feedbackHistory: [...prev.feedbackHistory, input.feedback].slice(-20),
        lastWorkoutDate: dateKey(new Date()),
        updatedAt: Date.now(),
      };
      saveJSON(STORAGE_KEYS.profile, next);
      updated = next;
      return next;
    });
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      profile,
      hasProfile: profile !== null,
      saveProfile,
      updateProfile,
      resetProfile,
      recordWorkout,
    }),
    [profile, saveProfile, updateProfile, resetProfile, recordWorkout],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
