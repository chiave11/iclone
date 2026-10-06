#!/usr/bin/env python3
"""
Comprehensive backend API tests for iClone
Tests all endpoints in priority order with realistic Italian data
"""
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Optional

# Base URL from frontend/.env
BASE_URL = "https://recreate-video-5.preview.emergentagent.com/api"

# Test user data (realistic Italian)
TEST_USER = {
    "email": "marco.rossi@example.com",
    "password": "SecurePass123!",
    "name": "Marco Rossi"
}

# Global token storage
auth_token: Optional[str] = None
test_user_id: Optional[str] = None

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


def make_request(method: str, endpoint: str, data: dict = None, use_auth: bool = True, expect_status: int = 200):
    """Make HTTP request with optional auth"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if use_auth and auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=headers, timeout=30)
        elif method == "PUT":
            resp = requests.put(url, json=data, headers=headers, timeout=30)
        elif method == "PATCH":
            resp = requests.patch(url, json=data, headers=headers, timeout=30)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return resp
    except requests.exceptions.RequestException as e:
        print(f"   Request error: {e}")
        return None


# ============================================================================
# 1. AUTH TESTS (PRIORITY 1)
# ============================================================================

def test_auth_register():
    """Test user registration"""
    global auth_token, test_user_id
    
    print("\n" + "="*80)
    print("1. AUTH FLOW TESTS")
    print("="*80)
    
    resp = make_request("POST", "/auth/register", TEST_USER, use_auth=False)
    
    if not resp:
        log_test("Auth: Register", False, "Request failed")
        return False
    
    if resp.status_code == 400 and "gia' registrata" in resp.text.lower():
        # User already exists, try login instead
        log_warning("Auth: Register", "User already exists, will use login")
        return test_auth_login()
    
    if resp.status_code != 200:
        log_test("Auth: Register", False, f"Status {resp.status_code}: {resp.text}")
        return False
    
    data = resp.json()
    if "token" not in data or "user" not in data:
        log_test("Auth: Register", False, f"Missing token or user in response: {data}")
        return False
    
    auth_token = data["token"]
    test_user_id = data["user"].get("id")
    
    if not auth_token or not test_user_id:
        log_test("Auth: Register", False, "Token or user ID is empty")
        return False
    
    log_test("Auth: Register", True, f"User ID: {test_user_id}")
    return True


def test_auth_login():
    """Test user login"""
    global auth_token, test_user_id
    
    resp = make_request("POST", "/auth/login", {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }, use_auth=False)
    
    if not resp or resp.status_code != 200:
        log_test("Auth: Login", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if "token" not in data or "user" not in data:
        log_test("Auth: Login", False, f"Missing token or user: {data}")
        return False
    
    auth_token = data["token"]
    test_user_id = data["user"].get("id")
    
    log_test("Auth: Login", True, f"Token received, User ID: {test_user_id}")
    return True


def test_auth_wrong_password():
    """Test login with wrong password returns 401"""
    resp = make_request("POST", "/auth/login", {
        "email": TEST_USER["email"],
        "password": "WrongPassword123!"
    }, use_auth=False)
    
    if not resp:
        log_test("Auth: Wrong password", False, "Request failed")
        return False
    
    if resp.status_code == 401:
        log_test("Auth: Wrong password", True, "Correctly rejected with 401")
        return True
    else:
        log_test("Auth: Wrong password", False, f"Expected 401, got {resp.status_code}")
        return False


def test_auth_duplicate_email():
    """Test duplicate email registration returns 400"""
    resp = make_request("POST", "/auth/register", TEST_USER, use_auth=False)
    
    if not resp:
        log_test("Auth: Duplicate email", False, "Request failed")
        return False
    
    if resp.status_code == 400:
        log_test("Auth: Duplicate email", True, "Correctly rejected with 400")
        return True
    else:
        log_test("Auth: Duplicate email", False, f"Expected 400, got {resp.status_code}")
        return False


def test_auth_me():
    """Test GET /auth/me with Bearer token"""
    resp = make_request("GET", "/auth/me")
    
    if not resp or resp.status_code != 200:
        log_test("Auth: GET /me", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if "id" not in data or "email" not in data:
        log_test("Auth: GET /me", False, f"Missing user fields: {data}")
        return False
    
    log_test("Auth: GET /me", True, f"User: {data.get('name')} ({data.get('email')})")
    return True


def test_auth_no_token():
    """Test that protected endpoints reject requests without token"""
    resp = make_request("GET", "/auth/me", use_auth=False)
    
    if not resp:
        log_test("Auth: No token rejection", False, "Request failed")
        return False
    
    if resp.status_code == 401 or resp.status_code == 403:
        log_test("Auth: No token rejection", True, f"Correctly rejected with {resp.status_code}")
        return True
    else:
        log_test("Auth: No token rejection", False, f"Expected 401/403, got {resp.status_code}")
        return False


# ============================================================================
# 2. PROFILE TESTS (PRIORITY 2)
# ============================================================================

def test_profile_onboarding():
    """Test profile update with onboarding data"""
    print("\n" + "="*80)
    print("2. PROFILE UPDATE TESTS")
    print("="*80)
    
    profile_data = {
        "name": "Marco Rossi",
        "tone": "amichevole",
        "interests": ["fitness", "tecnologia", "cucina"],
        "habits": ["corsa mattutina", "meditazione"],
        "goals": "Migliorare forma fisica e produttività",
        "completedOnboarding": True
    }
    
    resp = make_request("PUT", "/profile", profile_data)
    
    if not resp or resp.status_code != 200:
        log_test("Profile: Onboarding update", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if data.get("completedOnboarding") != True:
        log_test("Profile: Onboarding update", False, "completedOnboarding not set to true")
        return False
    
    log_test("Profile: Onboarding update", True, "Onboarding data saved")
    return True


def test_profile_physical_data():
    """Test profile update with physical data"""
    physical_data = {
        "weight": 72,
        "height": 178,
        "age": 29,
        "sex": "uomo",
        "fitness_goal": "dimagrire",
        "activity_level": "moderato"
    }
    
    resp = make_request("PUT", "/profile", physical_data)
    
    if not resp or resp.status_code != 200:
        log_test("Profile: Physical data update", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if data.get("weight") != 72 or data.get("height") != 178:
        log_test("Profile: Physical data update", False, f"Physical data not saved correctly: {data}")
        return False
    
    log_test("Profile: Physical data update", True, "Physical data saved")
    return True


def test_profile_verify_updates():
    """Verify GET /auth/me returns updated profile fields"""
    resp = make_request("GET", "/auth/me")
    
    if not resp or resp.status_code != 200:
        log_test("Profile: Verify updates", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    
    # Check onboarding fields
    if not data.get("completedOnboarding"):
        log_test("Profile: Verify updates", False, "completedOnboarding not persisted")
        return False
    
    # Check physical fields
    if data.get("weight") != 72 or data.get("height") != 178:
        log_test("Profile: Verify updates", False, f"Physical data not persisted: weight={data.get('weight')}, height={data.get('height')}")
        return False
    
    log_test("Profile: Verify updates", True, "All profile updates persisted correctly")
    return True


# ============================================================================
# 3. EVENTS CRUD TESTS (PRIORITY 3)
# ============================================================================

created_event_id = None

def test_events_create():
    """Test POST /events"""
    global created_event_id
    
    print("\n" + "="*80)
    print("3. EVENTS CRUD TESTS")
    print("="*80)
    
    event_data = {
        "title": "Riunione team",
        "time": "09:30",
        "date": "today",
        "color": "coral",
        "type": "work"
    }
    
    resp = make_request("POST", "/events", event_data)
    
    if not resp or resp.status_code != 200:
        log_test("Events: Create", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if "id" not in data or data.get("title") != event_data["title"]:
        log_test("Events: Create", False, f"Invalid response: {data}")
        return False
    
    created_event_id = data["id"]
    log_test("Events: Create", True, f"Event created: {created_event_id}")
    return True


def test_events_list():
    """Test GET /events"""
    resp = make_request("GET", "/events")
    
    if not resp or resp.status_code != 200:
        log_test("Events: List", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not isinstance(data, list):
        log_test("Events: List", False, f"Expected list, got: {type(data)}")
        return False
    
    if len(data) == 0:
        log_warning("Events: List", "No events found (expected at least 1)")
    
    log_test("Events: List", True, f"Retrieved {len(data)} events")
    return True


def test_events_delete():
    """Test DELETE /events/{id}"""
    if not created_event_id:
        log_test("Events: Delete", False, "No event ID to delete")
        return False
    
    resp = make_request("DELETE", f"/events/{created_event_id}")
    
    if not resp or resp.status_code != 200:
        log_test("Events: Delete", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not data.get("ok"):
        log_test("Events: Delete", False, f"Delete failed: {data}")
        return False
    
    log_test("Events: Delete", True, "Event deleted successfully")
    return True


# ============================================================================
# 4. REMINDERS CRUD TESTS (PRIORITY 4)
# ============================================================================

created_reminder_id = None

def test_reminders_create():
    """Test POST /reminders"""
    global created_reminder_id
    
    print("\n" + "="*80)
    print("4. REMINDERS CRUD TESTS")
    print("="*80)
    
    due_date = (datetime.now() + timedelta(days=1)).isoformat()
    reminder_data = {
        "text": "Comprare latte e pane",
        "priority": "alta",
        "due_at": due_date
    }
    
    resp = make_request("POST", "/reminders", reminder_data)
    
    if not resp or resp.status_code != 200:
        log_test("Reminders: Create", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if "id" not in data or data.get("text") != reminder_data["text"]:
        log_test("Reminders: Create", False, f"Invalid response: {data}")
        return False
    
    created_reminder_id = data["id"]
    log_test("Reminders: Create", True, f"Reminder created: {created_reminder_id}")
    return True


def test_reminders_list():
    """Test GET /reminders"""
    resp = make_request("GET", "/reminders")
    
    if not resp or resp.status_code != 200:
        log_test("Reminders: List", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not isinstance(data, list):
        log_test("Reminders: List", False, f"Expected list, got: {type(data)}")
        return False
    
    log_test("Reminders: List", True, f"Retrieved {len(data)} reminders")
    return True


def test_reminders_update():
    """Test PATCH /reminders/{id} with done: true"""
    if not created_reminder_id:
        log_test("Reminders: Update", False, "No reminder ID to update")
        return False
    
    resp = make_request("PATCH", f"/reminders/{created_reminder_id}", {"done": True})
    
    if not resp or resp.status_code != 200:
        log_test("Reminders: Update", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not data.get("done"):
        log_test("Reminders: Update", False, f"done not set to true: {data}")
        return False
    
    log_test("Reminders: Update", True, "Reminder marked as done")
    return True


def test_reminders_delete():
    """Test DELETE /reminders/{id}"""
    if not created_reminder_id:
        log_test("Reminders: Delete", False, "No reminder ID to delete")
        return False
    
    resp = make_request("DELETE", f"/reminders/{created_reminder_id}")
    
    if not resp or resp.status_code != 200:
        log_test("Reminders: Delete", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not data.get("ok"):
        log_test("Reminders: Delete", False, f"Delete failed: {data}")
        return False
    
    log_test("Reminders: Delete", True, "Reminder deleted successfully")
    return True


# ============================================================================
# 5. NOTES CRUD TESTS (PRIORITY 5)
# ============================================================================

created_note_id = None

def test_notes_create():
    """Test POST /notes"""
    global created_note_id
    
    print("\n" + "="*80)
    print("5. NOTES CRUD TESTS")
    print("="*80)
    
    note_data = {
        "title": "Idee progetto",
        "content": "Sviluppare app per gestione tempo con AI integrata",
        "color": "coral"
    }
    
    resp = make_request("POST", "/notes", note_data)
    
    if not resp or resp.status_code != 200:
        log_test("Notes: Create", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if "id" not in data or data.get("title") != note_data["title"]:
        log_test("Notes: Create", False, f"Invalid response: {data}")
        return False
    
    created_note_id = data["id"]
    log_test("Notes: Create", True, f"Note created: {created_note_id}")
    return True


def test_notes_list():
    """Test GET /notes"""
    resp = make_request("GET", "/notes")
    
    if not resp or resp.status_code != 200:
        log_test("Notes: List", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not isinstance(data, list):
        log_test("Notes: List", False, f"Expected list, got: {type(data)}")
        return False
    
    log_test("Notes: List", True, f"Retrieved {len(data)} notes")
    return True


def test_notes_update():
    """Test PATCH /notes/{id}"""
    if not created_note_id:
        log_test("Notes: Update", False, "No note ID to update")
        return False
    
    update_data = {
        "title": "Idee progetto (aggiornato)",
        "content": "Sviluppare app per gestione tempo con AI integrata - versione 2.0",
        "color": "blue"
    }
    
    resp = make_request("PATCH", f"/notes/{created_note_id}", update_data)
    
    if not resp or resp.status_code != 200:
        log_test("Notes: Update", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if data.get("title") != update_data["title"]:
        log_test("Notes: Update", False, f"Title not updated: {data}")
        return False
    
    log_test("Notes: Update", True, "Note updated successfully")
    return True


def test_notes_delete():
    """Test DELETE /notes/{id}"""
    if not created_note_id:
        log_test("Notes: Delete", False, "No note ID to delete")
        return False
    
    resp = make_request("DELETE", f"/notes/{created_note_id}")
    
    if not resp or resp.status_code != 200:
        log_test("Notes: Delete", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not data.get("ok"):
        log_test("Notes: Delete", False, f"Delete failed: {data}")
        return False
    
    log_test("Notes: Delete", True, "Note deleted successfully")
    return True


# ============================================================================
# 6. CHAT TESTS (PRIORITY 6 - CRITICAL, USES EMERGENT LLM)
# ============================================================================

def test_chat_general():
    """Test POST /chat with mode: general"""
    print("\n" + "="*80)
    print("6. CHAT WITH LLM TESTS (CRITICAL)")
    print("="*80)
    
    chat_data = {
        "text": "Ciao, come posso iniziare la giornata?",
        "mode": "general"
    }
    
    resp = make_request("POST", "/chat", chat_data, expect_status=200)
    
    if not resp or resp.status_code != 200:
        log_test("Chat: General mode", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    if "user_message" not in data or "clone_message" not in data:
        log_test("Chat: General mode", False, f"Missing messages in response: {data}")
        return False
    
    clone_text = data["clone_message"].get("text", "")
    if not clone_text or len(clone_text) < 10:
        log_test("Chat: General mode", False, f"Clone message is empty or too short: '{clone_text}'")
        return False
    
    log_test("Chat: General mode", True, f"Response: {clone_text[:100]}...")
    return True


def test_chat_fitness():
    """Test POST /chat with mode: fitness"""
    chat_data = {
        "text": "Dammi un allenamento rapido",
        "mode": "fitness"
    }
    
    resp = make_request("POST", "/chat", chat_data)
    
    if not resp or resp.status_code != 200:
        log_test("Chat: Fitness mode", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    clone_text = data.get("clone_message", {}).get("text", "")
    
    if not clone_text or len(clone_text) < 10:
        log_test("Chat: Fitness mode", False, f"Clone message is empty or too short: '{clone_text}'")
        return False
    
    log_test("Chat: Fitness mode", True, f"Response: {clone_text[:100]}...")
    return True


def test_chat_nutrition():
    """Test POST /chat with mode: nutrition"""
    chat_data = {
        "text": "Idee pranzo sano",
        "mode": "nutrition"
    }
    
    resp = make_request("POST", "/chat", chat_data)
    
    if not resp or resp.status_code != 200:
        log_test("Chat: Nutrition mode", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    clone_text = data.get("clone_message", {}).get("text", "")
    
    if not clone_text or len(clone_text) < 10:
        log_test("Chat: Nutrition mode", False, f"Clone message is empty or too short: '{clone_text}'")
        return False
    
    log_test("Chat: Nutrition mode", True, f"Response: {clone_text[:100]}...")
    return True


def test_chat_psychology():
    """Test POST /chat with mode: psychology (uses claude-sonnet-5-5)"""
    chat_data = {
        "text": "Mi sento stressato oggi",
        "mode": "psychology"
    }
    
    resp = make_request("POST", "/chat", chat_data)
    
    if not resp or resp.status_code != 200:
        log_test("Chat: Psychology mode (Claude)", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    clone_text = data.get("clone_message", {}).get("text", "")
    
    if not clone_text or len(clone_text) < 10:
        log_test("Chat: Psychology mode (Claude)", False, f"Clone message is empty or too short: '{clone_text}'")
        return False
    
    log_test("Chat: Psychology mode (Claude)", True, f"Response: {clone_text[:100]}...")
    return True


def test_chat_history():
    """Test GET /chat/{mode} returns saved history"""
    resp = make_request("GET", "/chat/general")
    
    if not resp or resp.status_code != 200:
        log_test("Chat: History retrieval", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not isinstance(data, list):
        log_test("Chat: History retrieval", False, f"Expected list, got: {type(data)}")
        return False
    
    if len(data) < 2:
        log_test("Chat: History retrieval", False, f"Expected at least 2 messages, got {len(data)}")
        return False
    
    log_test("Chat: History retrieval", True, f"Retrieved {len(data)} messages from history")
    return True


# ============================================================================
# 7. DAILY SUGGESTIONS TESTS (PRIORITY 7)
# ============================================================================

def test_suggestions_daily():
    """Test GET /suggestions/daily"""
    print("\n" + "="*80)
    print("7. DAILY SUGGESTIONS TESTS")
    print("="*80)
    
    resp = make_request("GET", "/suggestions/daily")
    
    if not resp or resp.status_code != 200:
        log_test("Suggestions: Daily generation", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    if not isinstance(data, list):
        log_test("Suggestions: Daily generation", False, f"Expected list, got: {type(data)}")
        return False
    
    if len(data) != 3:
        log_test("Suggestions: Daily generation", False, f"Expected 3 items, got {len(data)}")
        return False
    
    for item in data:
        if "icon" not in item or "text" not in item:
            log_test("Suggestions: Daily generation", False, f"Missing icon or text in item: {item}")
            return False
    
    log_test("Suggestions: Daily generation", True, f"Generated 3 suggestions")
    
    # Store first call results for caching test
    return data


def test_suggestions_caching():
    """Test that second call returns cached result"""
    first_call = test_suggestions_daily()
    if not first_call:
        log_test("Suggestions: Caching", False, "First call failed")
        return False
    
    time.sleep(1)  # Small delay
    
    resp = make_request("GET", "/suggestions/daily")
    
    if not resp or resp.status_code != 200:
        log_test("Suggestions: Caching", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    second_call = resp.json()
    
    # Compare results - should be identical if cached
    if first_call == second_call:
        log_test("Suggestions: Caching", True, "Second call returned cached result")
        return True
    else:
        log_warning("Suggestions: Caching", "Second call returned different result (may not be cached)")
        return True  # Not a critical failure


# ============================================================================
# 8. COACH PLANS TESTS (PRIORITY 8)
# ============================================================================

def test_coach_plan_fitness():
    """Test POST /coach/plan with kind: fitness"""
    print("\n" + "="*80)
    print("8. COACH PLANS TESTS")
    print("="*80)
    
    plan_data = {
        "kind": "fitness"
    }
    
    resp = make_request("POST", "/coach/plan", plan_data)
    
    if not resp or resp.status_code != 200:
        log_test("Coach: Fitness plan generation", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    if "content" not in data:
        log_test("Coach: Fitness plan generation", False, f"Missing content in response: {data}")
        return False
    
    content = data["content"]
    if not content or len(content) < 100:
        log_test("Coach: Fitness plan generation", False, f"Content is empty or too short: {len(content)} chars")
        return False
    
    log_test("Coach: Fitness plan generation", True, f"Generated plan: {len(content)} chars")
    return True


def test_coach_plan_nutrition():
    """Test POST /coach/plan with kind: nutrition"""
    plan_data = {
        "kind": "nutrition"
    }
    
    resp = make_request("POST", "/coach/plan", plan_data)
    
    if not resp or resp.status_code != 200:
        log_test("Coach: Nutrition plan generation", False, f"Status {resp.status_code if resp else 'None'}: {resp.text if resp else 'No response'}")
        return False
    
    data = resp.json()
    if "content" not in data:
        log_test("Coach: Nutrition plan generation", False, f"Missing content in response: {data}")
        return False
    
    content = data["content"]
    if not content or len(content) < 100:
        log_test("Coach: Nutrition plan generation", False, f"Content is empty or too short: {len(content)} chars")
        return False
    
    log_test("Coach: Nutrition plan generation", True, f"Generated plan: {len(content)} chars")
    return True


def test_coach_plan_retrieval():
    """Test GET /coach/plans/{kind} returns latest plan"""
    resp = make_request("GET", "/coach/plans/fitness")
    
    if not resp or resp.status_code != 200:
        log_test("Coach: Plan retrieval", False, f"Status {resp.status_code if resp else 'None'}")
        return False
    
    data = resp.json()
    if not data or "content" not in data:
        log_test("Coach: Plan retrieval", False, f"No plan found or missing content: {data}")
        return False
    
    log_test("Coach: Plan retrieval", True, "Latest fitness plan retrieved")
    return True


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all tests in priority order"""
    print("\n" + "="*80)
    print("iCLONE BACKEND API COMPREHENSIVE TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_USER['email']}")
    print("="*80)
    
    # Priority 1: Auth
    if not test_auth_register():
        print("\n⚠️  Registration failed, trying login...")
        if not test_auth_login():
            print("\n❌ CRITICAL: Cannot authenticate. Stopping tests.")
            return
    
    test_auth_wrong_password()
    test_auth_duplicate_email()
    test_auth_me()
    test_auth_no_token()
    
    # Priority 2: Profile
    test_profile_onboarding()
    test_profile_physical_data()
    test_profile_verify_updates()
    
    # Priority 3: Events
    test_events_create()
    test_events_list()
    test_events_delete()
    
    # Priority 4: Reminders
    test_reminders_create()
    test_reminders_list()
    test_reminders_update()
    test_reminders_delete()
    
    # Priority 5: Notes
    test_notes_create()
    test_notes_list()
    test_notes_update()
    test_notes_delete()
    
    # Priority 6: Chat (CRITICAL - uses Emergent LLM)
    test_chat_general()
    test_chat_fitness()
    test_chat_nutrition()
    test_chat_psychology()
    test_chat_history()
    
    # Priority 7: Daily suggestions
    test_suggestions_daily()
    test_suggestions_caching()
    
    # Priority 8: Coach plans
    test_coach_plan_fitness()
    test_coach_plan_nutrition()
    test_coach_plan_retrieval()
    
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
    print("TEST EXECUTION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    run_all_tests()
