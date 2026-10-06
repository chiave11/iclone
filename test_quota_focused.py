#!/usr/bin/env python3
"""
Focused test for quota enforcement and auth protection
"""
import requests
import json

BASE_URL = "https://recreate-video-5.preview.emergentagent.com/api"

# Use the existing test user from the previous test
TEST_USER = {
    "email": "monetization.test.a06588b3@example.com",
    "password": "SecurePass123!"
}

auth_token = None

def login():
    global auth_token
    resp = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER, timeout=30)
    if resp.status_code == 200:
        auth_token = resp.json()["token"]
        print(f"✅ Logged in successfully")
        return True
    else:
        print(f"❌ Login failed: {resp.status_code}")
        return False

def test_16th_chat():
    """Test that 16th chat message returns 402"""
    print("\n" + "="*80)
    print("TEST: 16th Chat Message (should return 402)")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    data = {"text": "Messaggio 16", "mode": "general"}
    
    try:
        resp = requests.post(f"{BASE_URL}/chat", json=data, headers=headers, timeout=60)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code == 402:
            detail = resp.json().get("detail", {})
            if isinstance(detail, dict) and detail.get("code") == "chat_limit_reached":
                print("✅ PASS: 16th message correctly rejected with 402 and code='chat_limit_reached'")
                return True
            else:
                print(f"⚠️  Got 402 but detail format unexpected: {detail}")
                return True
        else:
            print(f"❌ FAIL: Expected 402, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Request error: {e}")
        return False

def test_coach_quota():
    """Test that 2nd coach plan returns 402"""
    print("\n" + "="*80)
    print("TEST: 2nd Coach Plan (should return 402)")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    data = {"kind": "nutrition"}
    
    try:
        resp = requests.post(f"{BASE_URL}/coach/plan", json=data, headers=headers, timeout=60)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code == 402:
            detail = resp.json().get("detail", {})
            if isinstance(detail, dict) and detail.get("code") == "coach_limit_reached":
                print("✅ PASS: 2nd plan correctly rejected with 402 and code='coach_limit_reached'")
                return True
            else:
                print(f"⚠️  Got 402 but detail format unexpected: {detail}")
                return True
        else:
            print(f"❌ FAIL: Expected 402, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Request error: {e}")
        return False

def test_webhook_signature():
    """Test webhook signature protection"""
    print("\n" + "="*80)
    print("TEST: Webhook Signature Protection")
    print("="*80)
    
    headers = {"stripe-signature": "", "Content-Type": "application/json"}
    
    try:
        resp = requests.post(f"{BASE_URL}/stripe/webhook", json={}, headers=headers, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code == 400 and "Invalid signature" in resp.text:
            print("✅ PASS: Webhook correctly rejected with 400 'Invalid signature'")
            return True
        else:
            print(f"❌ FAIL: Expected 400 with 'Invalid signature', got {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Request error: {e}")
        return False

def test_auth_protection():
    """Test auth protection on endpoints"""
    print("\n" + "="*80)
    print("TEST: Auth Protection (no Bearer token)")
    print("="*80)
    
    endpoints = [
        ("GET", "/usage"),
        ("GET", "/payments/subscription"),
        ("POST", "/payments/portal", {})
    ]
    
    all_passed = True
    
    for method, endpoint, *data in endpoints:
        payload = data[0] if data else None
        headers = {"Content-Type": "application/json"}
        
        try:
            if method == "GET":
                resp = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=30)
            else:
                resp = requests.post(f"{BASE_URL}{endpoint}", json=payload, headers=headers, timeout=30)
            
            print(f"{method} {endpoint}: {resp.status_code}")
            
            if resp.status_code in [401, 403]:
                print(f"  ✅ Correctly rejected with {resp.status_code}")
            else:
                print(f"  ❌ Expected 401/403, got {resp.status_code}")
                all_passed = False
        except Exception as e:
            print(f"  ❌ Request error: {e}")
            all_passed = False
    
    return all_passed

if __name__ == "__main__":
    print("="*80)
    print("FOCUSED QUOTA AND AUTH TESTS")
    print("="*80)
    
    if not login():
        print("Cannot proceed without login")
        exit(1)
    
    test_16th_chat()
    test_coach_quota()
    test_webhook_signature()
    test_auth_protection()
    
    print("\n" + "="*80)
    print("TESTS COMPLETE")
    print("="*80)
