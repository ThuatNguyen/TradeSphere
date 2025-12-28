#!/bin/bash

# Script tự động lấy và setup Zalo tokens
# Sử dụng: bash setup-zalo-tokens.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Zalo OAuth config
APP_ID="548847842150265811"
SECRET_KEY="33M7kiqYXVXljIHS6vp7"
REDIRECT_URI="https://thuatnguyen.io.vn/api/v1/zalo/oauth/callback"

# VPS config
VPS_HOST="root@103.130.218.214"
VPS_DIR="/home/root/tradesphere"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       SETUP ZALO OA ACCESS TOKEN TỰ ĐỘNG                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Generate PKCE
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -binary -sha256 | openssl base64 | tr -d "=+/" | cut -c1-43)

# Save code_verifier for later use
echo "$CODE_VERIFIER" > /tmp/zalo_code_verifier.txt

# Step 1: Generate OAuth URL
AUTH_URL="https://oauth.zaloapp.com/v4/oa/permission?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&code_challenge=${CODE_CHALLENGE}"

echo -e "${YELLOW}Bước 1: Lấy Authorization Code${NC}"
echo ""
echo -e "Mở link này trong browser:"
echo -e "${GREEN}${AUTH_URL}${NC}"
echo ""
echo -e "Sau khi đăng nhập và cấp quyền, bạn sẽ được redirect về:"
echo -e "https://thuatnguyen.io.vn/api/v1/zalo/oauth/callback?code=XXXXX"
echo ""
echo -e "${YELLOW}Copy mã CODE từ URL (sau ?code=) và paste vào đây:${NC}"
read -p "Authorization Code: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
    echo -e "${RED}❌ Lỗi: Authorization code không được để trống!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Bước 2: Exchange code for tokens...${NC}"

# Step 2: Exchange authorization code for tokens
RESPONSE=$(curl -s -X POST "https://oauth.zaloapp.com/v4/oa/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "secret_key: ${SECRET_KEY}" \
  -d "app_id=${APP_ID}" \
  -d "grant_type=authorization_code" \
  -d "code=${AUTH_CODE}" \
  -d "code_verifier=${CODE_VERIFIER}")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}❌ Lỗi khi lấy token:${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

# Extract tokens
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Không lấy được access_token!${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Lấy tokens thành công!${NC}"
echo ""
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
echo "Expires in: ${EXPIRES_IN} seconds (~24 hours)"
echo ""

# Step 3: Update .env on VPS
echo -e "${YELLOW}Bước 3: Cập nhật .env trên VPS...${NC}"

ssh $VPS_HOST "cd $VPS_DIR && \
  sed -i 's/^ZALO_ACCESS_TOKEN=.*/ZALO_ACCESS_TOKEN=${ACCESS_TOKEN}/' .env && \
  echo 'Updated ZALO_ACCESS_TOKEN in .env'"

echo -e "${GREEN}✅ Đã cập nhật .env${NC}"

# Step 4: Save refresh token
echo -e "${YELLOW}Bước 4: Lưu refresh token...${NC}"

ssh $VPS_HOST "echo '${REFRESH_TOKEN}' > $VPS_DIR/.zalo_refresh_token && \
  chmod 600 $VPS_DIR/.zalo_refresh_token"

echo -e "${GREEN}✅ Đã lưu refresh token${NC}"

# Step 5: Setup cron job
echo -e "${YELLOW}Bước 5: Setup cron job cho auto-refresh...${NC}"

ssh $VPS_HOST "chmod +x $VPS_DIR/refresh_zalo_token_cron.sh && \
  (crontab -l 2>/dev/null | grep -v 'refresh_zalo_token_cron.sh'; \
   echo '0 */23 * * * $VPS_DIR/refresh_zalo_token_cron.sh >> /var/log/zalo_refresh.log 2>&1') | crontab -"

echo -e "${GREEN}✅ Đã setup cron job (chạy mỗi 23h)${NC}"

# Step 6: Restart FastAPI service
echo -e "${YELLOW}Bước 6: Restart FastAPI container...${NC}"

ssh $VPS_HOST "cd $VPS_DIR && docker-compose -f docker-compose.prod.yml restart fastapi"

echo -e "${GREEN}✅ Đã restart FastAPI${NC}"

# Step 7: Test token
echo ""
echo -e "${YELLOW}Bước 7: Test token...${NC}"

TEST_RESPONSE=$(ssh $VPS_HOST "curl -s 'https://openapi.zalo.me/v2.0/oa/getoa' \
  -H 'access_token: ${ACCESS_TOKEN}'")

if echo "$TEST_RESPONSE" | grep -q '"error"'; then
    echo -e "${RED}❌ Token test failed:${NC}"
    echo "$TEST_RESPONSE" | jq '.'
else
    echo -e "${GREEN}✅ Token hoạt động tốt!${NC}"
    echo ""
    OA_NAME=$(echo "$TEST_RESPONSE" | jq -r '.data.name')
    OA_ID=$(echo "$TEST_RESPONSE" | jq -r '.data.oa_id')
    echo "OA Name: $OA_NAME"
    echo "OA ID: $OA_ID"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    HOÀN THÀNH!                                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Token sẽ tự động refresh mỗi 23 giờ qua cron job"
echo "Log file: /var/log/zalo_refresh.log"
echo ""
echo "Để xem cron job hiện tại:"
echo "  ssh $VPS_HOST 'crontab -l'"
echo ""
echo "Để xem log refresh:"
echo "  ssh $VPS_HOST 'tail -f /var/log/zalo_refresh.log'"

# Clean up
rm -f /tmp/zalo_code_verifier.txt
