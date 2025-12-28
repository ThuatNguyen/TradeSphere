#!/bin/bash

# Script để test Zalo webhook

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 Test Zalo Webhook                                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
VPS_IP="103.130.218.214"
DOMAIN="thuatnguyen.io.vn"
WEBHOOK_URL="https://${DOMAIN}/api/v1/zalo/webhook"
LOCAL_WEBHOOK="http://localhost:8000/api/v1/zalo/webhook"

# Function to test webhook endpoint
test_webhook() {
    local url=$1
    local test_name=$2
    local message=$3
    
    echo -e "${YELLOW}▶ Test: ${test_name}${NC}"
    echo -e "  URL: ${url}"
    echo -e "  Message: ${message}"
    
    response=$(curl -s -X POST "${url}" \
        -H "Content-Type: application/json" \
        -H "X-Zalo-Signature: test_signature" \
        -d "{
            \"event_name\": \"user_send_text\",
            \"sender\": {
                \"id\": \"test_user_$(date +%s)\"
            },
            \"recipient\": {
                \"id\": \"oa_test\"
            },
            \"message\": {
                \"text\": \"${message}\"
            },
            \"timestamp\": \"$(date +%s)\"
        }")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Request sent successfully${NC}"
        echo -e "  Response: ${response}"
    else
        echo -e "${RED}✗ Request failed${NC}"
    fi
    echo ""
}

# Main menu
echo "Chọn test scenario:"
echo ""
echo "1. Test webhook endpoint (health check)"
echo "2. Test với số điện thoại"
echo "3. Test với tài khoản ngân hàng"
echo "4. Test với tin nhắn tự do (AI chat)"
echo "5. Test follow event"
echo "6. Test unfollow event"
echo "7. Check webhook logs"
echo "8. Check FastAPI service status"
echo "9. Test tất cả scenarios"
echo ""
read -p "Nhập lựa chọn (1-9): " choice

case $choice in
    1)
        echo -e "${BLUE}🔍 Testing webhook endpoint...${NC}"
        curl -I "${WEBHOOK_URL}"
        ;;
    
    2)
        echo -e "${BLUE}📱 Testing với số điện thoại...${NC}"
        test_webhook "${WEBHOOK_URL}" "Số điện thoại" "0909123456"
        ;;
    
    3)
        echo -e "${BLUE}🏦 Testing với tài khoản ngân hàng...${NC}"
        test_webhook "${WEBHOOK_URL}" "Tài khoản ngân hàng" "9704229876543210123456"
        ;;
    
    4)
        echo -e "${BLUE}💬 Testing với tin nhắn AI...${NC}"
        test_webhook "${WEBHOOK_URL}" "AI Chat" "Làm sao để tránh bị lừa đảo online?"
        ;;
    
    5)
        echo -e "${BLUE}➕ Testing follow event...${NC}"
        curl -s -X POST "${WEBHOOK_URL}" \
            -H "Content-Type: application/json" \
            -d "{
                \"event_name\": \"follow\",
                \"follower\": {
                    \"id\": \"test_user_$(date +%s)\"
                },
                \"timestamp\": \"$(date +%s)\"
            }" | jq .
        ;;
    
    6)
        echo -e "${BLUE}➖ Testing unfollow event...${NC}"
        curl -s -X POST "${WEBHOOK_URL}" \
            -H "Content-Type: application/json" \
            -d "{
                \"event_name\": \"unfollow\",
                \"follower\": {
                    \"id\": \"test_user_$(date +%s)\"
                },
                \"timestamp\": \"$(date +%s)\"
            }" | jq .
        ;;
    
    7)
        echo -e "${BLUE}📋 Checking webhook logs...${NC}"
        ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no root@${VPS_IP} \
            'docker logs tradesphere-fastapi --tail=50 | grep -i zalo'
        ;;
    
    8)
        echo -e "${BLUE}📊 Checking FastAPI service status...${NC}"
        echo ""
        echo -e "${YELLOW}Container status:${NC}"
        ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no root@${VPS_IP} \
            'docker ps | grep fastapi'
        echo ""
        echo -e "${YELLOW}Health check:${NC}"
        curl -s https://${DOMAIN}/health | jq .
        echo ""
        echo -e "${YELLOW}Recent logs:${NC}"
        ssh -i ~/.ssh/id_ed25519 -o StrictHostKeyChecking=no root@${VPS_IP} \
            'docker logs tradesphere-fastapi --tail=20'
        ;;
    
    9)
        echo -e "${BLUE}🎯 Running all tests...${NC}"
        echo ""
        
        # Test 1: Health check
        echo -e "${GREEN}═══ Test 1: Webhook Health Check ═══${NC}"
        curl -I "${WEBHOOK_URL}"
        echo ""
        sleep 2
        
        # Test 2: Số điện thoại
        echo -e "${GREEN}═══ Test 2: Số Điện Thoại ═══${NC}"
        test_webhook "${WEBHOOK_URL}" "Số điện thoại" "0909123456"
        sleep 2
        
        # Test 3: Tài khoản ngân hàng
        echo -e "${GREEN}═══ Test 3: Tài Khoản Ngân Hàng ═══${NC}"
        test_webhook "${WEBHOOK_URL}" "Tài khoản ngân hàng" "9704229876543210123456"
        sleep 2
        
        # Test 4: AI Chat
        echo -e "${GREEN}═══ Test 4: AI Chat ═══${NC}"
        test_webhook "${WEBHOOK_URL}" "AI Chat" "Xin chào, bạn có thể giúp tôi kiểm tra lừa đảo không?"
        sleep 2
        
        # Test 5: Follow event
        echo -e "${GREEN}═══ Test 5: Follow Event ═══${NC}"
        curl -s -X POST "${WEBHOOK_URL}" \
            -H "Content-Type: application/json" \
            -d "{
                \"event_name\": \"follow\",
                \"follower\": {
                    \"id\": \"test_user_$(date +%s)\"
                },
                \"timestamp\": \"$(date +%s)\"
            }" | jq .
        
        echo ""
        echo -e "${GREEN}✓ All tests completed!${NC}"
        ;;
    
    *)
        echo -e "${RED}Lựa chọn không hợp lệ${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Test hoàn tất!                                                ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📚 Hướng dẫn thêm:${NC}"
echo "  • Xem logs: ssh root@${VPS_IP} 'docker logs tradesphere-fastapi -f'"
echo "  • API Docs: https://${DOMAIN}/docs"
echo "  • Webhook URL: ${WEBHOOK_URL}"
echo ""
