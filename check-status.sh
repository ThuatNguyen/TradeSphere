#!/bin/bash

##############################################################################
# 🔍 Check Status - Kiểm tra trạng thái deploy trên VPS
##############################################################################

# Cấu hình
VPS_IP="${1:-103.130.218.214}"
VPS_USER="${2:-ubuntu}"
SSH_KEY="~/.ssh/id_ed25519"
PROJECT_PATH="/home/$VPS_USER/tradesphere"

# Màu sắc
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

ssh_cmd() {
    if [ -n "$SSH_KEY" ] && [ -f "${SSH_KEY/#\~/$HOME}" ]; then
        ssh -i "${SSH_KEY/#\~/$HOME}" "$VPS_USER@$VPS_IP" "$@"
    else
        ssh "$VPS_USER@$VPS_IP" "$@"
    fi
}

if [ "$VPS_IP" = "your-vps-ip" ]; then
    echo -e "${RED}❌ Chưa cấu hình VPS_IP!${NC}"
    echo ""
    echo "Cách sử dụng:"
    echo "  $0 <vps-ip> [user]"
    echo ""
    echo "Ví dụ:"
    echo "  $0 123.456.789.0"
    echo "  $0 123.456.789.0 ubuntu"
    exit 1
fi

print_header "🔍 Checking VPS Status: $VPS_IP"

##############################################################################
# 1. Check SSH Connection
##############################################################################
echo -e "${YELLOW}1. Kiểm tra kết nối SSH...${NC}"
if ssh_cmd "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ SSH connected${NC}"
else
    echo -e "${RED}   ✗ Cannot connect via SSH${NC}"
    exit 1
fi

##############################################################################
# 2. Check Docker
##############################################################################
echo ""
echo -e "${YELLOW}2. Kiểm tra Docker...${NC}"
ssh_cmd << 'ENDSSH'
if command -v docker &> /dev/null; then
    echo -e "   ✓ Docker: $(docker --version)"
    if command -v docker-compose &> /dev/null; then
        echo -e "   ✓ Docker Compose: $(docker-compose --version)"
    else
        echo -e "   ✗ Docker Compose: Not installed"
    fi
else
    echo -e "   ✗ Docker: Not installed"
fi
ENDSSH

##############################################################################
# 3. Check Project Directory
##############################################################################
echo ""
echo -e "${YELLOW}3. Kiểm tra thư mục project...${NC}"
ssh_cmd << ENDSSH
if [ -d "$PROJECT_PATH" ]; then
    echo "   ✓ Project directory exists: $PROJECT_PATH"
    echo "   Files: \$(ls -1 $PROJECT_PATH | wc -l) items"
else
    echo "   ✗ Project directory not found: $PROJECT_PATH"
fi
ENDSSH

##############################################################################
# 4. Check Docker Containers
##############################################################################
echo ""
echo -e "${YELLOW}4. Kiểm tra Docker Containers...${NC}"
ssh_cmd << ENDSSH
cd $PROJECT_PATH 2>/dev/null || exit 1
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml ps
else
    echo "   ✗ docker-compose.prod.yml not found"
fi
ENDSSH

##############################################################################
# 5. Check Services Health
##############################################################################
echo ""
echo -e "${YELLOW}5. Kiểm tra Health của Services...${NC}"
ssh_cmd << 'ENDSSH'
echo "   • Nginx:"
if docker ps | grep -q tradesphere-nginx; then
    echo "     ✓ Running"
else
    echo "     ✗ Not running"
fi

echo "   • Express:"
if docker ps | grep -q tradesphere-express; then
    echo "     ✓ Running"
else
    echo "     ✗ Not running"
fi

echo "   • FastAPI:"
if docker ps | grep -q tradesphere-fastapi; then
    echo "     ✓ Running"
    echo -n "     Health: "
    curl -s http://localhost:8000/health 2>/dev/null | head -n 1 || echo "No response"
else
    echo "     ✗ Not running"
fi

echo "   • PostgreSQL:"
if docker ps | grep -q tradesphere-postgres; then
    echo "     ✓ Running"
else
    echo "     ✗ Not running"
fi

echo "   • Redis:"
if docker ps | grep -q tradesphere-redis; then
    echo "     ✓ Running"
else
    echo "     ✗ Not running"
fi
ENDSSH

##############################################################################
# 6. Check Ports
##############################################################################
echo ""
echo -e "${YELLOW}6. Kiểm tra Ports...${NC}"
ssh_cmd << 'ENDSSH'
if command -v netstat &> /dev/null; then
    echo "   Listening ports:"
    sudo netstat -tulpn | grep -E ':(80|443|8000|5432|6379) ' | awk '{print "     " $4 " -> " $7}'
else
    echo "   ⚠ netstat not available"
fi
ENDSSH

##############################################################################
# 7. Check SSL Certificate
##############################################################################
echo ""
echo -e "${YELLOW}7. Kiểm tra SSL Certificate...${NC}"
ssh_cmd << ENDSSH
cd $PROJECT_PATH 2>/dev/null || exit 1
if [ -d "certbot_conf/live" ]; then
    echo "   ✓ SSL certificates found:"
    ls -1 certbot_conf/live/ 2>/dev/null | sed 's/^/     /'
else
    echo "   ✗ No SSL certificates found"
fi
ENDSSH

##############################################################################
# 8. Check Disk Space
##############################################################################
echo ""
echo -e "${YELLOW}8. Kiểm tra Disk Space...${NC}"
ssh_cmd << 'ENDSSH'
df -h / | awk 'NR==1{print "   " $0} NR==2{
    if (substr($5, 1, length($5)-1) > 80) 
        print "   ⚠ " $0 " - HIGH USAGE!"
    else 
        print "   ✓ " $0
}'
ENDSSH

##############################################################################
# 9. Check Memory
##############################################################################
echo ""
echo -e "${YELLOW}9. Kiểm tra Memory...${NC}"
ssh_cmd << 'ENDSSH'
free -h | awk 'NR==1{print "   " $0} NR==2{
    used_pct = ($3/$2)*100
    if (used_pct > 80)
        print "   ⚠ " $0 " - HIGH USAGE!"
    else
        print "   ✓ " $0
}'
ENDSSH

##############################################################################
# 10. Check Recent Logs
##############################################################################
echo ""
echo -e "${YELLOW}10. Kiểm tra Recent Logs (last 5 lines)...${NC}"
ssh_cmd << ENDSSH
cd $PROJECT_PATH 2>/dev/null || exit 1
if [ -f "docker-compose.prod.yml" ]; then
    echo "   Nginx:"
    docker logs tradesphere-nginx 2>&1 | tail -n 3 | sed 's/^/     /'
    echo ""
    echo "   Express:"
    docker logs tradesphere-express 2>&1 | tail -n 3 | sed 's/^/     /'
    echo ""
    echo "   FastAPI:"
    docker logs tradesphere-fastapi 2>&1 | tail -n 3 | sed 's/^/     /'
fi
ENDSSH

##############################################################################
# 11. Check Firewall
##############################################################################
echo ""
echo -e "${YELLOW}11. Kiểm tra Firewall...${NC}"
ssh_cmd << 'ENDSSH'
if command -v ufw &> /dev/null; then
    sudo ufw status | head -n 10 | sed 's/^/   /'
else
    echo "   ⚠ UFW not installed"
fi
ENDSSH

##############################################################################
# Summary
##############################################################################
echo ""
print_header "✅ Check Complete!"

echo -e "${GREEN}Để xem logs chi tiết:${NC}"
echo "  ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml logs -f'"
echo ""
echo -e "${GREEN}Để restart services:${NC}"
echo "  ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml restart'"
echo ""
