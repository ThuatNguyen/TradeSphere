#!/bin/bash

##############################################################################
# 🚀 Deploy TradeSphere to AWS VPS - Quick Update Script
##############################################################################

# Cấu hình - THAY ĐỔI THEO THÔNG TIN CỦA BẠN
AWS_HOST="your-vps-ip-or-hostname"           # IP hoặc hostname AWS VPS
AWS_USER="ubuntu"                              # User SSH (ubuntu/ec2-user)
SSH_KEY="~/.ssh/your-key.pem"                 # SSH key path
DOMAIN="zalo.tino.org"                        # Domain/subdomain của bạn
PROJECT_PATH="/home/ubuntu/tradesphere"       # Path trên VPS

# Màu sắc
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 Deploy TradeSphere to AWS VPS                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Kiểm tra cấu hình
if [ "$AWS_HOST" = "your-vps-ip-or-hostname" ]; then
    echo -e "${RED}❌ Chưa cấu hình AWS_HOST!${NC}"
    echo -e "${YELLOW}📝 Mở file deploy-to-aws.sh và sửa các biến:${NC}"
    echo "   - AWS_HOST: IP hoặc hostname VPS AWS"
    echo "   - SSH_KEY: Đường dẫn đến SSH key"
    echo "   - DOMAIN: Domain của bạn (ví dụ: zalo.tino.org)"
    exit 1
fi

# Kiểm tra SSH key
if [ ! -f "${SSH_KEY/#\~/$HOME}" ]; then
    echo -e "${RED}❌ SSH key không tồn tại: $SSH_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cấu hình hợp lệ${NC}"
echo -e "   🌐 Domain: ${YELLOW}$DOMAIN${NC}"
echo -e "   🖥️  VPS: ${YELLOW}$AWS_HOST${NC}"
echo ""

# 1. Sync code lên VPS
echo -e "${BLUE}📦 Bước 1: Sync code lên VPS...${NC}"
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '__pycache__' \
    --exclude '*.log' \
    -e "ssh -i ${SSH_KEY/#\~/$HOME}" \
    ./ "$AWS_USER@$AWS_HOST:$PROJECT_PATH/"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Sync code thất bại!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sync code thành công${NC}"
echo ""

# 2. Deploy trên VPS
echo -e "${BLUE}🔧 Bước 2: Deploy trên VPS...${NC}"
ssh -i "${SSH_KEY/#\~/$HOME}" "$AWS_USER@$AWS_HOST" << 'ENDSSH'
cd /home/ubuntu/tradesphere

# Pull latest images và rebuild
echo "🐳 Rebuilding Docker containers..."
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Kiểm tra services
echo ""
echo "✅ Checking services..."
sudo docker-compose ps

# Health check
echo ""
echo "🏥 Health check..."
sleep 5
curl -s http://localhost:8000/health | jq . || echo "FastAPI not ready yet"

echo ""
echo "✅ Deploy hoàn tất!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deploy thất bại!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅ Deploy thành công!                                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "🌐 Webhook URL: ${YELLOW}https://$DOMAIN/api/v1/zalo/webhook${NC}"
echo -e "📊 API Docs: ${YELLOW}https://$DOMAIN/docs${NC}"
echo -e "🔍 Health: ${YELLOW}https://$DOMAIN/health${NC}"
echo ""
echo -e "${BLUE}📝 Kiểm tra logs:${NC}"
echo "   ssh -i $SSH_KEY $AWS_USER@$AWS_HOST 'cd $PROJECT_PATH && sudo docker-compose logs -f'"
echo ""
