"""Static + generated exercise content, and the master exercise catalog.

The catalog is the single source of truth shared with the frontend
(via GET /api/content/catalog) so navigation and recommendations stay in sync.
"""
import random
from datetime import datetime

# --------------------------------------------------------------------------
# Master catalog: every trainable exercise in MindGym.
# --------------------------------------------------------------------------
CATALOG = [
    # ADHD
    {"module": "adhd", "id": "focus", "title": "Focus Timer",
     "desc": "Pomodoro focus sessions with gentle pacing and body-doubling.",
     "icon": "\u23f1\ufe0f", "route": "/adhd/focus", "conditions": ["adhd", "brainfog"], "est_min": 25},
    {"module": "adhd", "id": "gonogo", "title": "Attention Game",
     "desc": "Go / No-Go reaction drill that trains sustained attention & impulse control.",
     "icon": "\U0001f7e2", "route": "/adhd/gonogo", "conditions": ["adhd"], "est_min": 4},
    {"module": "adhd", "id": "tasks", "title": "Task Breakdown",
     "desc": "Shrink an overwhelming task into tiny, checkable steps with rewards.",
     "icon": "\u2705", "route": "/adhd/tasks", "conditions": ["adhd", "brainfog"], "est_min": 5},
    # Dyslexia
    {"module": "dyslexia", "id": "reading", "title": "Reading Assist",
     "desc": "Read with text-to-speech, word highlighting and dyslexia-friendly spacing.",
     "icon": "\U0001f4d6", "route": "/dyslexia/reading", "conditions": ["dyslexia"], "est_min": 8},
    {"module": "dyslexia", "id": "phonics", "title": "Phonics Game",
     "desc": "Hear a word, choose the correct spelling. Builds phonological awareness.",
     "icon": "\U0001f524", "route": "/dyslexia/phonics", "conditions": ["dyslexia"], "est_min": 5},
    {"module": "dyslexia", "id": "letters", "title": "Letter Flip",
     "desc": "Tell apart easily-reversed letters: b d p q.",
     "icon": "\U0001f500", "route": "/dyslexia/letters", "conditions": ["dyslexia"], "est_min": 4},
    # Brain fog
    {"module": "brainfog", "id": "checkin", "title": "Daily Check-In",
     "desc": "Log sleep, energy, mood, focus & fog so your plan adapts to today.",
     "icon": "\U0001f4dd", "route": "/brainfog/checkin", "conditions": ["brainfog", "adhd", "amnesia"], "est_min": 2},
    {"module": "brainfog", "id": "puzzle", "title": "Clarity Puzzle",
     "desc": "A light, low-pressure puzzle to gently switch your brain on.",
     "icon": "\U0001f9e9", "route": "/brainfog/puzzle", "conditions": ["brainfog"], "est_min": 3},
    {"module": "brainfog", "id": "breathe", "title": "Box Breathing",
     "desc": "Guided 4-4-4-4 breathing to clear fog and reset focus.",
     "icon": "\U0001f9d8", "route": "/brainfog/breathe", "conditions": ["brainfog", "adhd", "autism"], "est_min": 3},
    # Amnesia
    {"module": "amnesia", "id": "memory", "title": "Memory Trainer",
     "desc": "Spaced-repetition flashcards that resurface just before you'd forget.",
     "icon": "\U0001f9e0", "route": "/amnesia/memory", "conditions": ["amnesia"], "est_min": 7},
    {"module": "amnesia", "id": "orientation", "title": "Orientation",
     "desc": "A calm daily grounding: where, when and who you are today.",
     "icon": "\U0001f9ed", "route": "/amnesia/orientation", "conditions": ["amnesia"], "est_min": 2},
    {"module": "amnesia", "id": "journal", "title": "Memory Journal",
     "desc": "Capture what happened today; search your past in seconds.",
     "icon": "\U0001f4d3", "route": "/amnesia/journal", "conditions": ["amnesia"], "est_min": 4},
    {"module": "amnesia", "id": "facename", "title": "Face & Name",
     "desc": "Learn and recall name\u2013face pairs with friendly avatars.",
     "icon": "\U0001f9d1", "route": "/amnesia/facename", "conditions": ["amnesia"], "est_min": 5},
    # Autism
    {"module": "autism", "id": "schedule", "title": "Visual Schedule",
     "desc": "A predictable, picture-based plan for the day you can tick off.",
     "icon": "\U0001f5d3\ufe0f", "route": "/autism/schedule", "conditions": ["autism", "adhd"], "est_min": 4},
    {"module": "autism", "id": "emotions", "title": "Emotion Match",
     "desc": "Recognise feelings from faces \u2014 builds emotional literacy.",
     "icon": "\U0001f642", "route": "/autism/emotions", "conditions": ["autism"], "est_min": 5},
    {"module": "autism", "id": "stories", "title": "Social Stories",
     "desc": "Step-by-step guides for everyday social situations.",
     "icon": "\U0001f4ac", "route": "/autism/stories", "conditions": ["autism"], "est_min": 6},
    {"module": "autism", "id": "calm", "title": "Calm Space",
     "desc": "A low-stimulation, full-screen space to self-regulate.",
     "icon": "\U0001f30a", "route": "/autism/calm", "conditions": ["autism", "brainfog", "adhd"], "est_min": 5},
]

MODULES = {
    "adhd": {"title": "ADHD", "icon": "\U0001f3af", "blurb": "Focus, attention & follow-through."},
    "dyslexia": {"title": "Dyslexia", "icon": "\U0001f4d6", "blurb": "Friendlier reading & spelling."},
    "brainfog": {"title": "Brain Fog", "icon": "\U0001f324\ufe0f", "blurb": "Gentle clarity & energy."},
    "amnesia": {"title": "Memory", "icon": "\U0001f9e0", "blurb": "Remember more, worry less."},
    "autism": {"title": "Autism", "icon": "\U0001f9e9", "blurb": "Predictability & social ease."},
}

# --------------------------------------------------------------------------
# Dyslexia content
# --------------------------------------------------------------------------
PHONICS = [
    {"word": "friend", "wrong": ["freind", "frend", "fraind"]},
    {"word": "because", "wrong": ["becuse", "becouse", "becaus"]},
    {"word": "people", "wrong": ["peeple", "poeple", "peopel"]},
    {"word": "beautiful", "wrong": ["beutiful", "beautifull", "buetiful"]},
    {"word": "necessary", "wrong": ["neccessary", "necesary", "nesessary"]},
    {"word": "tomorrow", "wrong": ["tommorow", "tomorow", "tomorrowe"]},
    {"word": "different", "wrong": ["diferent", "differant", "diffrent"]},
    {"word": "answer", "wrong": ["anser", "ansewr", "answar"]},
    {"word": "island", "wrong": ["iland", "islund", "ailand"]},
    {"word": "enough", "wrong": ["enuff", "enuogh", "enough "]},
]

LETTERS = ["b", "d", "p", "q"]

READING_PASSAGES = [
    {"title": "A Calm Morning",
     "text": ("The sun came up slowly over the quiet hill. A small bird sang a soft song. "
              "The air felt cool and fresh. It was a calm and gentle start to the day.")},
    {"title": "The Helpful Robot",
     "text": ("A little robot lived in a busy house. Every day it helped tidy the rooms. "
              "It moved one small thing at a time. Step by step, the whole house became neat.")},
    {"title": "Down by the Sea",
     "text": ("Waves rolled onto the warm sand. Children built tall castles near the water. "
              "A friendly dog ran along the beach. Everyone smiled in the bright afternoon light.")},
]

# --------------------------------------------------------------------------
# Autism content
# --------------------------------------------------------------------------
EMOTIONS = [
    {"emoji": "\U0001f600", "label": "Happy"},
    {"emoji": "\U0001f622", "label": "Sad"},
    {"emoji": "\U0001f620", "label": "Angry"},
    {"emoji": "\U0001f628", "label": "Scared"},
    {"emoji": "\U0001f62e", "label": "Surprised"},
    {"emoji": "\U0001f644", "label": "Bored"},
    {"emoji": "\U0001f60c", "label": "Calm"},
    {"emoji": "\U0001f615", "label": "Confused"},
    {"emoji": "\U0001f970", "label": "Loved"},
    {"emoji": "\U0001f612", "label": "Annoyed"},
]

SOCIAL_STORIES = [
    {"title": "Saying Hello", "icon": "\U0001f44b",
     "steps": ["Notice the person and make soft eye contact (or look near their face).",
               "Smile a little if it feels okay.",
               "Say \u201cHi\u201d or \u201cHello\u201d in a calm voice.",
               "Wait for them to say hello back.",
               "It is okay if you feel nervous \u2014 you did the kind thing."]},
    {"title": "Asking for a Break", "icon": "\u270b",
     "steps": ["Notice your body feels tense, loud, or too full.",
               "That is a signal that a break can help.",
               "Calmly say \u201cI need a short break, please.\u201d",
               "Go to a quiet space you have chosen before.",
               "Breathe slowly until your body feels softer.",
               "Return when you are ready. Breaks are allowed."]},
    {"title": "Joining a Group", "icon": "\U0001f465",
     "steps": ["Stand near the group and watch what they are doing.",
               "Wait for a pause in the talking.",
               "Say \u201cCan I join you?\u201d",
               "If they say yes, sit or stand with them.",
               "If they say not now, that is okay \u2014 try another time or another group."]},
    {"title": "When Plans Change", "icon": "\U0001f504",
     "steps": ["Sometimes a plan changes suddenly. This can feel hard.",
               "Take one slow breath in, and one slow breath out.",
               "Tell yourself: \u201cA change is uncomfortable, not dangerous.\u201d",
               "Ask: \u201cWhat is the new plan?\u201d so you know what happens next.",
               "Do one small first step of the new plan."]},
]

# --------------------------------------------------------------------------
# Amnesia content
# --------------------------------------------------------------------------
FACE_AVATARS = ["\U0001f468\u200d\U0001f9b0", "\U0001f469\u200d\U0001f9b1", "\U0001f471\u200d\u2642\ufe0f",
                "\U0001f471\u200d\u2640\ufe0f", "\U0001f468\u200d\U0001f9b3", "\U0001f469\u200d\U0001f9b0",
                "\U0001f9d4\u200d\u2642\ufe0f", "\U0001f475", "\U0001f9d3", "\U0001f9d1\u200d\U0001f9b2"]
FACE_NAMES = ["Maya", "Leo", "Sara", "Omar", "Ivy", "Noah", "Aria", "Sam", "Ravi", "Nina",
              "Kofi", "Lena", "Theo", "Priya", "Hugo", "Zoe"]

STARTER_CARDS = [
    {"front": "What is my home address?", "back": "(Tap edit to add your address)", "deck": "Daily life"},
    {"front": "Who do I call in an emergency?", "back": "(Add your emergency contact)", "deck": "Daily life"},
    {"front": "What day do I take the bins out?", "back": "(Add your bin day)", "deck": "Daily life"},
    {"front": "Capital of France", "back": "Paris", "deck": "General"},
]

# --------------------------------------------------------------------------
# Brain-fog: clarity puzzle generator
# --------------------------------------------------------------------------
def get_puzzle(difficulty: int = 1):
    difficulty = max(1, min(4, int(difficulty)))
    kind = random.choice(["sequence", "odd_one_out", "next_letter"])

    if kind == "sequence":
        start = random.randint(1, 5 * difficulty)
        step = random.randint(2, 2 + difficulty)
        seq = [start + step * i for i in range(4)]
        answer = start + step * 4
        opts = {answer, answer + step, answer - step, answer + random.randint(1, 3)}
        return _puzzle("sequence", f"What comes next?  {', '.join(map(str, seq))}, ?",
                       sorted(opts), str(answer), f"The numbers go up by {step} each time.")

    if kind == "odd_one_out":
        base_even = random.random() < 0.5
        nums = []
        while len(nums) < 4:
            n = random.randint(2, 20 * difficulty)
            if (n % 2 == 0) == base_even and n not in nums:
                nums.append(n)
        odd = None
        while odd is None:
            n = random.randint(2, 20 * difficulty)
            if (n % 2 == 0) != base_even:
                odd = n
        options = nums + [odd]
        random.shuffle(options)
        kindword = "even" if base_even else "odd"
        return _puzzle("odd_one_out", f"All but one of these are {kindword}. Which is the odd one out?",
                       options, str(odd), f"{odd} is the only {'odd' if base_even else 'even'} number.")

    # next_letter
    start_i = random.randint(0, 20)
    step = random.randint(1, 1 + difficulty)
    letters = [chr(ord('A') + (start_i + step * i) % 26) for i in range(4)]
    ans = chr(ord('A') + (start_i + step * 4) % 26)
    opts = {ans, chr(ord('A') + (start_i + step * 4 + 1) % 26),
            chr(ord('A') + (start_i + step * 4 - 1) % 26),
            chr(ord('A') + (start_i + step * 4 + 2) % 26)}
    return _puzzle("next_letter", f"What letter comes next?  {', '.join(letters)}, ?",
                   sorted(opts), ans, f"The letters skip {step - 1} each step." if step > 1 else "The letters go in order.")


def _puzzle(kind, prompt, options, answer, explanation):
    return {"type": kind, "prompt": prompt, "options": [str(o) for o in options],
            "answer": str(answer), "explanation": explanation}


# --------------------------------------------------------------------------
# Amnesia: orientation
# --------------------------------------------------------------------------
def get_orientation():
    now = datetime.now()
    hour = now.hour
    if hour < 5:
        part = "night"
    elif hour < 12:
        part = "morning"
    elif hour < 17:
        part = "afternoon"
    elif hour < 21:
        part = "evening"
    else:
        part = "night"
    return {
        "weekday": now.strftime("%A"),
        "day": now.day,
        "month": now.strftime("%B"),
        "year": now.year,
        "time": now.strftime("%I:%M %p").lstrip("0"),
        "part_of_day": part,
        "iso": now.strftime("%Y-%m-%d"),
    }


def make_facename_round(n: int = 4):
    n = max(2, min(6, n))
    names = random.sample(FACE_NAMES, n)
    faces = random.sample(FACE_AVATARS, n)
    people = [{"name": names[i], "face": faces[i]} for i in range(n)]
    target = random.randrange(n)
    return {"people": people, "target_index": target, "target_name": names[target]}
