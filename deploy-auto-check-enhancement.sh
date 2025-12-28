#!/bin/bash

# deploy-auto-check-enhancement.sh
# Deployment script for Zalo auto-check enhancement feature

set -e

echo "=========================================="
echo "Deploying Auto-Check Enhancement to VPS"
echo "=========================================="
echo ""

# VPS Configuration
VPS_USER="root"
VPS_HOST="103.130.218.214"
VPS_PROJECT_DIR="/root/tradesphere"

echo "📦 Step 1: Upload modified file..."
scp fastapi-service/app/api/v1/endpoints/zalo.py \
    ${VPS_USER}@${VPS_HOST}:${VPS_PROJECT_DIR}/fastapi-service/app/api/v1/endpoints/

echo ""
echo "🔄 Step 2: Restart FastAPI service..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${VPS_PROJECT_DIR} && docker-compose restart fastapi"

echo ""
echo "⏳ Step 3: Wait for service to start..."
sleep 5

echo ""
echo "🧪 Step 4: Test webhook endpoint..."
ssh ${VPS_USER}@${VPS_HOST} "curl -s https://thuatnguyen.io.vn/api/v1/zalo/webhook | jq"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "=========================================="
echo "Testing Instructions:"
echo "=========================================="
echo "Send these test messages to Zalo OA:"
echo ""
echo "1. Phone number test:"
echo "   0123456789"
echo ""
echo "2. Bank account test:"
echo "   1234567890"
echo ""
echo "3. URL test:"
echo "   https://example.com"
echo "   www.example.com"
echo "   example.com"
echo ""
echo "4. Help command:"
echo "   /help"
echo ""
echo "Expected: Bot will auto-check and return results with checkscam link"
echo "=========================================="
