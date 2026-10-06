#!/usr/bin/env python3
"""
Verify MongoDB data for welcome_applied flag
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path("/app/backend/.env"))

async def check_transactions():
    mongo_url = os.environ["MONGO_URL"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ["DB_NAME"]]
    
    # Find transactions for the test user
    user = await db.users.find_one({"email": "monetization.test.a06588b3@example.com"})
    if not user:
        print("❌ User not found")
        return
    
    print(f"✅ User found: {user['id']}")
    print(f"   Email: {user['email']}")
    print(f"   is_pro: {user.get('subscription_status', 'free')}")
    print(f"   credits_balance: {user.get('credits_balance', 0)}")
    print(f"   stripe_customer_id: {user.get('stripe_customer_id', 'None')}")
    
    # Find all transactions for this user
    transactions = []
    async for txn in db.payment_transactions.find({"user_id": user["id"]}).sort("created_at", 1):
        transactions.append(txn)
    
    print(f"\n✅ Found {len(transactions)} transactions:")
    for i, txn in enumerate(transactions, 1):
        print(f"\n   Transaction {i}:")
        print(f"     session_id: {txn['session_id']}")
        print(f"     lookup_key: {txn['lookup_key']}")
        print(f"     status: {txn['status']}")
        print(f"     payment_status: {txn['payment_status']}")
        print(f"     welcome_applied: {txn.get('welcome_applied', 'NOT SET')}")
        print(f"     amount: {txn['amount']} {txn['currency']}")
        print(f"     mode: {txn['mode']}")
        print(f"     credits_granted: {txn.get('credits_granted', 0)}")
    
    # Verify welcome_applied logic
    print("\n" + "="*80)
    print("VERIFICATION:")
    print("="*80)
    
    if len(transactions) >= 2:
        first_sub = next((t for t in transactions if t['lookup_key'] in ['iclone_pro_monthly', 'iclone_pro_yearly']), None)
        second_sub = None
        for t in transactions:
            if t['lookup_key'] in ['iclone_pro_monthly', 'iclone_pro_yearly'] and t != first_sub:
                second_sub = t
                break
        
        if first_sub:
            if first_sub.get('welcome_applied') == True:
                print("✅ First subscription has welcome_applied=True")
            else:
                print(f"❌ First subscription has welcome_applied={first_sub.get('welcome_applied')} (expected True)")
        
        if second_sub:
            if second_sub.get('welcome_applied') == False:
                print("✅ Second subscription has welcome_applied=False")
            else:
                print(f"❌ Second subscription has welcome_applied={second_sub.get('welcome_applied')} (expected False)")
    
    # Check credit pack transaction
    credit_txn = next((t for t in transactions if t['lookup_key'] == 'iclone_credits_500'), None)
    if credit_txn:
        print(f"✅ Credit pack transaction found:")
        print(f"   lookup_key: {credit_txn['lookup_key']}")
        print(f"   mode: {credit_txn['mode']} (expected 'payment')")
        print(f"   credits_granted: {credit_txn.get('credits_granted', 0)} (expected 500)")
        
        if credit_txn['mode'] == 'payment':
            print("   ✅ Mode is 'payment' (one-time payment)")
        else:
            print(f"   ❌ Mode is '{credit_txn['mode']}' (expected 'payment')")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_transactions())
