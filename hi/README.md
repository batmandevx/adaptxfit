# AdaptiFit — the unified inclusive health & fitness companion

> Your pace. Your ability. Your movement — for body **and** mind.

AdaptiFit is the single, merged application for this repository. It brings every
feature from the separate hackathon prototypes together into **one** accessible,
modern app built with **Next.js 16, React 19, Tailwind CSS 4, shadcn/ui and
Prisma**. The UI is based on the `ayush` design (delivered in this `hi/` folder)
and the distinctive features of the other prototypes have been merged in.

## What was merged

| Source prototype | What it contributed | Where it lives now |
|---|---|---|
| **`hi/` (ayush)** | The whole modern UI shell, dashboard, exercises, mood, nutrition, community, wearable, breathing, crisis, voice, accessibility | This app (base) |
| **gym-buddy / AccessFit** | **Real on-device rep counting & form coaching** (MediaPipe Pose) | **Live Coach** section (`live-coach.tsx`) |
| **MindGym** | **Cognitive training** — focus timer, attention game, memory match, daily check-in (ADHD / brain fog / memory) | **Mind Gym** section (`mind-gym.tsx`) |
| **Adaptive Motion Gym** | Adaptive, accessibility-first workout philosophy, body-neutral profile (disability / injury / Paralympic category) | Body Scan, Exercises, Profile setup |

## Feature map (all sections)

- **Dashboard** — achievements, daily challenges, weekly goals, health insights,
  sleep, hydration, rehab timeline, pain journal.
- **Body Scan** — guided posture/motion demonstration with form readouts.
- **Live Coach** *(merged from AccessFit)* — your camera counts real reps and
  coaches your form live, entirely on-device. Pick an exercise (bicep curl,
  shoulder press, lateral raise, squat) and an accessible/standard/strict range
  of motion. No video ever leaves the device.
- **Exercises** — adaptive exercise library, health search, workout-plan builder.
- **Mind Gym** *(merged from MindGym)* — a gentle gym for the brain:
  - **Focus Timer** — calm Pomodoro for ADHD / focus.
  - **Attention Game** — Go/No-Go for sustained attention & impulse control.
  - **Memory Match** — working-memory pairs game.
  - **Daily Check-In** — adapts a gentle suggestion to how today feels (brain fog).
- **Breathing** — guided breathing patterns + meditation timer.
- **Mood** — emotion tracking with supportive, safety-aware messaging.
- **Nutrition** — food logging, calories, diet planning.
- **Community** — peer support and coaching.
- **Wearable** — heart rate, SpO₂, blood pressure integration.
- **Crisis** — emergency contacts, grounding, safety planning.
- Plus global **voice navigation**, **text-to-speech**, an **accessibility
  widget**, notifications and an **AI chat** coach.

## Running it

From the **repository root**, just run the one script:

```powershell
./start.ps1     # installs deps on first run, prepares the DB, starts on :3000
./stop.ps1      # stops the app
```

Then open **http://localhost:3000**.

### Manual / advanced

```bash
cd hi
npm install --legacy-peer-deps   # React 19 peer deps
npx prisma generate              # generate the Prisma client
npx prisma db push               # create/sync the local SQLite tables
npm run dev                      # http://localhost:3000
```

Requirements: **Node 18+** (built on Node 22). A modern browser. Live Coach needs
camera permission and works on `localhost` or HTTPS.

## Environment

A local `.env` is included with the SQLite connection string:

```
DATABASE_URL="file:../db/custom.db"
```

No external API keys are required for the core experience. The database is local
SQLite (`hi/db/custom.db`) — nothing is uploaded.

## Privacy & safety

- **Live Coach** processes camera frames **on your device only**; no video is
  stored or uploaded. The pose model is fetched from a public CDN at runtime.
- **Mind Gym** stores your daily check-in in the browser's `localStorage`.
- AdaptiFit offers **general inclusive wellbeing guidance only** — it is not a
  medical device and does not diagnose or treat. Stop any movement if you feel
  pain, dizziness, numbness or discomfort.

## Project layout

```
hi/
├─ src/app/
│  ├─ page.tsx               # app shell: nav, section routing, hero, voice nav
│  ├─ layout.tsx, globals.css
│  └─ api/                   # Next.js route handlers (Prisma-backed)
├─ src/components/
│  ├─ features/              # all feature modules (incl. live-coach, mind-gym)
│  └─ ui/                    # shadcn/ui primitives
├─ src/stores/               # zustand stores (app + accessibility)
├─ prisma/schema.prisma      # SQLite data model
└─ db/custom.db              # local database
```

The original standalone prototypes remain in the repository (`MindGym/`,
`gym-buddy/`, and the root `src/` Adaptive Motion Gym) for reference, but
**AdaptiFit in this `hi/` folder is the single, canonical app.**
