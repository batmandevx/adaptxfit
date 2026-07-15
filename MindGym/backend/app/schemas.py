"""Pydantic request/response schemas."""
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ProfileIn(BaseModel):
    name: Optional[str] = None
    conditions: Optional[list[str]] = None
    preferences: Optional[dict[str, Any]] = None
    onboarded: Optional[bool] = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    conditions: list[str]
    preferences: dict[str, Any]
    onboarded: bool


class ResultIn(BaseModel):
    module: str
    exercise: str
    score: float = 0
    accuracy: float = 0
    duration_sec: float = 0
    difficulty: int = 1
    details: dict[str, Any] = {}


class ResultOut(ResultIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class CheckInIn(BaseModel):
    sleep: int = 3
    energy: int = 3
    mood: int = 3
    focus: int = 3
    fog: int = 3
    note: str = ""


class CheckInOut(CheckInIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class CardIn(BaseModel):
    front: str
    back: str
    deck: str = "General"


class CardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    front: str
    back: str
    deck: str
    repetitions: int
    interval: int
    ease: float
    due: date


class ReviewIn(BaseModel):
    quality: int  # 0..5


class ScheduleIn(BaseModel):
    title: str
    icon: str = "\u2b50"
    time: str = ""
    order: int = 0
    done: bool = False


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    time: Optional[str] = None
    order: Optional[int] = None
    done: Optional[bool] = None


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    icon: str
    time: str
    order: int
    done: bool


class JournalIn(BaseModel):
    text: str
    tags: list[str] = []


class JournalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    tags: list[str]
    created_at: datetime
