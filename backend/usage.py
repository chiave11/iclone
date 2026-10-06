"""Usage tracking + plan gating for iClone."""
from datetime import datetime, timezone
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

# Free plan limits
FREE_DAILY_CHAT = 15          # total chat messages per day
FREE_MONTHLY_COACH_PLANS = 1  # fitness/nutrition plan generations per month
FREE_PSYCHOLOGY_PER_DAY = 3   # psychology messages count against daily too, but we show badge
CHAT_COST_CREDITS = 1
COACH_COST_CREDITS = 25

PRO_STATUSES = {"active", "trialing"}


def is_pro(user: dict) -> bool:
    status = user.get("subscription_status")
    if status in PRO_STATUSES:
        # check expiry
        cpe = user.get("subscription_current_period_end")
        if cpe:
            if isinstance(cpe, str):
                try:
                    cpe = datetime.fromisoformat(cpe.replace("Z", "+00:00"))
                except Exception:
                    cpe = None
            if cpe and cpe < datetime.now(timezone.utc):
                return False
        return True
    return False


def _today_key():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _month_key():
    return datetime.now(timezone.utc).strftime("%Y-%m")


async def get_usage(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    daily = await db.usage_daily.find_one({"user_id": user_id, "date": _today_key()}) or {}
    monthly = await db.usage_monthly.find_one({"user_id": user_id, "month": _month_key()}) or {}
    return {
        "chat_today": daily.get("chat_count", 0),
        "coach_this_month": monthly.get("coach_count", 0),
    }


async def check_and_consume_chat(db: AsyncIOMotorDatabase, user: dict):
    """Raise 402 if free user is over the limit (and no credits)."""
    if is_pro(user):
        return  # unlimited
    user_id = user["id"]
    usage = await get_usage(db, user_id)
    if usage["chat_today"] >= FREE_DAILY_CHAT:
        credits = user.get("credits_balance", 0)
        if credits >= CHAT_COST_CREDITS:
            await db.users.update_one({"id": user_id}, {"$inc": {"credits_balance": -CHAT_COST_CREDITS}})
            await _increment_usage(db, user_id, "chat")
            return
        raise HTTPException(
            status_code=402,
            detail={
                "code": "chat_limit_reached",
                "message": "Hai raggiunto il limite di 15 messaggi giornalieri del piano Free. Passa a Pro o compra crediti.",
                "daily_limit": FREE_DAILY_CHAT,
            },
        )
    await _increment_usage(db, user_id, "chat")


async def check_and_consume_coach(db: AsyncIOMotorDatabase, user: dict):
    if is_pro(user):
        return
    user_id = user["id"]
    usage = await get_usage(db, user_id)
    if usage["coach_this_month"] >= FREE_MONTHLY_COACH_PLANS:
        credits = user.get("credits_balance", 0)
        if credits >= COACH_COST_CREDITS:
            await db.users.update_one({"id": user_id}, {"$inc": {"credits_balance": -COACH_COST_CREDITS}})
            await _increment_usage(db, user_id, "coach")
            return
        raise HTTPException(
            status_code=402,
            detail={
                "code": "coach_limit_reached",
                "message": "Il piano Free include 1 piano Coach al mese. Passa a Pro per piani illimitati o compra crediti.",
                "monthly_limit": FREE_MONTHLY_COACH_PLANS,
            },
        )
    await _increment_usage(db, user_id, "coach")


async def _increment_usage(db, user_id: str, kind: str):
    if kind == "chat":
        await db.usage_daily.update_one(
            {"user_id": user_id, "date": _today_key()},
            {"$inc": {"chat_count": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
    elif kind == "coach":
        await db.usage_monthly.update_one(
            {"user_id": user_id, "month": _month_key()},
            {"$inc": {"coach_count": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
