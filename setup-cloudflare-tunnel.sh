#!/bin/bash
# Setup Cloudflare Tunnel for TradeSphere Zalo Webhook
# Free, stable, fixed domain - Better than ngrok free!

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   🚀 Cloudflare Tunnel Setup - TradeSphere Zalo Webhook      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if cloudflared is installed
echo -e "${YELLOW}Step 1: Checking cloudflared installation...${NC}"
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}cloudflared not found. Installing...${NC}"
    
    # Download cloudflared
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared-linux-amd64.deb
    rm cloudflared-linux-amd64.deb
    
    echo -e "${GREEN}✓ cloudflared installed successfully${NC}"
else
    echo -e "${GREEN}✓ cloudflared already installed${NC}"
fi

# Check version
cloudflared --version
echo ""

# Step 2: Check FastAPI service
echo -e "${YELLOW}Step 2: Checking FastAPI service...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ FastAPI service is running${NC}"
else
    echo -e "${RED}✗ FastAPI service not running${NC}"
    echo "Starting services..."
    cd /media/tnt/01DBF4083BC73BB03/CODE/TradeSphere
    sudo docker-compose up -d
    echo "Waiting 10 seconds for services to start..."
    sleep 10
fi
echo ""

# Step 3: Start Cloudflare Tunnel
echo -e "${YELLOW}Step 3: Starting Cloudflare Tunnel...${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   • Tunnel will create a random subdomain: https://xxx.trycloudflare.com"
echo "   • This URL is MORE STABLE than ngrok free"
echo "   • URL may change if tunnel restarts, but less frequent"
echo "   • For permanent domain, use Cloudflare Zero Trust (free)"
echo ""

# Start cloudflared in background
echo "Starting tunnel..."
nohup cloudflared tunnel --url http://localhost:8000 > cloudflared.log 2>&1 &
TUNNEL_PID=$!

echo -e "${GREEN}✓ Cloudflare Tunnel started (PID: $TUNNEL_PID)${NC}"
echo ""

# Wait for tunnel to initialize
echo "Waiting for tunnel to initialize..."
sleep 5

# Get tunnel URL from logs
TUNNEL_URL=""
for i in {1..10}; do
    if grep -q "https://" cloudflared.log; then
        TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' cloudflared.log | head -1)
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${RED}✗ Could not get tunnel URL. Check cloudflared.log${NC}"
    tail -20 cloudflared.log
    exit 1
fi

# Display results
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ TUNNEL READY!                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Cloudflare Tunnel URL:${NC}"
echo "   $TUNNEL_URL"
echo ""
echo -e "${GREEN}📍 Webhook URL (Copy this):${NC}"
echo "   $TUNNEL_URL/api/v1/zalo/webhook"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "   1. Copy webhook URL above"
echo "   2. Open: https://developers.zalo.me/app/548847842150265811/verify-domain"
echo "   3. Add domain: ${TUNNEL_URL#https://}"
echo "   4. Verify domain (HTML file method)"
echo "   5. Configure webhook in Zalo OA"
echo ""
echo -e "${YELLOW}🔍 Monitoring:${NC}"
echo "   • View tunnel logs: tail -f cloudflared.log"
echo "   • Check traffic: cloudflared tunnel info"
echo "   • Stop tunnel: pkill cloudflared"
echo ""
echo -e "${YELLOW}⚠️  Keep this terminal open or run in background${NC}"
echo ""

# Save URL to file
echo "$TUNNEL_URL" > .cloudflare-tunnel-url
echo "$TUNNEL_URL/api/v1/zalo/webhook" > .zalo-webhook-url

echo "URLs saved to:"
echo "  - .cloudflare-tunnel-url"
echo "  - .zalo-webhook-url"
echo ""

# Test webhook
echo -e "${YELLOW}Testing webhook endpoint...${NC}"
response=$(curl -s -X POST "$TUNNEL_URL/api/v1/zalo/webhook" \
    -H "Content-Type: application/json" \
    -d '{"event_name":"user_send_text","sender":{"id":"test"},"message":{"text":"test"}}')

if echo "$response" | grep -q "ok\|processed"; then
    echo -e "${GREEN}✓ Webhook endpoint is working!${NC}"
else
    echo -e "${YELLOW}⚠ Webhook response: $response${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Setup complete! Ready to configure Zalo webhook${NC}"
echo "═══════════════════════════════════════════════════════════════"
