#!/bin/bash
# Setup Ngrok Tunnel for Zalo OA Webhook

echo "🚀 Starting Ngrok tunnel for TradeSphere Zalo OA..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed!"
    echo ""
    echo "Install with:"
    echo "  sudo snap install ngrok"
    echo "  # OR"
    echo "  wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
    echo "  tar xvzf ngrok-v3-stable-linux-amd64.tgz"
    echo "  sudo mv ngrok /usr/local/bin/"
    exit 1
fi

# Check if FastAPI is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ FastAPI service is not running!"
    echo ""
    echo "Start with:"
    echo "  cd /media/tnt/01DBF4083BC73BB03/CODE/TradeSphere"
    echo "  sudo docker-compose up -d"
    exit 1
fi

echo "✅ FastAPI service is running"
echo ""

# Start ngrok
echo "📡 Starting ngrok tunnel on port 8000..."
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "  - Keep this terminal open"
echo "  - Copy the HTTPS URL (https://xxx.ngrok.io)"
echo "  - Use it to configure Zalo webhook"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "─────────────────────────────────────────────"

ngrok http 8000
