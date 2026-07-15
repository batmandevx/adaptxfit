"""MindGym API - a local-first cognitive training & support companion.

All data is stored locally in data/mindgym.db. Nothing leaves the machine.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (ensure models are registered)
from .database import Base, engine
from .routers import content, journal, memory, profile, progress, schedule

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MindGym API", version="1.0.0")

# Frontend talks to us via Vite's /api proxy; allow-all is a safe local fallback.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(progress.router)
app.include_router(memory.router)
app.include_router(schedule.router)
app.include_router(journal.router)
app.include_router(content.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "mindgym"}
