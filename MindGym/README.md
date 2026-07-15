# MindGym 🧠

**A gentle, accessible cognitive gym for minds that work differently.**

MindGym is a local-first web app that acts like a "gym for the brain" for people
living with **ADHD, dyslexia, brain fog, memory difficulties (amnesia), and autism**.
After a short onboarding it builds a **personalised daily plan** and offers focused
training exercises plus everyday support tools — all wrapped in an
**accessibility-first** interface.

> 🔒 **Private by design.** Everything you do stays on your own machine in a local
> SQLite database. Nothing is uploaded anywhere.

---

## ✨ What's inside

Every area has its own set of exercises:

| Area | Exercises |
|------|-----------|
| 🎯 **ADHD** | Focus Timer (Pomodoro + body-doubling) · Go/No-Go attention game · Task Breakdown |
| 📖 **Dyslexia** | Reading Assist (text-to-speech + word highlighting) · Phonics game · Letter Flip (b/d/p/q) |
| 🌥️ **Brain Fog** | Daily Check-In · Clarity Puzzles (adaptive) · Box Breathing |
| 🧠 **Memory** | Spaced-repetition Trainer (SM-2) · Orientation · Memory Journal · Face & Name |
| 🧩 **Autism** | Visual Schedule · Emotion Match · Social Stories · Calm Space |

### Built for everyone, always available
- **Accessibility bar** on every screen: themes (Calm / Light / Dark / **High-contrast**),
  **dyslexia-friendly font**, text-size control, **reduce-motion**, and **read-aloud**.
- **Adaptive plan** — your daily recommendations shift based on your latest check-in
  (gentler exercises on rough days) and what you've already done.
- **Adaptive difficulty** — puzzles get easier or harder based on recent performance.
- **Gentle gamification** — streaks, progress charts and encouragement, never pressure.

---

## 🏗️ Architecture

```
MindGym/
├── backend/                 # Python · FastAPI (the "cognitive engine")
│   ├── app/
│   │   ├── main.py          # app + routers + CORS
│   │   ├── database.py      # SQLite via SQLAlchemy (local-first)
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic I/O
│   │   ├── engine/
│   │   │   ├── srs.py       # SM-2 spaced-repetition algorithm
│   │   │   ├── content.py   # exercise content + master catalog
│   │   │   └── recommend.py # adaptive daily-plan logic
│   │   └── routers/         # profile, progress, memory, schedule, journal, content
│   └── requirements.txt
├── frontend/                # Node · React + Vite (accessible UI)
│   └── src/
│       ├── context/         # AccessibilityContext, ProfileContext
│       ├── components/      # Layout, AccessibilityBar, shared UI
│       ├── pages/           # Onboarding, Dashboard, Progress
│       └── modules/         # adhd · dyslexia · brainfog · amnesia · autism
├── data/                    # SQLite DB + logs (created on first run)
├── start.ps1                # the only script you run to start everything
└── stop.ps1                 # stops everything cleanly
```

**Node** powers the friendly, themeable frontend. **Python** powers the brain:
spaced-repetition scheduling, adaptive recommendations and exercise content.
The frontend talks to the backend through Vite's `/api` proxy, so it all behaves
as one origin in the browser.

---

## 🚀 Getting started

**Prerequisites:** Python 3.10+ and Node.js 18+ on your PATH.

```powershell
# from the MindGym folder
.\start.ps1
```

The first run creates a Python virtual environment, installs all dependencies, and
launches both servers. When it's ready, open:

> **http://localhost:5173**

To stop everything:

```powershell
.\stop.ps1
```

That's it — **`start.ps1` and `stop.ps1` are the only scripts you ever need to run.**
All installation and run logic lives inside them.

---

## 🧩 How the adaptive plan works

1. You pick the areas you'd like to train during onboarding.
2. A quick **Daily Check-In** records sleep, energy, mood, focus and fog.
3. The backend's `recommend.py` ranks exercises by relevance to your areas, then
   boosts gentle activities (and de-prioritises demanding ones) when your check-in
   suggests a harder day.
4. As you complete exercises, results are logged locally and feed your **streak**,
   **progress charts**, and the **adaptive difficulty** of future puzzles.

---

## ♿ Accessibility notes

- All interactive controls are keyboard-reachable with clear focus outlines.
- High-contrast theme + scalable text for low vision.
- Reduce-motion disables animations for vestibular comfort.
- Read-aloud uses the browser's built-in speech synthesis (best in Edge/Chrome).
- The dyslexia font falls back gracefully to Comic Sans / system fonts if the web
  font can't be fetched.

---

## ⚠️ A note on care

MindGym is a **supportive training and wellbeing tool**, not a medical device and
not a substitute for professional diagnosis, therapy or treatment. If you're
struggling, please reach out to a qualified clinician.
