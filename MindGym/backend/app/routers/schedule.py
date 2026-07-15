"""Visual daily schedule (Autism module)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/schedule", tags=["schedule"])

DEFAULT = [
    {"title": "Wake up & stretch", "icon": "\u2600\ufe0f", "time": "07:30"},
    {"title": "Breakfast", "icon": "\U0001f963", "time": "08:00"},
    {"title": "Morning focus session", "icon": "\u23f1\ufe0f", "time": "09:30"},
    {"title": "Move / walk", "icon": "\U0001f6b6", "time": "12:30"},
    {"title": "Lunch", "icon": "\U0001f957", "time": "13:00"},
    {"title": "Calm break", "icon": "\U0001f9d8", "time": "15:30"},
    {"title": "Wind down", "icon": "\U0001f319", "time": "21:00"},
]


def _seed_if_empty(db: Session):
    if db.query(models.ScheduleItem).filter(models.ScheduleItem.profile_id == 1).count() == 0:
        for i, d in enumerate(DEFAULT):
            db.add(models.ScheduleItem(profile_id=1, order=i, **d))
        db.commit()


@router.get("", response_model=list[schemas.ScheduleOut])
def list_items(db: Session = Depends(get_db)):
    _seed_if_empty(db)
    return (db.query(models.ScheduleItem)
            .filter(models.ScheduleItem.profile_id == 1)
            .order_by(models.ScheduleItem.order).all())


@router.post("", response_model=schemas.ScheduleOut)
def add_item(payload: schemas.ScheduleIn, db: Session = Depends(get_db)):
    count = db.query(models.ScheduleItem).filter(models.ScheduleItem.profile_id == 1).count()
    data = payload.model_dump()
    if not data.get("order"):
        data["order"] = count
    row = models.ScheduleItem(profile_id=1, **data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{item_id}", response_model=schemas.ScheduleOut)
def update_item(item_id: int, payload: schemas.ScheduleUpdate, db: Session = Depends(get_db)):
    row = db.get(models.ScheduleItem, item_id)
    if not row:
        raise HTTPException(404, "Item not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    row = db.get(models.ScheduleItem, item_id)
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}


@router.post("/reset-day")
def reset_day(db: Session = Depends(get_db)):
    rows = db.query(models.ScheduleItem).filter(models.ScheduleItem.profile_id == 1).all()
    for r in rows:
        r.done = False
    db.commit()
    return {"ok": True, "count": len(rows)}
