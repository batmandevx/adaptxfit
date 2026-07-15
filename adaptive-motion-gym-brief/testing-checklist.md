# Testing Checklist

## Core Flow

- [ ] User can open Adaptive Motion Gym.
- [ ] User can create Ability Profile.
- [ ] User can update Ability Profile.
- [ ] User can reset/delete Ability Profile.
- [ ] User can generate workout.
- [ ] User can view exercise cards.
- [ ] User can replace an exercise.
- [ ] User can regenerate workout.
- [ ] User can start workout session.
- [ ] User can pause/resume workout.
- [ ] User can skip/change exercise.
- [ ] User can complete workout.
- [ ] User can submit post-workout feedback.
- [ ] User can view summary and badges.

## Safety Tests

- [ ] Wheelchair/seated-only user receives no standing exercises.
- [ ] No-floor user receives no floor exercises.
- [ ] One-arm user receives no standard pushups/pullups/two-arm planks.
- [ ] Knee pain user receives no jumping/lunges/deep squats.
- [ ] Low-balance user receives no unsupported single-leg exercises.
- [ ] Missing equipment does not produce equipment-required exercise.
- [ ] Replacement exercise respects same constraints.

## Accessibility Tests

- [ ] Core flow works with keyboard.
- [ ] Focus states are visible.
- [ ] Buttons have accessible labels.
- [ ] Forms have labels.
- [ ] High contrast mode works.
- [ ] Large text mode works.
- [ ] Reduced motion mode works.
- [ ] Visual guides have text descriptions.
- [ ] No important information is color-only.

## Fallback Tests

- [ ] App works without LLM key.
- [ ] App works without camera permission.
- [ ] App works if image upload is skipped.
- [ ] App works without speech API.
- [ ] App works with demo personas.
- [ ] App has friendly error states.

## Language Tests

- [ ] No shame-based copy.
- [ ] No medical diagnosis claims.
- [ ] No guaranteed safety claims.
- [ ] No fake heart/mental strength percentage claims.
- [ ] No weight-loss-centered progress.
