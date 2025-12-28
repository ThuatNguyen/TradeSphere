#!/bin/bash

# Script đăng ký webhook cho Zalo OA
# Webhook cần được đăng ký qua Developer Console của Zalo
# Script này chỉ kiểm tra và hướng dẫn

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS_HOST="root@103.130.218.214"
VPS_DIR="/home/root/tradesphere"
WEBHOOK_URL="https://thuatnguyen.io.vn/api/v1/zalo/webhook"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ĐĂNG KÝ ZALO OA WEBHOOK                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get access token
echo -e "${YELLOW}Bước 1: Lấy access token...${NC}"
ACCESS_TOKEN=$(ssh $VPS_HOST "cat $VPS_DIR/.env | grep ZALO_ACCESS_TOKEN | cut -d= -f2")

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Không tìm thấy access token!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Access token: ${ACCESS_TOKEN:0:50}...${NC}"
echo ""

# Test webhook endpoint
echo -e "${YELLOW}Bước 2: Test webhook endpoint...${NC}"
WEBHOOK_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"event_name":"test"}')

if [ "$WEBHOOK_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Webhook endpoint hoạt động (HTTP $WEBHOOK_TEST)${NC}"
else
    echo -e "${RED}❌ Webhook endpoint lỗi (HTTP $WEBHOOK_TEST)${NC}"
    echo -e "${YELLOW}Hãy kiểm tra FastAPI service đang chạy không${NC}"
fi
echo ""

# Instructions for manual webhook registration
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           HƯỚNG DẪN ĐĂNG KÝ WEBHOOK THỦ CÔNG                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  Zalo không hỗ trợ đăng ký webhook qua API!${NC}"
echo ""
echo -e "Bạn phải đăng ký webhook qua ${BLUE}Zalo Developer Console${NC}:"
echo ""
echo -e "1️⃣  Truy cập: ${GREEN}https://developers.zalo.me/apps/${NC}"
echo ""
echo -e "2️⃣  Chọn app: ${GREEN}TradeSphere Anti-Scam${NC} (App ID: 548847842150265811)"
echo ""
echo -e "3️⃣  Vào tab ${GREEN}Official Account${NC} → ${GREEN}Webhook${NC}"
echo ""
echo -e "4️⃣  Điền thông tin:"
echo -e "    • Webhook URL: ${GREEN}${WEBHOOK_URL}${NC}"
echo -e "    • Events: ${GREEN}✓ user_send_text${NC}"
echo -e "              ${GREEN}✓ user_send_image${NC}"
echo -e "              ${GREEN}✓ follow${NC}"
echo -e "              ${GREEN}✓ unfollow${NC}"
echo ""
echo -e "5️⃣  Click ${GREEN}Verify${NC} để Zalo test webhook"
echo ""
echo -e "6️⃣  Click ${GREEN}Save${NC} để hoàn tất"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Alternative: Check if webhook is already registered
echo -e "${YELLOW}Bước 3: Kiểm tra webhook đã được đăng ký chưa...${NC}"
echo ""
echo "Gửi một tin nhắn thử đến OA để kiểm tra:"
echo -e "  ${GREEN}https://zalo.me/433408824941888677${NC}"
echo ""
echo "Sau đó kiểm tra log:"
echo -e "  ${GREEN}ssh $VPS_HOST 'docker-compose -f $VPS_DIR/docker-compose.prod.yml logs -f fastapi | grep webhook'${NC}"
echo ""

# Test sending a message
echo -e "${YELLOW}Bước 4: Test gửi tin nhắn (optional)...${NC}"
read -p "Bạn có muốn test gửi tin nhắn không? (y/N): " TEST_SEND

if [ "$TEST_SEND" = "y" ] || [ "$TEST_SEND" = "Y" ]; then
    read -p "Nhập Zalo User ID (để trống để bỏ qua): " ZALO_USER_ID
    
    if [ ! -z "$ZALO_USER_ID" ]; then
        echo ""
        echo "Gửi tin nhắn test..."
        
        SEND_RESULT=$(curl -s -X POST "https://thuatnguyen.io.vn/api/v1/zalo/send-message" \
          -H "Content-Type: application/json" \
          -d "{
            \"user_id\": \"$ZALO_USER_ID\",
            \"message\": \"🤖 Test tin nhắn từ TradeSphere Anti-Scam! Webhook đã sẵn sàng. Gửi /help để xem hướng dẫn.\"
          }")
        
        echo "$SEND_RESULT"
        
        if echo "$SEND_RESULT" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Gửi tin nhắn thành công!${NC}"
        else
            echo -e "${RED}❌ Gửi tin nhắn thất bại${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    HOÀN TẤT!                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 LƯU Ý:${NC}"
echo "  • Webhook phải được đăng ký qua Developer Console"
echo "  • Sau khi đăng ký, tin nhắn sẽ được gửi tự động"
echo "  • Kiểm tra log để debug: docker-compose logs -f fastapi"
echo ""
