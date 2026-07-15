"""SM-2 spaced-repetition scheduling (the classic SuperMemo-2 algorithm).

Used by the Amnesia memory trainer so cards the user finds hard come back
sooner, and easy cards are spaced further out.
"""
from datetime import date, timedelta


def sm2(quality: int, repetitions: int, interval: int, ease: float):
    """Return updated (repetitions, interval_days, ease, due_date).

    quality: how well the user recalled the card, 0 (blackout) .. 5 (perfect).
    """
    quality = max(0, min(5, int(quality)))

    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease)
        repetitions += 1

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease = max(1.3, ease)

    due = date.today() + timedelta(days=interval)
    return repetitions, interval, ease, due
