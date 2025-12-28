#!/bin/bash
# Test script for Zalo OA integration

BASE_URL="http://localhost:8000"
API_URL="${BASE_URL}/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== TradeSphere Zalo OA Test ===${NC}\n"

# 1. Test Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
response=$(curl -s "${BASE_URL}/health")
if echo "$response" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Service is healthy${NC}"
else
    echo -e "${RED}✗ Service health check failed${NC}"
    exit 1
fi
echo ""

# 2. Test Zalo Send Message
echo -e "${YELLOW}2. Testing Send Message to Zalo User...${NC}"
read -p "Enter Zalo User ID (or press Enter to skip): " ZALO_USER_ID

if [ -n "$ZALO_USER_ID" ]; then
    echo "Sending test message..."
    response=$(curl -s -X POST "${API_URL}/zalo/send" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": \"${ZALO_USER_ID}\",
            \"message\": \"🤖 Xin chào! Đây là tin nhắn test từ TradeSphere Anti-Scam Bot.\n\n✅ Hệ thống đã sẵn sàng phục vụ bạn!\n\n💡 Gửi số điện thoại hoặc số tài khoản để kiểm tra lừa đảo.\"
        }")
    
    if echo "$response" | grep -q "\"error\":0"; then
        echo -e "${GREEN}✓ Message sent successfully${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}✗ Failed to send message${NC}"
        echo "$response" | jq '.'
    fi
else
    echo -e "${YELLOW}⊘ Skipped (no user ID provided)${NC}"
fi
echo ""

# 3. Test Webhook with Mock Data
echo -e "${YELLOW}3. Testing Webhook with Mock Data...${NC}"
response=$(curl -s -X POST "${API_URL}/zalo/webhook" \
    -H "Content-Type: application/json" \
    -d '{
        "event_name": "user_send_text",
        "timestamp": "'$(date +%s)'000",
        "app_id": "433408824941888677",
        "recipient": {
            "id": "433408824941888677"
        },
        "sender": {
            "id": "test_user_123"
        },
        "message": {
            "text": "0949654358",
            "msg_id": "test_msg_'$(date +%s)'"
        }
    }')

if echo "$response" | grep -q "success\|processed"; then
    echo -e "${GREEN}✓ Webhook processed successfully${NC}"
    echo "$response" | jq '.'
else
    echo -e "${YELLOW}⚠ Webhook response:${NC}"
    echo "$response" | jq '.'
fi
echo ""

# 4. Test Search Scam (Direct API)
echo -e "${YELLOW}4. Testing Scam Search API...${NC}"
response=$(curl -s "${API_URL}/scams/search?keyword=0949654358")
total_results=$(echo "$response" | jq -r '.total_results // 0')
echo -e "Total results found: ${GREEN}${total_results}${NC}"
echo "$response" | jq '.sources[] | {source: .source, total: .total_scams}'
echo ""

# 5. Test Get Followers
echo -e "${YELLOW}5. Testing Get Followers...${NC}"
response=$(curl -s "${API_URL}/zalo/followers?offset=0&count=5")
if echo "$response" | grep -q "\"error\":0"; then
    echo -e "${GREEN}✓ Followers retrieved successfully${NC}"
    echo "$response" | jq '.data.followers[] | {id: .user_id, display_name: .display_name}' 2>/dev/null || echo "$response"
else
    echo -e "${YELLOW}⚠ Followers response:${NC}"
    echo "$response" | jq '.'
fi
echo ""

# 6. Test AI Chat
echo -e "${YELLOW}6. Testing AI Chat...${NC}"
response=$(curl -s -X POST "${API_URL}/ai/chat" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "Làm sao để nhận biết lừa đảo qua điện thoại?",
        "session_id": "test_session_'$(date +%s)'"
    }')

if echo "$response" | grep -q "response"; then
    echo -e "${GREEN}✓ AI responded${NC}"
    echo "$response" | jq -r '.response' | head -c 200
    echo "..."
else
    echo -e "${RED}✗ AI chat failed${NC}"
    echo "$response" | jq '.'
fi
echo ""

# Summary
echo -e "${YELLOW}=== Test Summary ===${NC}"
echo -e "FastAPI Service: ${BASE_URL}"
echo -e "API Documentation: ${BASE_URL}/docs"
echo -e "Health Status: ${GREEN}✓${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Setup ngrok tunnel: ngrok http 8000"
echo "2. Configure webhook URL in Zalo OA Dashboard"
echo "3. Test with real Zalo messages"
echo ""
echo -e "${GREEN}Done!${NC}"
