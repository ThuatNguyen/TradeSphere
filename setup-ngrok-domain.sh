#!/bin/bash
# Quick Setup với Domain Ngrok Cố định

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║      🚀 Setup Ngrok với Domain Cố Định                            ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

DOMAIN="gopher-internal-personally.ngrok-free.app"

echo "📍 Domain của bạn: $DOMAIN"
echo ""

# Step 1: Kill all ngrok sessions
echo "🔧 Bước 1: Dừng tất cả ngrok sessions..."
pkill -9 ngrok 2>/dev/null
sleep 2
echo "✅ Done"
echo ""

# Step 2: Check if there are active sessions on dashboard
echo "⚠️  Bước 2: Kiểm tra sessions trên dashboard"
echo ""
echo "   Nếu vẫn báo lỗi 'ERR_NGROK_108', làm theo:"
echo ""
echo "   1. Mở: https://dashboard.ngrok.com/agents"
echo "   2. Xem 'Active Sessions'"
echo "   3. Click 'Stop' trên tất cả sessions cũ"
echo "   4. Chạy lại script này"
echo ""
read -p "   Đã stop sessions chưa? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Hãy stop sessions và chạy lại!"
    exit 1
fi

# Step 3: Start ngrok with fixed domain
echo "🚀 Bước 3: Khởi động ngrok với domain cố định..."
echo ""

ngrok http 8000 --domain=$DOMAIN > /dev/null 2>&1 &
NGROK_PID=$!

echo "   Process ID: $NGROK_PID"
echo "   Đang kết nối..."
sleep 5

# Step 4: Verify connection
echo ""
echo "✅ Bước 4: Verify kết nối..."

PUBLIC_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ "$PUBLIC_URL" != "null" ] && [ ! -z "$PUBLIC_URL" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ THÀNH CÔNG!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📍 Public URL: $PUBLIC_URL"
    echo ""
    echo "📍 Webhook URL (COPY CÁI NÀY):"
    echo "┌─────────────────────────────────────────────────────────────────┐"
    echo "│  $PUBLIC_URL/api/v1/zalo/webhook"
    echo "└─────────────────────────────────────────────────────────────────┘"
    echo ""
    echo "🔍 Ngrok Dashboard: http://127.0.0.1:4040"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 BƯỚC TIẾP THEO:"
    echo ""
    echo "1. Mở: https://developers.zalo.me/app/548847842150265811/verify-domain"
    echo ""
    echo "2. Verify domain (nếu chưa):"
    echo "   - Domain: $DOMAIN"
    echo "   - Method: HTML file hoặc DNS"
    echo ""
    echo "3. Config webhook:"
    echo "   - Vào: https://oa.zalo.me/"
    echo "   - Settings → Webhook"
    echo "   - URL: $PUBLIC_URL/api/v1/zalo/webhook"
    echo "   - Click Verify → Save"
    echo ""
    echo "4. Test trên điện thoại:"
    echo "   - Mở Zalo"
    echo "   - Tìm & Follow OA"
    echo "   - Gửi: 0949654358"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Tips:"
    echo "   - Domain này CỐ ĐỊNH, không đổi khi restart"
    echo "   - Chỉ cần verify domain 1 lần duy nhất"
    echo "   - Ngrok sẽ chạy ở background"
    echo "   - Stop: pkill ngrok"
    echo ""
    
    # Save to file for easy access
    echo "$PUBLIC_URL/api/v1/zalo/webhook" > .webhook_url
    echo "✅ Webhook URL đã lưu vào: .webhook_url"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ LỖI: Không thể kết nối ngrok"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Nguyên nhân có thể:"
    echo "1. Còn session khác đang chạy"
    echo "   → Check: https://dashboard.ngrok.com/agents"
    echo "   → Stop all sessions"
    echo ""
    echo "2. Domain không hợp lệ"
    echo "   → Check: https://dashboard.ngrok.com/cloud-edge/domains"
    echo "   → Verify domain: $DOMAIN"
    echo ""
    echo "3. FastAPI không chạy"
    echo "   → Check: curl http://localhost:8000/health"
    echo "   → Start: docker-compose up -d"
    echo ""
    
    # Show logs
    echo "📋 Ngrok logs:"
    tail -10 ngrok.log 2>/dev/null
    echo ""
fi
