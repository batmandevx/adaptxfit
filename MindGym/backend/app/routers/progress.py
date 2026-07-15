"""Exercise results, check-ins and aggregate progress/stats."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..engine import recommend

router = APIRouter(prefix="/api", tags=["progress"])


@router.post("/results", response_model=schemas.ResultOut)
def log_result(payload: schemas.ResultIn, db: Session = Depends(get_db)):
    row = models.ExerciseResult(profile_id=1, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/results", response_model=list[schemas.ResultOut])
def list_results(module: Optional[str] = None, limit: int = 100,
                 db: Session = Depends(get_db)):
    q = db.query(models.ExerciseResult).filter(models.ExerciseResult.profile_id == 1)
    if module:
        q = q.filter(models.ExerciseResult.module == module)
    return q.order_by(models.ExerciseResult.created_at.desc()).limit(limit).all()


@router.post("/checkins", response_model=schemas.CheckInOut)
def add_checkin(payload: schemas.CheckInIn, db: Session = Depends(get_db)):
    row = models.CheckIn(profile_id=1, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/checkins", response_model=list[schemas.CheckInOut])
def list_checkins(limit: int = 30, db: Session = Depends(get_db)):
    return (db.query(models.CheckIn).filter(models.CheckIn.profile_id == 1)
            .order_by(models.CheckIn.created_at.desc()).limit(limit).all())


def _streak(dates: set) -> int:
    if not dates:
        return 0
    streak = 0
    cur = datetime.now().date()
    # allow streak to count from today or yesterday (so it survives until end of day)
    if cur not in dates and (cur - timedelta(days=1)) in dates:
        cur = cur - timedelta(days=1)
    while cur in dates:
        streak += 1
        cur -= timedelta(days=1)
    return streak


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    results = (db.query(models.ExerciseResult)
               .filter(models.ExerciseResult.profile_id == 1).all())
    active_days = {r.created_at.date() for r in results}
    by_module: dict[str, int] = {}
    for r in results:
        by_module[r.module] = by_module.get(r.module, 0) + 1

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    done_today = [
        {"module": r.module, "exercise": r.exercise}
        for r in results if r.created_at >= today
    ]
    total_minutes = round(sum(r.duration_sec for r in results) / 60, 1)
    return {
        "total_sessions": len(results),
        "streak": _streak(active_days),
        "active_days": len(active_days),
        "by_module": by_module,
        "done_today": done_today,
        "total_minutes": total_minutes,
    }


@router.get("/recommendations")
def recommendations(db: Session = Depends(get_db)):
    p = db.get(models.Profile, 1)
    if not p:
        from .profile import get_or_create
        p = get_or_create(db)
    return recommend.recommend(db, p)
