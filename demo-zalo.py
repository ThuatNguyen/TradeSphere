#!/usr/bin/env python3
"""
Demo script: Zalo OA Integration with TradeSphere
Simulates user interactions with the bot
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f"✓ {text}")

def print_error(text):
    print(f"✗ {text}")

def print_info(text):
    print(f"ℹ {text}")

# Test scenarios
def test_webhook_phone_search():
    """Test: User sends phone number"""
    print_header("TEST 1: User sends phone number")
    
    payload = {
        "event_name": "user_send_text",
        "timestamp": str(int(time.time() * 1000)),
        "sender": {"id": "demo_user_001"},
        "message": {
            "text": "0949654358",
            "msg_id": f"msg_{int(time.time())}"
        }
    }
    
    print_info(f"Sending: {payload['message']['text']}")
    response = requests.post(f"{BASE_URL}/zalo/webhook", json=payload)
    
    if response.status_code == 200:
        print_success("Webhook processed successfully")
        print(json.dumps(response.json(), indent=2))
    else:
        print_error(f"Failed: {response.status_code}")
        print(response.text)

def test_webhook_bank_account():
    """Test: User sends bank account"""
    print_header("TEST 2: User sends bank account number")
    
    payload = {
        "event_name": "user_send_text",
        "timestamp": str(int(time.time() * 1000)),
        "sender": {"id": "demo_user_002"},
        "message": {
            "text": "1234567890123",
            "msg_id": f"msg_{int(time.time())}"
        }
    }
    
    print_info(f"Sending: {payload['message']['text']}")
    response = requests.post(f"{BASE_URL}/zalo/webhook", json=payload)
    
    if response.status_code == 200:
        print_success("Webhook processed successfully")
        print(json.dumps(response.json(), indent=2))
    else:
        print_error(f"Failed: {response.status_code}")

def test_webhook_general_chat():
    """Test: User asks general question"""
    print_header("TEST 3: User asks general question")
    
    payload = {
        "event_name": "user_send_text",
        "timestamp": str(int(time.time() * 1000)),
        "sender": {"id": "demo_user_003"},
        "message": {
            "text": "Làm sao để nhận biết lừa đảo?",
            "msg_id": f"msg_{int(time.time())}"
        }
    }
    
    print_info(f"Sending: {payload['message']['text']}")
    response = requests.post(f"{BASE_URL}/zalo/webhook", json=payload)
    
    if response.status_code == 200:
        print_success("Webhook processed successfully")
        print(json.dumps(response.json(), indent=2))
    else:
        print_error(f"Failed: {response.status_code}")

def test_follow_event():
    """Test: User follows OA"""
    print_header("TEST 4: User follows OA")
    
    payload = {
        "event_name": "follow",
        "timestamp": str(int(time.time() * 1000)),
        "follower": {
            "id": "new_user_123"
        }
    }
    
    print_info("Simulating follow event")
    response = requests.post(f"{BASE_URL}/zalo/webhook", json=payload)
    
    if response.status_code == 200:
        print_success("Follow event processed")
        print(json.dumps(response.json(), indent=2))
    else:
        print_error(f"Failed: {response.status_code}")

def test_scam_search_direct():
    """Test: Direct scam search API"""
    print_header("TEST 5: Direct Scam Search API")
    
    keyword = "0949654358"
    print_info(f"Searching: {keyword}")
    
    response = requests.get(f"{BASE_URL}/scams/search", params={"keyword": keyword})
    
    if response.status_code == 200:
        data = response.json()
        print_success(f"Found {data['total_results']} results")
        
        for source in data['sources']:
            status = "✓" if source['success'] else "✗"
            total = source.get('total_scams', 0)
            print(f"  {status} {source['source']}: {total} results")
    else:
        print_error(f"Failed: {response.status_code}")

def check_database_stats():
    """Check database statistics"""
    print_header("DATABASE STATISTICS")
    
    print_info("Checking Zalo data in database...")
    print("""
Run this SQL to check:

docker-compose exec postgres psql -U tradesphere -d tradesphere -c "
  SELECT 
    (SELECT COUNT(*) FROM zalo_users) as total_users,
    (SELECT COUNT(*) FROM zalo_messages) as total_messages,
    (SELECT COUNT(*) FROM scam_searches WHERE source = 'zalo') as zalo_searches;
"
    """)

def main():
    print("\n" + "🤖 " + "="*58)
    print("  TradeSphere - Zalo OA Integration Demo")
    print("  Testing webhook processing & AI responses")
    print("="*60)
    
    try:
        # Run all tests
        test_webhook_phone_search()
        time.sleep(1)
        
        test_webhook_bank_account()
        time.sleep(1)
        
        test_webhook_general_chat()
        time.sleep(1)
        
        test_follow_event()
        time.sleep(1)
        
        test_scam_search_direct()
        
        check_database_stats()
        
        print("\n" + "="*60)
        print_success("All tests completed!")
        print("\nNext steps:")
        print("1. Setup ngrok: ngrok http 8000")
        print("2. Configure webhook in Zalo OA dashboard")
        print("3. Test with real Zalo app")
        print("="*60 + "\n")
        
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to FastAPI service")
        print_info("Make sure service is running: docker-compose ps")
    except Exception as e:
        print_error(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
