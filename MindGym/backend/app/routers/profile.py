"""Profile: a single local profile (id=1) created on first use."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/profile", tags=["profile"])

DEFAULT_PREFS = {
    "theme": "calm",
    "font": "system",
    "fontScale": 1.0,
    "reducedMotion": False,
    "tts": True,
}


def get_or_create(db: Session) -> models.Profile:
    p = db.get(models.Profile, 1)
    if not p:
        p = models.Profile(id=1, name="Friend", conditions=[],
                            preferences=dict(DEFAULT_PREFS), onboarded=False)
        db.add(p)
        db.commit()
        db.refresh(p)
    return p


@router.get("", response_model=schemas.ProfileOut)
def read_profile(db: Session = Depends(get_db)):
    return get_or_create(db)


@router.put("", response_model=schemas.ProfileOut)
def update_profile(payload: schemas.ProfileIn, db: Session = Depends(get_db)):
    p = get_or_create(db)
    if payload.name is not None:
        p.name = payload.name
    if payload.conditions is not None:
        p.conditions = payload.conditions
    if payload.preferences is not None:
        merged = dict(p.preferences or {})
        merged.update(payload.preferences)
        p.preferences = merged
    if payload.onboarded is not None:
        p.onboarded = payload.onboarded
    db.commit()
    db.refresh(p)
    return p
