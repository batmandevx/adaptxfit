# Adaptive Motion Gym Feature Specification

## Required Features

### 1. Ability Profile

Store user-provided profile data for workout personalization.

Include:
- Age range
- Height
- Weight
- Preferred units
- Activity level
- Fitness experience
- Wheelchair use
- Standing ability
- Walking ability
- Balance confidence
- Left arm ability
- Right arm ability
- Left leg ability
- Right leg ability
- Pain areas
- Injury areas
- Prosthetic use
- Movements to avoid
- Support systems
- Equipment
- Goals
- Target muscles
- Workout preferences
- Accessibility preferences
- Coaching tone
- Previous feedback

### 2. Support Mode

Ask what support is available:
- Chair
- Wall
- Wheelchair
- Table
- Resistance band
- Dumbbells
- Cane
- Walker
- Prosthetic
- Partner/helper
- No equipment

### 3. Adaptive Workout Generator

Generate 8 to 10 exercises by default.

Each exercise must include:
- Name
- Target muscles
- Difficulty
- Adaptation tags
- Equipment
- Starting position
- Step-by-step instructions
- Reps or duration
- Rest time
- Safety notes
- Easier alternative
- Harder progression
- Seated/support alternative
- Replacement option
- Voice guidance text
- Visual description
- Confidence note

### 4. Smart Exclusion Engine

Filter exercises that conflict with user needs.

Examples:
- No floor exercises means no planks, pushups, crunches, burpees, mountain climbers.
- Seated-only means no squats, lunges, running, jumping.
- Low balance means no unsupported single-leg exercises.
- One usable arm means no standard pushups, pullups, or two-arm planks.
- Knee pain means no deep squats, lunges, jumping, high-impact cardio.
- Shoulder pain means no overhead presses, heavy pushing, fast arm swings.

### 5. Exercise Replacement

Every exercise needs a “This does not work for me” option.

Reasons:
- Pain
- Unsafe
- Too hard
- Too easy
- Equipment missing
- Movement not possible
- Not accessible
- Want seated version
- Want lower-impact version
- Want different muscle focus

### 6. Adaptive Regeneration

Allow user to change workout:
- Easier
- Harder
- Shorter
- Seated
- Low-impact
- No floor
- Less knee pressure
- Less shoulder use
- More core
- More upper body
- Chair-only
- Wall-only
- No equipment

### 7. Workout Session Mode

Include:
- Start
- Pause
- Resume
- Skip
- Replace exercise
- Rest timer
- Progress indicator
- Voice-ready instructions
- Visual guide
- Safety reminders
- Completion flow

### 8. Voice Guidance

Must support voice guidance or voice-ready fallback.

### 9. Motion Check

Optional camera-based form feedback.

Use cautious language:
- “Your movement appears controlled.”
- “Try moving slower.”
- “Use support if needed.”

Never claim medical correctness.

### 10. Adaptive Motion Sketch

Use rough sketches, silhouettes, icons, or step cards.

Do not claim to create a perfect digital twin.

### 11. Accessibility Panel

Include:
- High contrast
- Large text
- Reduced motion
- Dyslexia-friendly font if possible
- Simple language
- Voice guidance toggle
- Captions/text instructions
- Keyboard support

### 12. Post-Workout Feedback

Ask after workout:
- Comfortable
- Too easy
- Too hard
- Painful
- Unstable
- Tiring but manageable
- Not accessible enough
- Want shorter version
- Want more seated exercises
- Want less knee pressure
- Want less shoulder pressure

### 13. Benefit Summary

Show:
- Movement minutes
- Exercises completed
- Muscles targeted
- Adaptations used
- Estimated intensity
- Comfort rating
- Confidence rating
- Confidence Points
- Badges earned

Do not show fake medical percentages.

### 14. Badges

Use inclusive badges:
- First Movement Completed
- Your Pace Champion
- Gentle Strength
- Supported Motion
- Confidence Builder
- Seated Strength
- Mobility Explorer
- Pain-Aware Progress
- Strength in Every Form
- Adapted Workout Completed

### 15. Mental Gym Bridge

After workout, optionally show:
- 1-minute breathing cooldown
- Reflection prompt
- Continue to Mental Gym
