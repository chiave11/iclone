from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth_utils import hash_password, verify_password, create_token, get_current_user_id
from llm_service import chat_stream_once, generate_text

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api = APIRouter(prefix="/api")

logger = logging.getLogger("iclone")
logging.basicConfig(level=logging.INFO)


# -------- Models --------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    tone: Optional[str] = None
    interests: Optional[List[str]] = None
    habits: Optional[List[str]] = None
    goals: Optional[str] = None
    wakeUp: Optional[str] = None
    completedOnboarding: Optional[bool] = None
    # fitness/nutrition
    weight: Optional[float] = None
    height: Optional[float] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    fitness_goal: Optional[str] = None
    activity_level: Optional[str] = None
    diet_preference: Optional[str] = None


class EventIn(BaseModel):
    title: str
    time: str
    date: str
    color: str = "coral"
    type: str = "work"


class ReminderIn(BaseModel):
    text: str
    priority: str = "media"
    due_at: Optional[str] = None  # ISO datetime for notifications


class ReminderUpdate(BaseModel):
    text: Optional[str] = None
    priority: Optional[str] = None
    done: Optional[bool] = None
    due_at: Optional[str] = None


class NoteIn(BaseModel):
    title: str
    content: str
    color: str = "coral"


class ChatIn(BaseModel):
    text: str
    mode: Literal["general", "fitness", "nutrition", "psychology"] = "general"


class CoachPlanIn(BaseModel):
    kind: Literal["fitness", "nutrition"]
    extra_notes: Optional[str] = None


# -------- Helpers --------
def _public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name") or "",
        "nickname": u.get("nickname") or "",
        "tone": u.get("tone") or "amichevole",
        "interests": u.get("interests") or [],
        "habits": u.get("habits") or [],
        "goals": u.get("goals") or "",
        "wakeUp": u.get("wakeUp") or "07:30",
        "completedOnboarding": bool(u.get("completedOnboarding")),
        "weight": u.get("weight"),
        "height": u.get("height"),
        "age": u.get("age"),
        "sex": u.get("sex"),
        "fitness_goal": u.get("fitness_goal"),
        "activity_level": u.get("activity_level"),
        "diet_preference": u.get("diet_preference"),
    }


async def _get_user(uid: str) -> dict:
    u = await db.users.find_one({"id": uid})
    if not u:
        raise HTTPException(404, "User not found")
    return u


# -------- Auth --------
@api.get("/")
async def root():
    return {"message": "iClone API", "ok": True}


@api.post("/auth/register")
async def register(data: RegisterIn):
    exists = await db.users.find_one({"email": data.email.lower()})
    if exists:
        raise HTTPException(400, "Email gia' registrata")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name or "",
        "tone": "amichevole",
        "interests": [],
        "habits": [],
        "goals": "",
        "wakeUp": "07:30",
        "completedOnboarding": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(uid)
    return {"token": token, "user": _public_user(user_doc)}


@api.post("/auth/login")
async def login(data: LoginIn):
    u = await db.users.find_one({"email": data.email.lower()})
    if not u or not verify_password(data.password, u.get("password_hash", "")):
        raise HTTPException(401, "Credenziali non valide")
    token = create_token(u["id"])
    return {"token": token, "user": _public_user(u)}


@api.get("/auth/me")
async def me(uid: str = Depends(get_current_user_id)):
    u = await _get_user(uid)
    return _public_user(u)


# -------- Profile --------
@api.put("/profile")
async def update_profile(data: ProfileUpdate, uid: str = Depends(get_current_user_id)):
    patch = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if patch:
        await db.users.update_one({"id": uid}, {"$set": patch})
    u = await _get_user(uid)
    return _public_user(u)


# -------- Events --------
@api.get("/events")
async def list_events(uid: str = Depends(get_current_user_id)):
    cur = db.events.find({"user_id": uid}).sort("created_at", -1)
    return [{k: v for k, v in doc.items() if k != "_id"} async for doc in cur]


@api.post("/events")
async def create_event(data: EventIn, uid: str = Depends(get_current_user_id)):
    doc = {"id": str(uuid.uuid4()), "user_id": uid, "created_at": now_iso(), **data.model_dump()}
    await db.events.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.delete("/events/{eid}")
async def delete_event(eid: str, uid: str = Depends(get_current_user_id)):
    await db.events.delete_one({"id": eid, "user_id": uid})
    return {"ok": True}


# -------- Reminders --------
@api.get("/reminders")
async def list_reminders(uid: str = Depends(get_current_user_id)):
    cur = db.reminders.find({"user_id": uid}).sort("created_at", -1)
    return [{k: v for k, v in doc.items() if k != "_id"} async for doc in cur]


@api.post("/reminders")
async def create_reminder(data: ReminderIn, uid: str = Depends(get_current_user_id)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "created_at": now_iso(),
        "done": False,
        **data.model_dump(),
    }
    await db.reminders.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.patch("/reminders/{rid}")
async def update_reminder(rid: str, data: ReminderUpdate, uid: str = Depends(get_current_user_id)):
    patch = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if patch:
        await db.reminders.update_one({"id": rid, "user_id": uid}, {"$set": patch})
    doc = await db.reminders.find_one({"id": rid, "user_id": uid})
    if not doc:
        raise HTTPException(404, "Not found")
    return {k: v for k, v in doc.items() if k != "_id"}


@api.delete("/reminders/{rid}")
async def delete_reminder(rid: str, uid: str = Depends(get_current_user_id)):
    await db.reminders.delete_one({"id": rid, "user_id": uid})
    return {"ok": True}


# -------- Notes --------
@api.get("/notes")
async def list_notes(uid: str = Depends(get_current_user_id)):
    cur = db.notes.find({"user_id": uid}).sort("created_at", -1)
    return [{k: v for k, v in doc.items() if k != "_id"} async for doc in cur]


@api.post("/notes")
async def create_note(data: NoteIn, uid: str = Depends(get_current_user_id)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "created_at": now_iso(),
        "date": "Oggi",
        **data.model_dump(),
    }
    await db.notes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.patch("/notes/{nid}")
async def update_note(nid: str, data: NoteIn, uid: str = Depends(get_current_user_id)):
    patch = data.model_dump()
    await db.notes.update_one({"id": nid, "user_id": uid}, {"$set": patch})
    doc = await db.notes.find_one({"id": nid, "user_id": uid})
    if not doc:
        raise HTTPException(404, "Not found")
    return {k: v for k, v in doc.items() if k != "_id"}


@api.delete("/notes/{nid}")
async def delete_note(nid: str, uid: str = Depends(get_current_user_id)):
    await db.notes.delete_one({"id": nid, "user_id": uid})
    return {"ok": True}


# -------- Chat --------
@api.get("/chat/{mode}")
async def chat_history(mode: str, uid: str = Depends(get_current_user_id)):
    cur = db.chat_messages.find({"user_id": uid, "mode": mode}).sort("created_at", 1)
    return [{k: v for k, v in doc.items() if k != "_id"} async for doc in cur]


@api.post("/chat")
async def chat_send(data: ChatIn, uid: str = Depends(get_current_user_id)):
    user = await _get_user(uid)
    # load history
    cur = db.chat_messages.find({"user_id": uid, "mode": data.mode}).sort("created_at", 1)
    history = [{"role": d["role"], "text": d["text"]} async for d in cur]

    # save user msg
    now = now_iso()
    user_msg = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "mode": data.mode,
        "role": "user",
        "text": data.text,
        "created_at": now,
    }
    await db.chat_messages.insert_one(user_msg)

    try:
        session_id = f"{uid}-{data.mode}"
        reply_text = await chat_stream_once(
            mode=data.mode,
            session_id=session_id,
            profile=_public_user(user),
            history=history,
            user_text=data.text,
        )
    except Exception as e:
        logger.exception("LLM error")
        reply_text = "Scusa, ho avuto un problema. Riprova fra un secondo."

    reply_msg = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "mode": data.mode,
        "role": "clone",
        "text": reply_text,
        "created_at": now_iso(),
    }
    await db.chat_messages.insert_one(reply_msg)
    return {
        "user_message": {k: v for k, v in user_msg.items() if k != "_id"},
        "clone_message": {k: v for k, v in reply_msg.items() if k != "_id"},
    }


# -------- Daily suggestions --------
@api.get("/suggestions/daily")
async def daily_suggestions(uid: str = Depends(get_current_user_id)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.daily_suggestions.find_one({"user_id": uid, "date": today})
    if existing:
        return existing.get("items", [])

    user = await _get_user(uid)
    # gather context
    events = [d async for d in db.events.find({"user_id": uid, "date": "today"})]
    reminders = [d async for d in db.reminders.find({"user_id": uid, "done": False})]
    events_txt = ", ".join(f"{e.get('time')} {e.get('title')}" for e in events) or "nessuno"
    rem_txt = ", ".join(r.get("text", "") for r in reminders[:5]) or "nessuno"

    prompt = (
        "Genera ESATTAMENTE 3 suggerimenti brevi (max 18 parole ciascuno) per la giornata di oggi "
        f"basati su: eventi [{events_txt}], promemoria aperti [{rem_txt}]. "
        "Formato risposta: tre righe, ciascuna con '|' che separa [icona] | [testo]. "
        "Icone disponibili: Sun, Coffee, Target, Zap, Heart, Dumbbell, Apple, Brain. "
        "Esempio:\nSun | Inizia dal task pi\u00f9 piccolo per prendere ritmo\n"
        "Target | Blocca 1h di focus dopo pranzo sul progetto\n"
        "Coffee | Pausa a met\u00e0 mattina, 5 min lontano dallo schermo"
    )
    try:
        raw = await generate_text("general", f"{uid}-sugg-{today}", _public_user(user), prompt)
    except Exception:
        raw = "Sun | Inizia dal task pi\u00f9 facile\nTarget | Blocca un'ora di focus\nCoffee | Pausa a met\u00e0 mattina"

    items = []
    for line in raw.strip().splitlines():
        if "|" in line:
            icon, text = line.split("|", 1)
            icon = icon.strip().strip("[]*- ")
            text = text.strip().strip("*- ")
            if text:
                items.append({"icon": icon or "Sun", "text": text})
        if len(items) >= 3:
            break
    if not items:
        items = [
            {"icon": "Sun", "text": "Inizia dal task pi\u00f9 piccolo per prendere ritmo."},
            {"icon": "Target", "text": "Blocca un'ora di focus nel pomeriggio."},
            {"icon": "Coffee", "text": "Pausa a met\u00e0 mattina, 5 minuti lontano dallo schermo."},
        ]

    await db.daily_suggestions.insert_one({"user_id": uid, "date": today, "items": items})
    return items


# -------- Coach plans --------
@api.post("/coach/plan")
async def coach_plan(data: CoachPlanIn, uid: str = Depends(get_current_user_id)):
    user = await _get_user(uid)
    profile = _public_user(user)
    extra = f"\nNote utente: {data.extra_notes}" if data.extra_notes else ""

    if data.kind == "fitness":
        prompt = (
            "Crea una SCHEDA DI ALLENAMENTO settimanale personalizzata in italiano. "
            "Usa i dati fisici dell'utente. Formato Markdown, con intestazione **Giorno X - Focus**, "
            "poi lista esercizi: nome, serie x reps, recupero. 4-5 giorni di allenamento + 2-3 riposo. "
            f"Obiettivo utente: {profile.get('fitness_goal') or profile.get('goals')}. "
            "Includi una sezione finale 'Consigli' con 3-4 punti su progressione e sicurezza." + extra
        )
        mode = "fitness"
    else:
        prompt = (
            "Crea un PIANO ALIMENTARE settimanale personalizzato in italiano basato sui dati fisici. "
            "Calcola brevemente il fabbisogno calorico stimato (BMR + attivit\u00e0) e deficit/surplus "
            "coerente con l'obiettivo. Formato Markdown: 7 giorni, per ciascuno colazione/spuntino/"
            "pranzo/spuntino/cena con esempi italiani e grammature. Alla fine sezione 'Linee guida' "
            "con 4-5 punti pratici (idratazione, dolci, alcool, variet\u00e0)." + extra
        )
        mode = "nutrition"

    try:
        text = await generate_text(mode, f"{uid}-plan-{data.kind}", profile, prompt)
    except Exception as e:
        logger.exception("Plan generation failed")
        raise HTTPException(500, "Impossibile generare il piano, riprova.")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "kind": data.kind,
        "content": text,
        "created_at": now_iso(),
    }
    await db.coach_plans.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.get("/coach/plans/{kind}")
async def latest_plan(kind: str, uid: str = Depends(get_current_user_id)):
    doc = await db.coach_plans.find_one(
        {"user_id": uid, "kind": kind}, sort=[("created_at", -1)]
    )
    if not doc:
        return None
    return {k: v for k, v in doc.items() if k != "_id"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
