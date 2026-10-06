#!/usr/bin/env python3
"""
Re-test failed cases with longer timeout and delays
"""
import requests
import time

BASE_URL = "https://recreate-video-5.preview.emergentagent.com/api"
TEST_USER = {
    "email": "marco.rossi@example.com",
    "password": "SecurePass123!"
}

print("="*80)
print("RE-TESTING FAILED CASES")
print("="*80)

# Get auth token first
print("\n1. Getting auth token...")
resp = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER, timeout=30)
if resp.status_code == 200:
    token = resp.json()["token"]
    print(f"✅ Token obtained")
else:
    print(f"❌ Failed to get token: {resp.status_code}")
    exit(1)

time.sleep(2)

# Test 1: Wrong password
print("\n2. Testing wrong password (should return 401)...")
resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": TEST_USER["email"],
    "password": "WrongPassword123!"
}, timeout=30)
if resp.status_code == 401:
    print(f"✅ PASS: Wrong password correctly rejected with 401")
else:
    print(f"❌ FAIL: Expected 401, got {resp.status_code}")

time.sleep(2)

# Test 2: Duplicate email
print("\n3. Testing duplicate email (should return 400)...")
resp = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER, timeout=30)
if resp.status_code == 400:
    print(f"✅ PASS: Duplicate email correctly rejected with 400")
else:
    print(f"❌ FAIL: Expected 400, got {resp.status_code}")

time.sleep(2)

# Test 3: No token rejection
print("\n4. Testing no token rejection (should return 401/403)...")
resp = requests.get(f"{BASE_URL}/auth/me", timeout=30)
if resp.status_code in [401, 403]:
    print(f"✅ PASS: No token correctly rejected with {resp.status_code}")
else:
    print(f"❌ FAIL: Expected 401/403, got {resp.status_code}")

time.sleep(2)

# Test 4: Nutrition plan with longer timeout
print("\n5. Testing nutrition plan generation (60s timeout)...")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
resp = requests.post(f"{BASE_URL}/coach/plan", json={"kind": "nutrition"}, headers=headers, timeout=60)
if resp.status_code == 200:
    data = resp.json()
    content = data.get("content", "")
    if content and len(content) > 100:
        print(f"✅ PASS: Nutrition plan generated ({len(content)} chars)")
    else:
        print(f"❌ FAIL: Content too short or empty: {len(content)} chars")
else:
    print(f"❌ FAIL: Status {resp.status_code}: {resp.text}")

print("\n" + "="*80)
print("RE-TEST COMPLETE")
print("="*80)
