"""Serves static + generated exercise content and the master catalog."""
import random

from fastapi import APIRouter

from ..engine import content

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/catalog")
def catalog():
    return {"modules": content.MODULES, "catalog": content.CATALOG}


@router.get("/phonics")
def phonics(n: int = 8):
    items = random.sample(content.PHONICS, min(n, len(content.PHONICS)))
    out = []
    for it in items:
        options = [it["word"]] + random.sample(it["wrong"], min(3, len(it["wrong"])))
        random.shuffle(options)
        out.append({"word": it["word"], "options": options})
    return out


@router.get("/letters")
def letters():
    return {"letters": content.LETTERS}


@router.get("/passages")
def passages():
    return content.READING_PASSAGES


@router.get("/emotions")
def emotions(n: int = 6):
    pool = content.EMOTIONS
    rounds = []
    targets = random.sample(pool, min(n, len(pool)))
    for t in targets:
        distractors = random.sample([e for e in pool if e["label"] != t["label"]], 3)
        options = [t["label"]] + [d["label"] for d in distractors]
        random.shuffle(options)
        rounds.append({"emoji": t["emoji"], "answer": t["label"], "options": options})
    return rounds


@router.get("/stories")
def stories():
    return content.SOCIAL_STORIES


@router.get("/puzzle")
def puzzle(difficulty: int = 1):
    return content.get_puzzle(difficulty)


@router.get("/orientation")
def orientation():
    return content.get_orientation()


@router.get("/facename")
def facename(n: int = 4):
    return content.make_facename_round(n)
