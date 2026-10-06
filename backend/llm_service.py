import os
from typing import AsyncGenerator, List, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Mode configuration: provider + model + system prompt builder
MODE_CONFIG = {
    "general": {
        "provider": "openai",
        "model": "gpt-4o-mini",
    },
    "fitness": {
        "provider": "openai",
        "model": "gpt-4o-mini",
    },
    "nutrition": {
        "provider": "openai",
        "model": "gpt-4o-mini",
    },
    "psychology": {
        "provider": "anthropic",
        "model": "claude-sonnet-5-5",
    },
}

TONE_HINT = {
    "amichevole": "Tono caldo, rilassato, come un amico fidato. Usa 'tu' e qualche emoji sobria.",
    "diretto": "Tono diretto e asciutto, zero fronzoli. Vai dritto al punto.",
    "ironico": "Tono ironico, un pizzico di sarcasmo bonario, ma sempre utile.",
    "motivazionale": "Tono energico, incoraggiante, dai spinta e grinta.",
}


def build_system_prompt(mode: str, profile: Dict[str, Any]) -> str:
    name = profile.get("name") or "l'utente"
    tone = profile.get("tone") or "amichevole"
    interests = ", ".join(profile.get("interests") or []) or "non specificati"
    habits = ", ".join(profile.get("habits") or []) or "non specificate"
    goals = profile.get("goals") or "nessun obiettivo specifico"
    weight = profile.get("weight")
    height = profile.get("height")
    age = profile.get("age")
    sex = profile.get("sex")
    fitness_goal = profile.get("fitness_goal")

    base_identity = (
        f"Sei iClone, il clone AI personale di {name}. Pensi come {name} e lo/la aiuti "
        f"a ricordare, decidere e stare bene. Rispondi SEMPRE in italiano.\n"
        f"Tono: {TONE_HINT.get(tone, TONE_HINT['amichevole'])}\n"
        f"Profilo: interessi [{interests}], abitudini [{habits}], obiettivo [{goals}].\n"
    )

    physical = ""
    if weight or height or age or sex or fitness_goal:
        physical = (
            f"Dati fisici: peso {weight or '?'}kg, altezza {height or '?'}cm, "
            f"età {age or '?'}, sesso {sex or '?'}, obiettivo fitness: {fitness_goal or '?'}.\n"
        )

    mode_prompts = {
        "general": (
            "Modalità: assistente personale generale. Aiuta con agenda, promemoria, idee, "
            "decisioni rapide. Risposte brevi (max 3-4 frasi) a meno che non ti si chieda di approfondire."
        ),
        "fitness": (
            "Modalità: PERSONAL TRAINER. Dai consigli pratici su allenamento, tecnica, "
            "recupero. Se richiesto, crea schede allenamento specifiche con esercizi, serie, ripetizioni "
            "e tempi di recupero. Sempre sicurezza prima di tutto: ricorda limiti e tecnica corretta. "
            "NON sei un medico: segnala di consultare un medico per patologie o dolore."
        ),
        "nutrition": (
            "Modalità: NUTRIZIONISTA. Dai consigli alimentari pratici basati su obiettivo "
            "(dimagrimento, massa, mantenimento). Se richiesto, costruisci piani alimentari con pasti "
            "concreti, grammature indicative e macro approssimativi. Preferisci dieta mediterranea. "
            "NON sostituisci un nutrizionista certificato: per patologie, allergie o restrizioni mediche "
            "invita a rivolgersi a un professionista."
        ),
        "psychology": (
            "Modalità: SUPPORTO PSICOLOGICO. Ascolta attivamente, valida le emozioni, fai domande "
            "aperte, offri prospettive e piccoli esercizi (respirazione, journaling, riframing). "
            "Tono empatico e caldo, mai giudicante. IMPORTANTE: NON sei un terapeuta reale. "
            "Se emergono segnali di crisi (autolesionismo, ideazione suicidaria, abusi) invita con "
            "gentilezza a contattare subito aiuto professionale (in Italia: Telefono Amico 02 2327 2327, "
            "Telefono Azzurro 19696, emergenze 112)."
        ),
    }

    return base_identity + physical + "\n" + mode_prompts.get(mode, mode_prompts["general"])


async def chat_stream_once(
    mode: str,
    session_id: str,
    profile: Dict[str, Any],
    history: List[Dict[str, str]],
    user_text: str,
) -> str:
    """Non-streaming helper: send one turn with history and return the full reply."""
    cfg = MODE_CONFIG.get(mode, MODE_CONFIG["general"])
    system = build_system_prompt(mode, profile)

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model(cfg["provider"], cfg["model"])

    # Replay history by sending prior user turns (library tracks history itself per instance,
    # but since we create fresh instance per request, we embed context into the user text).
    context_block = ""
    if history:
        last = history[-10:]  # keep last 10 turns
        lines = []
        for h in last:
            role = "Utente" if h["role"] == "user" else "iClone"
            lines.append(f"{role}: {h['text']}")
        context_block = "Conversazione recente:\n" + "\n".join(lines) + "\n\n"

    full_text = context_block + f"Nuovo messaggio utente: {user_text}"
    msg = UserMessage(text=full_text)
    response = await chat.send_message(msg)
    return response if isinstance(response, str) else str(response)


async def generate_text(mode: str, session_id: str, profile: Dict[str, Any], prompt: str) -> str:
    cfg = MODE_CONFIG.get(mode, MODE_CONFIG["general"])
    system = build_system_prompt(mode, profile)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model(cfg["provider"], cfg["model"])
    response = await chat.send_message(UserMessage(text=prompt))
    return response if isinstance(response, str) else str(response)
