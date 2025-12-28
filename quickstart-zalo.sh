#!/bin/bash
# Quick Start Guide - Zalo OA Integration

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         TradeSphere - Zalo OA Quick Start Guide               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check services
echo "📋 Step 1: Checking services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ FastAPI service is running"
else
    echo "❌ FastAPI service not running"
    echo "   Run: docker-compose up -d"
    exit 1
fi

if docker-compose exec postgres psql -U tradesphere -d tradesphere -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ PostgreSQL is connected"
else
    echo "⚠️  PostgreSQL connection issue"
fi

if command -v ngrok &> /dev/null; then
    echo "✅ Ngrok is installed"
else
    echo "❌ Ngrok not found"
    echo "   Install: sudo snap install ngrok"
    exit 1
fi

echo ""

# Step 2: Environment check
echo "🔧 Step 2: Environment configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "ZALO_OA_ID" .env && ! grep -q "ZALO_OA_ID=$" .env && ! grep -q "ZALO_OA_ID= $" .env; then
    echo "✅ Zalo OA ID configured"
else
    echo "⚠️  Zalo OA ID not configured"
    echo "   Edit .env and add: ZALO_OA_ID=your_oa_id"
fi

if grep -q "ZALO_ACCESS_TOKEN" .env && ! grep -q "ZALO_ACCESS_TOKEN=$" .env && ! grep -q "ZALO_ACCESS_TOKEN= $" .env; then
    echo "✅ Zalo Access Token configured"
else
    echo "⚠️  Zalo Access Token not configured"
    echo "   Edit .env and add: ZALO_ACCESS_TOKEN=your_token"
fi

echo ""

# Step 3: Quick test
echo "🧪 Step 3: Quick functionality test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Testing webhook endpoint..."
response=$(curl -s -X POST http://localhost:8000/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_name":"user_send_text","sender":{"id":"test"},"message":{"text":"test"}}')

if echo "$response" | grep -q "ok\|processed"; then
    echo "✅ Webhook endpoint working"
else
    echo "⚠️  Webhook response: $response"
fi

echo ""

# Step 4: Database stats
echo "📊 Step 4: Database statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

stats=$(docker-compose exec -T postgres psql -U tradesphere -d tradesphere -t -c "
SELECT 
  (SELECT COUNT(*) FROM zalo_users) as users,
  (SELECT COUNT(*) FROM zalo_messages) as messages,
  (SELECT COUNT(*) FROM scam_searches) as searches
" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "$stats" | while read line; do
        if [ -n "$line" ]; then
            echo "📈 Database stats: $line"
        fi
    done
else
    echo "⚠️  Could not fetch database stats"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Instructions
cat << 'EOF'
🚀 Ready to start! Follow these steps:

┌─ OPTION 1: Auto Start Ngrok ─────────────────────────────────┐
│                                                                │
│  ./start-ngrok.sh                                             │
│                                                                │
│  This will:                                                    │
│  ✓ Start ngrok tunnel on port 8000                           │
│  ✓ Display the HTTPS URL                                      │
│  ✓ Keep running until you press Ctrl+C                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ OPTION 2: Manual Setup ──────────────────────────────────────┐
│                                                                │
│  1. Start ngrok:                                              │
│     ngrok http 8000                                           │
│                                                                │
│  2. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)       │
│                                                                │
│  3. Configure webhook in Zalo OA Dashboard:                   │
│     https://oa.zalo.me/                                       │
│     → Settings → Webhook                                      │
│     → Add: https://YOUR_URL/api/v1/zalo/webhook              │
│                                                                │
│  4. Test with Zalo app on phone:                             │
│     → Open Zalo                                               │
│     → Search & Follow your OA                                 │
│     → Send: 0949654358                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

📚 Documentation:
  - Detailed guide: SETUP_NGROK_WEBHOOK.md
  - Integration guide: ZALO_INTEGRATION_GUIDE.md
  - API docs: http://localhost:8000/docs

🔍 Monitoring:
  - Ngrok dashboard: http://127.0.0.1:4040 (after starting ngrok)
  - FastAPI logs: docker-compose logs -f fastapi
  - Database: docker-compose exec postgres psql -U tradesphere

💡 Test scripts:
  - ./test-zalo.sh          # Comprehensive test suite
  - python3 demo-zalo.py    # Python demo script

Need help? Check the troubleshooting section in docs!

EOF

echo "════════════════════════════════════════════════════════════════"
echo ""

# Prompt to start ngrok
read -p "🚀 Start ngrok now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting ngrok... Press Ctrl+C to stop"
    echo ""
    sleep 2
    ./start-ngrok.sh
else
    echo ""
    echo "👍 No problem! Run './start-ngrok.sh' when ready."
    echo ""
fi
