"""Memory cards with SM-2 spaced repetition (Amnesia module)."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..engine import content
from ..engine.srs import sm2

router = APIRouter(prefix="/api/cards", tags=["memory"])


def _seed_if_empty(db: Session):
    if db.query(models.MemoryCard).filter(models.MemoryCard.profile_id == 1).count() == 0:
        for c in content.STARTER_CARDS:
            db.add(models.MemoryCard(profile_id=1, front=c["front"],
                                     back=c["back"], deck=c["deck"]))
        db.commit()


@router.get("", response_model=list[schemas.CardOut])
def list_cards(db: Session = Depends(get_db)):
    _seed_if_empty(db)
    return (db.query(models.MemoryCard)
            .filter(models.MemoryCard.profile_id == 1)
            .order_by(models.MemoryCard.due).all())


@router.get("/due", response_model=list[schemas.CardOut])
def due_cards(db: Session = Depends(get_db)):
    _seed_if_empty(db)
    return (db.query(models.MemoryCard)
            .filter(models.MemoryCard.profile_id == 1,
                    models.MemoryCard.due <= date.today())
            .order_by(models.MemoryCard.due).all())


@router.post("", response_model=schemas.CardOut)
def create_card(payload: schemas.CardIn, db: Session = Depends(get_db)):
    row = models.MemoryCard(profile_id=1, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{card_id}", response_model=schemas.CardOut)
def edit_card(card_id: int, payload: schemas.CardIn, db: Session = Depends(get_db)):
    row = db.get(models.MemoryCard, card_id)
    if not row:
        raise HTTPException(404, "Card not found")
    row.front, row.back, row.deck = payload.front, payload.back, payload.deck
    db.commit()
    db.refresh(row)
    return row


@router.post("/{card_id}/review", response_model=schemas.CardOut)
def review_card(card_id: int, payload: schemas.ReviewIn, db: Session = Depends(get_db)):
    row = db.get(models.MemoryCard, card_id)
    if not row:
        raise HTTPException(404, "Card not found")
    reps, interval, ease, due = sm2(payload.quality, row.repetitions, row.interval, row.ease)
    row.repetitions, row.interval, row.ease, row.due = reps, interval, ease, due
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    row = db.get(models.MemoryCard, card_id)
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}
