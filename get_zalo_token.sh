#!/bin/bash

APP_ID="548847842150265811"
SECRET_KEY="33M7kiqYXVXljIHS6vp7"
REDIRECT_URI="https://thuatnguyen.io.vn/api/v1/zalo/oauth/callback"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        HƯỚNG DẪN LẤY ZALO ACCESS TOKEN LẦN ĐẦU          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Generate PKCE values
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -binary -sha256 | base64 | tr -d "=+/" | tr "/+" "_-")

echo "✅ Đã tạo PKCE values"
echo ""

# Build authorization URL
AUTH_URL="https://oauth.zaloapp.com/v4/oa/permission?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&code_challenge=${CODE_CHALLENGE}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BƯỚC 1: Copy link này và mở trong trình duyệt:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$AUTH_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BƯỚC 2: Sau khi đăng nhập và cấp quyền:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "- Zalo sẽ chuyển hướng đến:"
echo "  https://thuatnguyen.io.vn/api/v1/zalo/oauth/callback?code=XXXXXXXXX"
echo ""
echo "- Trang web sẽ báo lỗi 404 (bình thường)"
echo "- Copy TOÀN BỘ phần XXXXXXXXX sau 'code=' trong URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Nhập authorization code (phần sau ?code=): " AUTH_CODE
echo ""

if [ -z "$AUTH_CODE" ]; then
    echo "❌ Authorization code không được để trống!"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BƯỚC 3: Đang lấy Access Token..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -X POST "https://oauth.zaloapp.com/v4/oa/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "secret_key: ${SECRET_KEY}" \
  -d "app_id=${APP_ID}" \
  -d "code=${AUTH_CODE}" \
  -d "grant_type=authorization_code" \
  -d "code_verifier=${CODE_VERIFIER}")

echo "Response từ Zalo:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract tokens
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty' 2>/dev/null)

if [ ! -z "$ACCESS_TOKEN" ]; then
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                   ✅ THÀNH CÔNG!                         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Access Token:"
    echo "$ACCESS_TOKEN"
    echo ""
    echo "Refresh Token (LƯU LẠI để refresh sau 24h):"
    echo "$REFRESH_TOKEN"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Cập nhật vào .env:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ZALO_ACCESS_TOKEN=$ACCESS_TOKEN"
    echo "ZALO_SECRET_KEY=$SECRET_KEY"
    echo ""
    echo "Lưu refresh token vào file riêng:"
    echo "echo '$REFRESH_TOKEN' > .zalo_refresh_token"
else
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                    ❌ LỖI                                ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Kiểm tra lại:"
    echo "1. Authorization code có đúng không?"
    echo "2. Code đã được dùng rồi? (chỉ dùng được 1 lần)"
    echo "3. Thử lại từ đầu nếu code hết hạn"
fi
