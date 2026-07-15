"""Adaptive daily-plan recommendation.

Picks today's exercises from the catalog based on the user's conditions,
their most recent check-in (low energy -> gentler picks), and what they have
already completed today. Also computes an adaptive difficulty per exercise
from recent performance.
"""
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from . import content
from .. import models

# Exercises that are gentle / low-load - surfaced first on rough days.
GENTLE = {"breathe", "calm", "checkin", "orientation", "reading", "journal", "stories"}
# Higher-load, more demanding exercises - de-prioritised on rough days.
DEMANDING = {"gonogo", "puzzle", "memory", "phonics"}


def todays_results(db: Session, profile_id: int = 1):
    start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return (db.query(models.ExerciseResult)
            .filter(models.ExerciseResult.profile_id == profile_id,
                    models.ExerciseResult.created_at >= start)
            .all())


def adaptive_difficulty(db: Session, module: str, exercise: str, profile_id: int = 1) -> int:
    """Difficulty 1..4 based on the average accuracy of the last 5 attempts."""
    rows = (db.query(models.ExerciseResult)
            .filter(models.ExerciseResult.profile_id == profile_id,
                    models.ExerciseResult.module == module,
                    models.ExerciseResult.exercise == exercise)
            .order_by(models.ExerciseResult.created_at.desc())
            .limit(5).all())
    if not rows:
        return 1
    avg = sum(r.accuracy for r in rows) / len(rows)
    if avg >= 0.9:
        return min(4, rows[0].difficulty + 1)
    if avg < 0.6:
        return max(1, rows[0].difficulty - 1)
    return max(1, rows[0].difficulty)


def recommend(db: Session, profile: "models.Profile"):
    conditions = profile.conditions or list(content.MODULES.keys())
    done_today = {(r.module, r.exercise) for r in todays_results(db, profile.id)}

    last = (db.query(models.CheckIn)
            .filter(models.CheckIn.profile_id == profile.id)
            .order_by(models.CheckIn.created_at.desc()).first())
    # "rough day" = low energy/mood/focus or heavy fog (fog is reverse-scored 1..5)
    rough = False
    if last:
        rough = (last.energy <= 2 or last.mood <= 2 or last.focus <= 2 or last.fog >= 4)

    picks = []
    for item in content.CATALOG:
        if not any(c in conditions for c in item["conditions"]):
            continue
        score = 0
        # relevance: how many of the user's conditions this helps
        score += sum(3 for c in item["conditions"] if c in conditions)
        if rough and item["id"] in GENTLE:
            score += 5
        if rough and item["id"] in DEMANDING:
            score -= 4
        if (item["module"], item["id"]) in done_today:
            score -= 8  # already done today -> push down but still visible
        picks.append({**item,
                      "done_today": (item["module"], item["id"]) in done_today,
                      "_score": score})

    picks.sort(key=lambda x: x["_score"], reverse=True)

    suggest_checkin = last is None or (datetime.now() - last.created_at) > timedelta(hours=20)

    return {
        "rough_day": rough,
        "suggest_checkin": suggest_checkin,
        "plan": picks[:6],
        "all": picks,
    }
