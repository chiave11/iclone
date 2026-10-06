"""Idempotent setup for iClone Stripe catalog."""
import os
import stripe
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

# Determine country for tax mode decision
acct = stripe.Account.retrieve()
country = acct["country"]
print(f"Sandbox country: {country}")

SMP_COUNTRIES = {
    "AU","AT","BE","BG","CA","HR","CY","CZ","DK","EE","FI","FR","DE","GI","GR",
    "HK","HU","IE","IT","JP","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO",
    "SG","SK","SI","ES","SE","CH","GB","US"
}
use_smp = country in SMP_COUNTRIES
print(f"SMP eligible: {use_smp}")

CATALOG = [
    {
        "emergent_product_id": "iclone_pro",
        "name": "iClone Pro",
        "tax_code": "txcd_10103001",  # SaaS
        "prices": [
            {"lookup_key": "iclone_pro_monthly", "amount": 499, "currency": "eur", "interval": "month"},
            {"lookup_key": "iclone_pro_yearly", "amount": 3900, "currency": "eur", "interval": "year"},
        ],
    },
    {
        "emergent_product_id": "iclone_credits_small",
        "name": "iClone Pacchetto Crediti - Starter",
        "tax_code": "txcd_10103001",
        "prices": [
            {"lookup_key": "iclone_credits_100", "amount": 299, "currency": "eur"},  # 100 crediti €2.99
        ],
    },
    {
        "emergent_product_id": "iclone_credits_medium",
        "name": "iClone Pacchetto Crediti - Plus",
        "tax_code": "txcd_10103001",
        "prices": [
            {"lookup_key": "iclone_credits_500", "amount": 999, "currency": "eur"},  # 500 crediti €9.99
        ],
    },
    {
        "emergent_product_id": "iclone_credits_large",
        "name": "iClone Pacchetto Crediti - Ultra",
        "tax_code": "txcd_10103001",
        "prices": [
            {"lookup_key": "iclone_credits_1500", "amount": 1999, "currency": "eur"},  # 1500 crediti €19.99
        ],
    },
]


def get_or_create_product(entry):
    for p in stripe.Product.list(active=True, limit=100).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            print(f"  Product exists: {entry['name']}")
            return p
    p = stripe.Product.create(
        name=entry["name"],
        tax_code=entry.get("tax_code"),
        metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]},
    )
    print(f"  Created product: {entry['name']}")
    return p


def ensure_price(product, p):
    existing = stripe.Price.list(lookup_keys=[p["lookup_key"]], active=True, limit=1).data
    if existing and (existing[0].unit_amount != p["amount"] or existing[0].currency != p["currency"]):
        stripe.Price.modify(existing[0].id, active=False)
        existing = []
    if not existing:
        kwargs = dict(
            product=product.id,
            unit_amount=p["amount"],
            currency=p["currency"],
            lookup_key=p["lookup_key"],
            transfer_lookup_key=True,
        )
        if p.get("interval"):
            kwargs["recurring"] = {"interval": p["interval"]}
        stripe.Price.create(**kwargs)
        print(f"    Created price: {p['lookup_key']} = {p['amount']/100} {p['currency']}")
    else:
        print(f"    Price exists: {p['lookup_key']}")


def ensure_coupon():
    coupons = stripe.Coupon.list(limit=100).data
    for c in coupons:
        if c.get("id") == "WELCOME20" or c.get("name") == "iClone Welcome 20%":
            print(f"Coupon exists: {c.id}")
            return c
    c = stripe.Coupon.create(
        id="WELCOME20",
        name="iClone Welcome 20%",
        percent_off=20,
        duration="once",
        max_redemptions=100000,
        metadata={"managed_by": "emergent", "intended_use": "first_month_only_per_customer"},
    )
    print(f"Created coupon: {c.id} (20% off, one-time)")

    # Promotion code (user-facing)
    promos = stripe.PromotionCode.list(code="BENVENUTO20", limit=1).data
    if not promos:
        pc = stripe.PromotionCode.create(
            coupon=c.id,
            code="BENVENUTO20",
            active=True,
            metadata={"managed_by": "emergent"},
            restrictions={"first_time_transaction": True},
        )
        print(f"Created promotion code: {pc.code}")
    return c


print("\nSetting up products & prices...")
for entry in CATALOG:
    product = get_or_create_product(entry)
    for price in entry["prices"]:
        ensure_price(product, price)

print("\nSetting up coupon...")
ensure_coupon()

print("\nDone.")
print(f"Tax mode decision: use_smp={use_smp} (digital products, country {country})")
