#!/bin/bash
# Script tự động refresh Zalo token và restart Docker container
# Chạy mỗi 24 giờ bằng cron job

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/root/tradesphere"
ENV_FILE="$PROJECT_ROOT/.env"
REFRESH_TOKEN_FILE="$PROJECT_ROOT/.zalo_refresh_token"

echo "[$(date)] Starting Zalo token refresh..."

# Đọc refresh token từ file
if [ ! -f "$REFRESH_TOKEN_FILE" ]; then
    echo "❌ Error: $REFRESH_TOKEN_FILE not found!"
    exit 1
fi

REFRESH_TOKEN=$(cat "$REFRESH_TOKEN_FILE")

# Refresh token
RESPONSE=$(curl -s -X POST "https://oauth.zaloapp.com/v4/oa/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "secret_key: 33M7kiqYXVXljIHS6vp7" \
  -d "app_id=548847842150265811" \
  -d "refresh_token=${REFRESH_TOKEN}" \
  -d "grant_type=refresh_token")

# Parse response
NEW_ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
NEW_REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty')

if [ -z "$NEW_ACCESS_TOKEN" ]; then
    echo "❌ Failed to refresh token!"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Token refreshed successfully!"

# Update .env file
sed -i "s/^ZALO_ACCESS_TOKEN=.*/ZALO_ACCESS_TOKEN=${NEW_ACCESS_TOKEN}/" "$ENV_FILE"

# Save new refresh token
echo "$NEW_REFRESH_TOKEN" > "$REFRESH_TOKEN_FILE"

# Restart FastAPI container
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.prod.yml restart fastapi

echo "[$(date)] Zalo token refresh completed!"
echo "New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
echo "Container restarted."
