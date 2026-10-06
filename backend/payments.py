"""Stripe payment integration for iClone."""
import os
import logging
from datetime import datetime, timezone
from typing import Optional
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from auth_utils import get_current_user_id

logger = logging.getLogger("iclone.payments")

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
WELCOME_COUPON_ID = "WELCOME20"

mongo_url = os.environ["MONGO_URL"]
_client = AsyncIOMotorClient(mongo_url)
_db = _client[os.environ["DB_NAME"]]

payments_router = APIRouter(prefix="/api")


# Credit pack lookup -> credits granted
CREDIT_PACKS = {
    "iclone_credits_100": 100,
    "iclone_credits_500": 500,
    "iclone_credits_1500": 1500,
}

SUBSCRIPTION_LOOKUPS = {"iclone_pro_monthly", "iclone_pro_yearly"}


class CheckoutRequest(BaseModel):
    lookup_key: str
    origin_url: str
    apply_welcome_discount: bool = True


def _now():
    return datetime.now(timezone.utc)


async def _get_or_create_customer(user_id: str) -> str:
    user = await _db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    if user.get("stripe_customer_id"):
        return user["stripe_customer_id"]
    customer = stripe.Customer.create(
        email=user["email"],
        name=user.get("name") or user["email"],
        metadata={"user_id": user_id},
    )
    await _db.users.update_one({"id": user_id}, {"$set": {"stripe_customer_id": customer.id}})
    return customer.id


async def _user_has_used_welcome(user_id: str) -> bool:
    doc = await _db.payment_transactions.find_one({"user_id": user_id, "welcome_applied": True})
    return doc is not None


@payments_router.get("/payments/plans")
async def plans():
    """Public endpoint listing available products with prices for the pricing page."""
    out = {"subscriptions": [], "credits": []}
    prices = stripe.Price.list(active=True, expand=["data.product"], limit=100).data
    for p in prices:
        prod = p.product
        item = {
            "lookup_key": p.lookup_key,
            "amount": p.unit_amount / 100.0,
            "currency": p.currency,
            "name": prod["name"] if isinstance(prod, dict) else prod.name,
            "interval": (p.recurring.get("interval") if p.recurring else None),
            "credits": CREDIT_PACKS.get(p.lookup_key),
        }
        if p.recurring:
            out["subscriptions"].append(item)
        else:
            out["credits"].append(item)
    # sort
    order = {"iclone_pro_monthly": 0, "iclone_pro_yearly": 1}
    out["subscriptions"].sort(key=lambda x: order.get(x["lookup_key"], 99))
    out["credits"].sort(key=lambda x: x["amount"])
    return out


@payments_router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, user_id: str = Depends(get_current_user_id)):
    prices = stripe.Price.list(lookup_keys=[req.lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(400, f"Price not found: {req.lookup_key}")
    price = prices[0]
    customer_id = await _get_or_create_customer(user_id)

    is_sub = bool(price.recurring)
    welcome_applied = False
    discounts_param = None
    if is_sub and req.apply_welcome_discount:
        if not await _user_has_used_welcome(user_id):
            discounts_param = [{"coupon": WELCOME_COUPON_ID}]
            welcome_applied = True

    kwargs = dict(
        customer=customer_id,
        line_items=[{"price": price.id, "quantity": 1}],
        mode="subscription" if is_sub else "payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={
            "user_id": user_id,
            "lookup_key": req.lookup_key,
            "credits": str(CREDIT_PACKS.get(req.lookup_key, "")),
            "welcome_applied": "1" if welcome_applied else "0",
        },
    )
    if discounts_param:
        kwargs["discounts"] = discounts_param
    # SMP (Italy / EUR / digital): managed payments on
    try:
        session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
    except stripe.error.InvalidRequestError as e:
        msg = (e.user_message or "").lower()
        if "managed payments" in msg or "ineligible" in msg:
            session = stripe.checkout.Session.create(
                **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required",
            )
        else:
            raise

    await _db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user_id,
        "lookup_key": req.lookup_key,
        "amount": (price.unit_amount or 0),
        "currency": price.currency,
        "mode": kwargs["mode"],
        "credits_granted": CREDIT_PACKS.get(req.lookup_key, 0),
        "welcome_applied": welcome_applied,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": _now(),
        "updated_at": _now(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


@payments_router.get("/payments/status/{session_id}")
async def get_status(session_id: str):
    record = await _db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(404, "Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await _apply_paid(session_id, s)
                record = await _db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
    }


async def _apply_paid(session_id: str, session_obj):
    """Idempotent: flip txn to paid, grant subscription or credits."""
    txn = await _db.payment_transactions.find_one({"session_id": session_id})
    if not txn or txn.get("payment_status") == "paid":
        return
    user_id = txn["user_id"]
    patch = {
        "status": "completed",
        "payment_status": "paid",
        "stripe_subscription_id": getattr(session_obj, "subscription", None) if session_obj else None,
        "stripe_payment_intent_id": getattr(session_obj, "payment_intent", None) if session_obj else None,
        "updated_at": _now(),
    }
    await _db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}}, {"$set": patch}
    )

    # grant benefits
    lookup = txn["lookup_key"]
    if lookup in SUBSCRIPTION_LOOKUPS:
        # subscription: fetch to get period end
        sub_id = patch["stripe_subscription_id"]
        plan_key = "monthly" if lookup == "iclone_pro_monthly" else "yearly"
        current_period_end = None
        if sub_id:
            try:
                sub = stripe.Subscription.retrieve(sub_id)
                current_period_end = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc)
            except Exception:
                pass
        await _db.users.update_one(
            {"id": user_id},
            {"$set": {
                "subscription_status": "active",
                "subscription_plan": plan_key,
                "stripe_subscription_id": sub_id,
                "subscription_current_period_end": current_period_end,
            }}
        )
    elif lookup in CREDIT_PACKS:
        credits = CREDIT_PACKS[lookup]
        await _db.users.update_one(
            {"id": user_id},
            {"$inc": {"credits_balance": credits}}
        )


@payments_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    obj = event["data"]["object"]
    t = event["type"]

    if t == "checkout.session.completed":
        await _apply_paid(obj["id"], obj)

    elif t == "checkout.session.async_payment_succeeded":
        await _apply_paid(obj["id"], obj)

    elif t == "checkout.session.async_payment_failed":
        await _db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": _now()}})

    elif t == "checkout.session.expired":
        await _db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": _now()}})

    elif t == "customer.subscription.updated":
        sub = obj
        user = await _db.users.find_one({"stripe_subscription_id": sub["id"]})
        if user:
            status_val = sub["status"]  # active, past_due, canceled, etc.
            cpe = datetime.fromtimestamp(sub["current_period_end"], tz=timezone.utc)
            cancel_at_period_end = sub.get("cancel_at_period_end", False)
            await _db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "subscription_status": status_val,
                    "subscription_current_period_end": cpe,
                    "subscription_cancel_at_period_end": cancel_at_period_end,
                }}
            )

    elif t == "customer.subscription.deleted":
        sub = obj
        user = await _db.users.find_one({"stripe_subscription_id": sub["id"]})
        if user:
            await _db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "subscription_status": "canceled",
                    "stripe_subscription_id": None,
                }}
            )

    elif t == "charge.refunded":
        pi = obj.get("payment_intent")
        if pi:
            await _db.payment_transactions.update_one(
                {"stripe_payment_intent_id": pi},
                {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": _now()}}
            )

    return {"status": "ok"}


@payments_router.post("/payments/portal")
async def customer_portal(request: Request, user_id: str = Depends(get_current_user_id)):
    user = await _db.users.find_one({"id": user_id})
    customer_id = user.get("stripe_customer_id") if user else None
    if not customer_id:
        raise HTTPException(400, "Nessun account cliente trovato")
    body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    return_url = body.get("return_url") or "/"
    portal = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return {"url": portal.url}


@payments_router.get("/payments/subscription")
async def my_subscription(user_id: str = Depends(get_current_user_id)):
    user = await _db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404)
    cpe = user.get("subscription_current_period_end")
    return {
        "status": user.get("subscription_status") or "free",
        "plan": user.get("subscription_plan"),
        "current_period_end": cpe.isoformat() if cpe else None,
        "cancel_at_period_end": user.get("subscription_cancel_at_period_end", False),
        "credits_balance": user.get("credits_balance", 0),
    }
