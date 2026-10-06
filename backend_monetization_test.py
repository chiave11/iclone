#!/usr/bin/env python3
"""
Comprehensive monetization backend API tests for iClone
Tests all payment, subscription, and usage quota endpoints
"""
import requests
import json
import time
import uuid
from typing import Dict, Optional

# Base URL from frontend/.env
BASE_URL = "https://recreate-video-5.preview.emergentagent.com/api"

# Test user data (unique for monetization tests)
TEST_USER = {
    "email": f"monetization.test.{uuid.uuid4().hex[:8]}@example.com",
    "password": "SecurePass123!",
    "name": "Test Monetization User"
}

# Global token storage
auth_token: Optional[str] = None
test_user_id: Optional[str] = None
checkout_session_id: Optional[str] = None

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}


def log_test(name: str, passed: bool, message: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if message:
        print(f"   {message}")
    
    if passed:
        results["passed"].append(name)
    else:
        results["failed"].append({"test": name, "message": message})


def log_warning(name: str, message: str):
    """Log warning"""
    print(f"⚠️  WARNING: {name}")
    print(f"   {message}")
    results["warnings"].append({"test": name, "message": message})


def make_request(method: str, endpoint: str, data: dict = None, use_auth: bool = True, headers: dict = None):
    """Make HTTP request with optional auth"""
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    
    if use_auth and auth_token:
        req_headers["Authorization"] = f"Bearer {auth_token}"
    
    if headers:
        req_headers.update(headers)
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=req_headers, timeout=30)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=req_headers, timeout=30)
        elif method == "PUT":
            resp = requests.put(url, json=data, headers=req_headers, timeout=30)
        elif method == "PATCH":
            resp = requests.patch(url, json=data, headers=req_headers, timeout=30)
        elif method == "DELETE":
            resp = requests.delete(url, headers=req_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return resp
    except requests.exceptions.RequestException as e:
        print(f"   Request error: {e}")
        return None


# ============================================================================
# 1. PLANS ENDPOINT TEST (PUBLIC)
# ============================================================================

def test_payments_plans():
    """Test GET /api/payments/plans (public endpoint)"""
    print("\n" + "="*80)
    print("1. PAYMENTS PLANS TEST (PUBLIC)")
    print("="*80)
    
    resp = make_request("GET", "/payments/plans", use_auth=False)
    
    if not resp:
        log_test("Payments: GET /plans", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Payments: GET /plans", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    # Verify structure
    if "subscriptions" not in data or "credits" not in data:
        log_test("Payments: GET /plans", False, f"Missing subscriptions or credits: {data}")
        return False
    
    # Verify subscriptions
    subs = data["subscriptions"]
    if len(subs) != 2:
        log_test("Payments: GET /plans", False, f"Expected 2 subscriptions, got {len(subs)}")
        return False
    
    # Check for monthly subscription
    monthly = next((s for s in subs if s.get("lookup_key") == "iclone_pro_monthly"), None)
    if not monthly:
        log_test("Payments: GET /plans", False, "Missing iclone_pro_monthly subscription")
        return False
    
    if monthly.get("amount") != 4.99:
        log_test("Payments: GET /plans", False, f"Monthly amount should be 4.99, got {monthly.get('amount')}")
        return False
    
    if monthly.get("interval") != "month":
        log_test("Payments: GET /plans", False, f"Monthly interval should be 'month', got {monthly.get('interval')}")
        return False
    
    # Check for yearly subscription
    yearly = next((s for s in subs if s.get("lookup_key") == "iclone_pro_yearly"), None)
    if not yearly:
        log_test("Payments: GET /plans", False, "Missing iclone_pro_yearly subscription")
        return False
    
    if yearly.get("amount") != 39.0:
        log_test("Payments: GET /plans", False, f"Yearly amount should be 39.0, got {yearly.get('amount')}")
        return False
    
    if yearly.get("interval") != "year":
        log_test("Payments: GET /plans", False, f"Yearly interval should be 'year', got {yearly.get('interval')}")
        return False
    
    # Verify credit packs
    credits = data["credits"]
    if len(credits) != 3:
        log_test("Payments: GET /plans", False, f"Expected 3 credit packs, got {len(credits)}")
        return False
    
    # Check credit pack 100
    pack100 = next((c for c in credits if c.get("lookup_key") == "iclone_credits_100"), None)
    if not pack100:
        log_test("Payments: GET /plans", False, "Missing iclone_credits_100 pack")
        return False
    
    if pack100.get("amount") != 2.99:
        log_test("Payments: GET /plans", False, f"100 credits pack should be 2.99, got {pack100.get('amount')}")
        return False
    
    if pack100.get("credits") != 100:
        log_test("Payments: GET /plans", False, f"100 credits pack should have 100 credits, got {pack100.get('credits')}")
        return False
    
    # Check credit pack 500
    pack500 = next((c for c in credits if c.get("lookup_key") == "iclone_credits_500"), None)
    if not pack500:
        log_test("Payments: GET /plans", False, "Missing iclone_credits_500 pack")
        return False
    
    if pack500.get("amount") != 9.99:
        log_test("Payments: GET /plans", False, f"500 credits pack should be 9.99, got {pack500.get('amount')}")
        return False
    
    if pack500.get("credits") != 500:
        log_test("Payments: GET /plans", False, f"500 credits pack should have 500 credits, got {pack500.get('credits')}")
        return False
    
    # Check credit pack 1500
    pack1500 = next((c for c in credits if c.get("lookup_key") == "iclone_credits_1500"), None)
    if not pack1500:
        log_test("Payments: GET /plans", False, "Missing iclone_credits_1500 pack")
        return False
    
    if pack1500.get("amount") != 19.99:
        log_test("Payments: GET /plans", False, f"1500 credits pack should be 19.99, got {pack1500.get('amount')}")
        return False
    
    if pack1500.get("credits") != 1500:
        log_test("Payments: GET /plans", False, f"1500 credits pack should have 1500 credits, got {pack1500.get('credits')}")
        return False
    
    log_test("Payments: GET /plans", True, f"All plans verified: 2 subscriptions, 3 credit packs")
    return True


# ============================================================================
# 2. REGISTER USER AND VERIFY NEW FIELDS
# ============================================================================

def test_register_and_verify_fields():
    """Register new user and verify is_pro, subscription_status, credits_balance"""
    global auth_token, test_user_id
    
    print("\n" + "="*80)
    print("2. REGISTER USER AND VERIFY MONETIZATION FIELDS")
    print("="*80)
    
    resp = make_request("POST", "/auth/register", TEST_USER, use_auth=False)
    
    if not resp:
        log_test("Register: New user", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Register: New user", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    if "token" not in data or "user" not in data:
        log_test("Register: New user", False, f"Missing token or user: {data}")
        return False
    
    auth_token = data["token"]
    test_user_id = data["user"].get("id")
    user = data["user"]
    
    # Verify new monetization fields
    if user.get("is_pro") != False:
        log_test("Register: Verify fields", False, f"is_pro should be False, got {user.get('is_pro')}")
        return False
    
    if user.get("subscription_status") != "free":
        log_test("Register: Verify fields", False, f"subscription_status should be 'free', got {user.get('subscription_status')}")
        return False
    
    if user.get("credits_balance") != 0:
        log_test("Register: Verify fields", False, f"credits_balance should be 0, got {user.get('credits_balance')}")
        return False
    
    log_test("Register: Verify fields", True, f"User registered with is_pro=False, subscription_status=free, credits_balance=0")
    
    # Also verify via GET /auth/me
    resp = make_request("GET", "/auth/me")
    if not resp or resp.status_code != 200:
        log_test("Register: Verify via /me", False, f"GET /me failed: {resp.status_code if resp else 'None'}")
        return False
    
    me_data = resp.json()
    if me_data.get("is_pro") != False or me_data.get("subscription_status") != "free" or me_data.get("credits_balance") != 0:
        log_test("Register: Verify via /me", False, f"Fields mismatch in /me: {me_data}")
        return False
    
    log_test("Register: Verify via /me", True, "All fields verified via GET /auth/me")
    return True


# ============================================================================
# 3. CHECKOUT FOR SUBSCRIPTION (FIRST TIME - WELCOME DISCOUNT)
# ============================================================================

def test_checkout_subscription_first():
    """Test POST /api/payments/checkout for subscription (first time, welcome_applied=true)"""
    global checkout_session_id
    
    print("\n" + "="*80)
    print("3. CHECKOUT FOR SUBSCRIPTION (FIRST TIME)")
    print("="*80)
    
    checkout_data = {
        "lookup_key": "iclone_pro_monthly",
        "origin_url": "https://example.com"
    }
    
    resp = make_request("POST", "/payments/checkout", checkout_data)
    
    if not resp:
        log_test("Checkout: Subscription (first)", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Checkout: Subscription (first)", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    if "checkout_url" not in data or "session_id" not in data:
        log_test("Checkout: Subscription (first)", False, f"Missing checkout_url or session_id: {data}")
        return False
    
    checkout_url = data["checkout_url"]
    checkout_session_id = data["session_id"]
    
    if not checkout_url.startswith("https://checkout.stripe.com"):
        log_test("Checkout: Subscription (first)", False, f"checkout_url should start with https://checkout.stripe.com, got {checkout_url}")
        return False
    
    log_test("Checkout: Subscription (first)", True, f"Session created: {checkout_session_id}")
    
    # Verify in MongoDB that payment_transactions has welcome_applied=true
    # We'll check this via the status endpoint or by checking the transaction directly
    # For now, we'll verify the session was created
    
    return True


# ============================================================================
# 4. CHECK PAYMENT STATUS (PENDING)
# ============================================================================

def test_payment_status_pending():
    """Test GET /api/payments/status/{session_id} returns pending status"""
    print("\n" + "="*80)
    print("4. CHECK PAYMENT STATUS (PENDING)")
    print("="*80)
    
    if not checkout_session_id:
        log_test("Payment Status: Pending", False, "No session_id available")
        return False
    
    # Test unauthenticated (should work - public endpoint)
    resp = make_request("GET", f"/payments/status/{checkout_session_id}", use_auth=False)
    
    if not resp:
        log_test("Payment Status: Pending (unauthenticated)", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Payment Status: Pending (unauthenticated)", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    if "session_id" not in data or "status" not in data or "payment_status" not in data:
        log_test("Payment Status: Pending (unauthenticated)", False, f"Missing fields: {data}")
        return False
    
    if data["session_id"] != checkout_session_id:
        log_test("Payment Status: Pending (unauthenticated)", False, f"session_id mismatch: {data['session_id']} != {checkout_session_id}")
        return False
    
    if data["status"] != "initiated":
        log_test("Payment Status: Pending (unauthenticated)", False, f"status should be 'initiated', got {data['status']}")
        return False
    
    if data["payment_status"] != "pending":
        log_test("Payment Status: Pending (unauthenticated)", False, f"payment_status should be 'pending', got {data['payment_status']}")
        return False
    
    log_test("Payment Status: Pending (unauthenticated)", True, f"Status: {data['status']}, Payment: {data['payment_status']}")
    return True


# ============================================================================
# 5. CHECKOUT AGAIN (WELCOME_APPLIED=FALSE)
# ============================================================================

def test_checkout_subscription_second():
    """Test POST /api/payments/checkout again - should have welcome_applied=false"""
    print("\n" + "="*80)
    print("5. CHECKOUT AGAIN (WELCOME_APPLIED=FALSE)")
    print("="*80)
    
    checkout_data = {
        "lookup_key": "iclone_pro_monthly",
        "origin_url": "https://example.com"
    }
    
    resp = make_request("POST", "/payments/checkout", checkout_data)
    
    if not resp:
        log_test("Checkout: Subscription (second)", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Checkout: Subscription (second)", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    if "checkout_url" not in data or "session_id" not in data:
        log_test("Checkout: Subscription (second)", False, f"Missing checkout_url or session_id: {data}")
        return False
    
    second_session_id = data["session_id"]
    
    # We can't directly verify welcome_applied from the response, but we can check that a new session was created
    if second_session_id == checkout_session_id:
        log_test("Checkout: Subscription (second)", False, "Same session_id returned (should be new)")
        return False
    
    log_test("Checkout: Subscription (second)", True, f"New session created: {second_session_id}")
    
    # Note: To fully verify welcome_applied=false, we'd need to check MongoDB directly
    # The playbook states this should be verified via metadata or by checking payment_transactions
    log_warning("Checkout: Welcome discount", "Cannot verify welcome_applied=false without MongoDB access. Assuming correct based on session creation.")
    
    return True


# ============================================================================
# 6. CHECKOUT FOR CREDIT PACK
# ============================================================================

def test_checkout_credit_pack():
    """Test POST /api/payments/checkout for credit pack (mode=payment)"""
    print("\n" + "="*80)
    print("6. CHECKOUT FOR CREDIT PACK")
    print("="*80)
    
    checkout_data = {
        "lookup_key": "iclone_credits_500",
        "origin_url": "https://example.com"
    }
    
    resp = make_request("POST", "/payments/checkout", checkout_data)
    
    if not resp:
        log_test("Checkout: Credit pack", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Checkout: Credit pack", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    if "checkout_url" not in data or "session_id" not in data:
        log_test("Checkout: Credit pack", False, f"Missing checkout_url or session_id: {data}")
        return False
    
    if not data["checkout_url"].startswith("https://checkout.stripe.com"):
        log_test("Checkout: Credit pack", False, f"checkout_url should start with https://checkout.stripe.com")
        return False
    
    log_test("Checkout: Credit pack", True, f"Credit pack session created: {data['session_id']}")
    
    # Note: We can't verify mode=payment without checking Stripe directly
    log_warning("Checkout: Credit pack mode", "Cannot verify mode=payment without Stripe API access. Assuming correct based on session creation.")
    
    return True


# ============================================================================
# 7. GET SUBSCRIPTION INFO
# ============================================================================

def test_get_subscription():
    """Test GET /api/payments/subscription"""
    print("\n" + "="*80)
    print("7. GET SUBSCRIPTION INFO")
    print("="*80)
    
    resp = make_request("GET", "/payments/subscription")
    
    if not resp:
        log_test("Subscription: GET info", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Subscription: GET info", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    if "status" not in data or "plan" not in data or "credits_balance" not in data:
        log_test("Subscription: GET info", False, f"Missing fields: {data}")
        return False
    
    if data["status"] != "free":
        log_test("Subscription: GET info", False, f"status should be 'free', got {data['status']}")
        return False
    
    if data["plan"] is not None:
        log_test("Subscription: GET info", False, f"plan should be null, got {data['plan']}")
        return False
    
    if data["credits_balance"] != 0:
        log_test("Subscription: GET info", False, f"credits_balance should be 0, got {data['credits_balance']}")
        return False
    
    log_test("Subscription: GET info", True, f"Status: {data['status']}, Plan: {data['plan']}, Credits: {data['credits_balance']}")
    return True


# ============================================================================
# 8. GET USAGE INFO
# ============================================================================

def test_get_usage():
    """Test GET /api/usage"""
    print("\n" + "="*80)
    print("8. GET USAGE INFO")
    print("="*80)
    
    resp = make_request("GET", "/usage")
    
    if not resp:
        log_test("Usage: GET info", False, "Request failed")
        return False
    
    if resp.status_code != 200:
        log_test("Usage: GET info", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    
    required_fields = ["is_pro", "chat_today", "chat_daily_limit", "coach_this_month", "coach_monthly_limit", "credits_balance"]
    for field in required_fields:
        if field not in data:
            log_test("Usage: GET info", False, f"Missing field: {field}")
            return False
    
    if data["is_pro"] != False:
        log_test("Usage: GET info", False, f"is_pro should be False, got {data['is_pro']}")
        return False
    
    if data["chat_daily_limit"] != 15:
        log_test("Usage: GET info", False, f"chat_daily_limit should be 15, got {data['chat_daily_limit']}")
        return False
    
    if data["coach_monthly_limit"] != 1:
        log_test("Usage: GET info", False, f"coach_monthly_limit should be 1, got {data['coach_monthly_limit']}")
        return False
    
    if data["credits_balance"] != 0:
        log_test("Usage: GET info", False, f"credits_balance should be 0, got {data['credits_balance']}")
        return False
    
    log_test("Usage: GET info", True, f"is_pro={data['is_pro']}, chat_today={data['chat_today']}, coach_this_month={data['coach_this_month']}")
    return True


# ============================================================================
# 9. CHAT QUOTA ENFORCEMENT
# ============================================================================

def test_chat_quota_enforcement():
    """Test chat quota: 15 messages OK, 16th returns 402"""
    print("\n" + "="*80)
    print("9. CHAT QUOTA ENFORCEMENT (15 FREE MESSAGES)")
    print("="*80)
    
    # First, update profile with physical data so chat works properly
    profile_data = {
        "weight": 70,
        "height": 175,
        "age": 30,
        "sex": "uomo"
    }
    resp = make_request("PUT", "/profile", profile_data)
    if not resp or resp.status_code != 200:
        log_warning("Chat Quota: Profile update", "Failed to update profile, continuing anyway")
    
    # Send 15 chat messages
    for i in range(1, 16):
        chat_data = {
            "text": f"Messaggio di test numero {i}",
            "mode": "general"
        }
        resp = make_request("POST", "/chat", chat_data)
        
        if not resp or resp.status_code != 200:
            log_test("Chat Quota: Message {i}", False, f"Message {i} failed: {resp.status_code if resp else 'None'}")
            return False
        
        data = resp.json()
        if "user_message" not in data or "clone_message" not in data:
            log_test("Chat Quota: Message {i}", False, f"Message {i} missing fields: {data}")
            return False
    
    log_test("Chat Quota: 15 messages", True, "All 15 free messages sent successfully")
    
    # Verify usage
    resp = make_request("GET", "/usage")
    if resp and resp.status_code == 200:
        usage = resp.json()
        if usage.get("chat_today") != 15:
            log_warning("Chat Quota: Usage count", f"Expected chat_today=15, got {usage.get('chat_today')}")
    
    # Send 16th message - should return 402
    chat_data = {
        "text": "Messaggio numero 16 - dovrebbe fallire",
        "mode": "general"
    }
    resp = make_request("POST", "/chat", chat_data)
    
    if not resp:
        log_test("Chat Quota: 16th message (402)", False, "Request failed")
        return False
    
    if resp.status_code != 402:
        log_test("Chat Quota: 16th message (402)", False, f"Expected 402, got {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    if "detail" not in data:
        log_test("Chat Quota: 16th message (402)", False, f"Missing detail in 402 response: {data}")
        return False
    
    detail = data["detail"]
    if isinstance(detail, dict):
        if detail.get("code") != "chat_limit_reached":
            log_test("Chat Quota: 16th message (402)", False, f"Expected code='chat_limit_reached', got {detail.get('code')}")
            return False
    
    log_test("Chat Quota: 16th message (402)", True, "Correctly rejected with 402 and code='chat_limit_reached'")
    return True


# ============================================================================
# 10. COACH QUOTA ENFORCEMENT
# ============================================================================

def test_coach_quota_enforcement():
    """Test coach quota: 1 plan OK, 2nd returns 402"""
    print("\n" + "="*80)
    print("10. COACH QUOTA ENFORCEMENT (1 FREE PLAN/MONTH)")
    print("="*80)
    
    # First plan should succeed
    plan_data = {
        "kind": "fitness"
    }
    resp = make_request("POST", "/coach/plan", plan_data)
    
    if not resp or resp.status_code != 200:
        log_test("Coach Quota: First plan", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    if "content" not in data:
        log_test("Coach Quota: First plan", False, f"Missing content: {data}")
        return False
    
    log_test("Coach Quota: First plan", True, f"First plan generated: {len(data['content'])} chars")
    
    # Second plan should return 402
    plan_data = {
        "kind": "nutrition"
    }
    resp = make_request("POST", "/coach/plan", plan_data)
    
    if not resp:
        log_test("Coach Quota: Second plan (402)", False, "Request failed")
        return False
    
    if resp.status_code != 402:
        log_test("Coach Quota: Second plan (402)", False, f"Expected 402, got {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    if "detail" not in data:
        log_test("Coach Quota: Second plan (402)", False, f"Missing detail in 402 response: {data}")
        return False
    
    detail = data["detail"]
    if isinstance(detail, dict):
        if detail.get("code") != "coach_limit_reached":
            log_test("Coach Quota: Second plan (402)", False, f"Expected code='coach_limit_reached', got {detail.get('code')}")
            return False
    
    log_test("Coach Quota: Second plan (402)", True, "Correctly rejected with 402 and code='coach_limit_reached'")
    return True


# ============================================================================
# 11. BILLING PORTAL
# ============================================================================

def test_billing_portal():
    """Test POST /api/payments/portal"""
    print("\n" + "="*80)
    print("11. BILLING PORTAL")
    print("="*80)
    
    portal_data = {
        "return_url": "https://example.com/dashboard"
    }
    
    resp = make_request("POST", "/payments/portal", portal_data)
    
    if not resp:
        log_test("Billing Portal: Create session", False, "Request failed")
        return False
    
    # User has no stripe_customer_id yet (never completed checkout), so should return 400
    if resp.status_code == 400:
        if "Nessun account cliente trovato" in resp.text:
            log_test("Billing Portal: No customer", True, "Correctly returned 400 'Nessun account cliente trovato'")
            return True
        else:
            log_test("Billing Portal: Create session", False, f"Got 400 but wrong message: {resp.text}")
            return False
    
    # If customer exists (from checkout), should return URL
    if resp.status_code == 200:
        data = resp.json()
        if "url" not in data:
            log_test("Billing Portal: Create session", False, f"Missing url: {data}")
            return False
        
        if not data["url"].startswith("https://billing.stripe.com"):
            log_test("Billing Portal: Create session", False, f"url should start with https://billing.stripe.com, got {data['url']}")
            return False
        
        log_test("Billing Portal: Create session", True, f"Portal URL: {data['url'][:50]}...")
        return True
    
    log_test("Billing Portal: Create session", False, f"Unexpected status {resp.status_code}: {resp.text}")
    return False


# ============================================================================
# 12. WEBHOOK SIGNATURE PROTECTION
# ============================================================================

def test_webhook_signature_protection():
    """Test POST /api/stripe/webhook without signature returns 400"""
    print("\n" + "="*80)
    print("12. WEBHOOK SIGNATURE PROTECTION")
    print("="*80)
    
    # Send empty body with no signature
    resp = make_request("POST", "/stripe/webhook", {}, use_auth=False, headers={"stripe-signature": ""})
    
    if not resp:
        log_test("Webhook: Signature protection", False, "Request failed")
        return False
    
    if resp.status_code != 400:
        log_test("Webhook: Signature protection", False, f"Expected 400, got {resp.status_code}: {resp.text}")
        return False
    
    if "Invalid signature" not in resp.text:
        log_test("Webhook: Signature protection", False, f"Expected 'Invalid signature', got: {resp.text}")
        return False
    
    log_test("Webhook: Signature protection", True, "Correctly rejected with 400 'Invalid signature'")
    return True


# ============================================================================
# 13. AUTH PROTECTION
# ============================================================================

def test_auth_protection():
    """Test that protected endpoints return 401/403 without Bearer token"""
    print("\n" + "="*80)
    print("13. AUTH PROTECTION ON ENDPOINTS")
    print("="*80)
    
    protected_endpoints = [
        ("GET", "/usage"),
        ("GET", "/payments/subscription"),
        ("POST", "/payments/portal", {})
    ]
    
    all_passed = True
    
    for method, endpoint, *data in protected_endpoints:
        payload = data[0] if data else None
        resp = make_request(method, endpoint, payload, use_auth=False)
        
        if not resp:
            log_test(f"Auth Protection: {method} {endpoint}", False, "Request failed")
            all_passed = False
            continue
        
        if resp.status_code not in [401, 403]:
            log_test(f"Auth Protection: {method} {endpoint}", False, f"Expected 401/403, got {resp.status_code}")
            all_passed = False
        else:
            log_test(f"Auth Protection: {method} {endpoint}", True, f"Correctly rejected with {resp.status_code}")
    
    return all_passed


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all monetization tests in order"""
    print("\n" + "="*80)
    print("iCLONE MONETIZATION BACKEND TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print("="*80)
    
    # Test 1: Plans endpoint (public)
    test_payments_plans()
    
    # Test 2: Register user and verify fields
    if not test_register_and_verify_fields():
        print("\n❌ CRITICAL: Cannot register user. Stopping tests.")
        return
    
    # Test 3: Checkout for subscription (first time)
    test_checkout_subscription_first()
    
    # Test 4: Check payment status (pending)
    test_payment_status_pending()
    
    # Test 5: Checkout again (welcome_applied=false)
    test_checkout_subscription_second()
    
    # Test 6: Checkout for credit pack
    test_checkout_credit_pack()
    
    # Test 7: Get subscription info
    test_get_subscription()
    
    # Test 8: Get usage info
    test_get_usage()
    
    # Test 9: Chat quota enforcement
    test_chat_quota_enforcement()
    
    # Test 10: Coach quota enforcement
    test_coach_quota_enforcement()
    
    # Test 11: Billing portal
    test_billing_portal()
    
    # Test 12: Webhook signature protection
    test_webhook_signature_protection()
    
    # Test 13: Auth protection
    test_auth_protection()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"✅ PASSED: {len(results['passed'])}")
    print(f"❌ FAILED: {len(results['failed'])}")
    print(f"⚠️  WARNINGS: {len(results['warnings'])}")
    
    if results['failed']:
        print("\n" + "="*80)
        print("FAILED TESTS:")
        print("="*80)
        for fail in results['failed']:
            print(f"❌ {fail['test']}")
            print(f"   {fail['message']}")
    
    if results['warnings']:
        print("\n" + "="*80)
        print("WARNINGS:")
        print("="*80)
        for warn in results['warnings']:
            print(f"⚠️  {warn['test']}")
            print(f"   {warn['message']}")
    
    print("\n" + "="*80)
    print("MONETIZATION TEST EXECUTION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    run_all_tests()
