"""Memory journal (Amnesia module)."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.get("", response_model=list[schemas.JournalOut])
def list_entries(q: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.JournalEntry).filter(models.JournalEntry.profile_id == 1)
    if q:
        query = query.filter(models.JournalEntry.text.ilike(f"%{q}%"))
    return query.order_by(models.JournalEntry.created_at.desc()).limit(limit).all()


@router.post("", response_model=schemas.JournalOut)
def add_entry(payload: schemas.JournalIn, db: Session = Depends(get_db)):
    row = models.JournalEntry(profile_id=1, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    row = db.get(models.JournalEntry, entry_id)
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}
