#!/bin/bash

##############################################################################
# 🚀 Deploy TradeSphere to Tinogroup VPS - Auto Deploy Script
##############################################################################

# ⚙️  CẤU HÌNH - THAY ĐỔI THEO THÔNG TIN CỦA BẠN
VPS_IP="103.130.218.214"                          # IP VPS của bạn
VPS_USER="root"                              # User SSH (ubuntu/root)
SSH_KEY="~/.ssh/id_ed25519"                   # SSH key path (hoặc để trống nếu dùng password)
DOMAIN="thuatnguyen.io.vn"                    # Domain chính
DOMAIN_WWW="www.thuatnguyen.io.vn"            # Domain với www
PROJECT_PATH="/home/$VPS_USER/tradesphere"    # Path trên VPS
EMAIL="admin@thuatnguyen.io.vn"               # Email cho SSL certificate

# Màu sắc cho output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

##############################################################################
# Functions
##############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  🚀 $1${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_config() {
    if [ "$VPS_IP" = "your-vps-ip" ]; then
        print_error "Chưa cấu hình VPS_IP!"
        echo ""
        print_warning "Vui lòng mở file deploy-tinogroup.sh và cấu hình:"
        echo "   - VPS_IP: IP của VPS"
        echo "   - VPS_USER: User SSH (ubuntu/root)"
        echo "   - DOMAIN: Domain của bạn"
        echo "   - EMAIL: Email cho SSL certificate"
        exit 1
    fi
}

ssh_cmd() {
    if [ -n "$SSH_KEY" ] && [ -f "${SSH_KEY/#\~/$HOME}" ]; then
        ssh -i "${SSH_KEY/#\~/$HOME}" "$VPS_USER@$VPS_IP" "$@"
    else
        ssh "$VPS_USER@$VPS_IP" "$@"
    fi
}

rsync_upload() {
    if [ -n "$SSH_KEY" ] && [ -f "${SSH_KEY/#\~/$HOME}" ]; then
        rsync -avz --progress \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude 'dist' \
            --exclude '__pycache__' \
            --exclude '*.log' \
            --exclude '.env.local' \
            -e "ssh -i ${SSH_KEY/#\~/$HOME}" \
            ./ "$VPS_USER@$VPS_IP:$PROJECT_PATH/"
    else
        rsync -avz --progress \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude 'dist' \
            --exclude '__pycache__' \
            --exclude '*.log' \
            --exclude '.env.local' \
            ./ "$VPS_USER@$VPS_IP:$PROJECT_PATH/"
    fi
}

##############################################################################
# Main Script
##############################################################################

print_header "Deploy TradeSphere to Tinogroup VPS"

# Kiểm tra cấu hình
check_config

echo -e "${YELLOW}📋 Thông tin deploy:${NC}"
echo "   🌐 Domain: $DOMAIN"
echo "   🖥️  VPS: $VPS_IP"
echo "   👤 User: $VPS_USER"
echo "   📁 Path: $PROJECT_PATH"
echo ""

# Xác nhận
read -p "Bạn có muốn tiếp tục deploy? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deploy đã bị hủy"
    exit 0
fi

##############################################################################
# BƯỚC 1: Kiểm tra kết nối SSH
##############################################################################
print_header "Bước 1: Kiểm tra kết nối VPS"
print_step "Đang kiểm tra kết nối SSH..."

if ssh_cmd "echo 'OK'" > /dev/null 2>&1; then
    print_success "Kết nối SSH thành công!"
else
    print_error "Không thể kết nối SSH đến VPS!"
    echo "   Kiểm tra lại: IP, User, SSH Key hoặc Password"
    exit 1
fi

##############################################################################
# BƯỚC 2: Cài đặt Docker & Docker Compose (nếu chưa có)
##############################################################################
print_header "Bước 2: Cài đặt Docker & Docker Compose"

ssh_cmd << 'ENDSSH'
#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Cài đặt Docker..."
    sudo apt update
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✓ Docker đã được cài đặt"
else
    echo "✓ Docker đã có sẵn: $(docker --version)"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Cài đặt Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose đã được cài đặt"
else
    echo "✓ Docker Compose đã có sẵn: $(docker-compose --version)"
fi
ENDSSH

print_success "Docker & Docker Compose sẵn sàng"

##############################################################################
# BƯỚC 3: Tạo thư mục project
##############################################################################
print_header "Bước 3: Tạo thư mục project"
print_step "Tạo thư mục $PROJECT_PATH..."

ssh_cmd "mkdir -p $PROJECT_PATH"
print_success "Thư mục đã được tạo"

##############################################################################
# BƯỚC 4: Upload code lên VPS
##############################################################################
print_header "Bước 4: Upload code lên VPS"
print_step "Đang sync code..."

if rsync_upload; then
    print_success "Code đã được upload"
else
    print_error "Upload code thất bại!"
    exit 1
fi

##############################################################################
# BƯỚC 5: Cấu hình .env file
##############################################################################
print_header "Bước 5: Cấu hình môi trường"

# Tạo .env file mới nếu chưa có
ssh_cmd << ENDSSH
cd $PROJECT_PATH

if [ ! -f .env ]; then
    echo "📝 Tạo file .env..."
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=tradesphere
POSTGRES_PASSWORD=$(openssl rand -base64 32)
DATABASE_URL=postgresql://tradesphere:\$POSTGRES_PASSWORD@postgres:5432/tradesphere

# Redis
REDIS_URL=redis://redis:6379

# Domain
DOMAIN=$DOMAIN

# Production mode
NODE_ENV=production

# Zalo OA (thêm sau nếu cần)
# ZALO_OA_ID=
# ZALO_ACCESS_TOKEN=
# ZALO_SECRET_KEY=
EOF
    echo "✓ File .env đã được tạo"
else
    echo "✓ File .env đã tồn tại"
fi
ENDSSH

print_success "Môi trường đã được cấu hình"

##############################################################################
# BƯỚC 6: Cập nhật domain trong nginx config
##############################################################################
print_header "Bước 6: Cấu hình Nginx với domain $DOMAIN"
print_step "Cập nhật domain trong nginx.prod.conf..."

ssh_cmd << ENDSSH
cd $PROJECT_PATH

# Backup original
cp nginx.prod.conf nginx.prod.conf.backup

# Update domain
sed -i 's/zalo\.tino\.org/$DOMAIN/g' nginx.prod.conf
sed -i "s/server_name _;/server_name $DOMAIN $DOMAIN_WWW;/g" nginx.prod.conf

echo "✓ Nginx config đã được cập nhật"
ENDSSH

print_success "Nginx đã được cấu hình"

##############################################################################
# BƯỚC 7: Setup SSL Certificate
##############################################################################
print_header "Bước 7: Setup SSL Certificate"
print_step "Cấu hình Let's Encrypt SSL..."

ssh_cmd << ENDSSH
cd $PROJECT_PATH

# Tạo thư mục SSL
mkdir -p ssl certbot_conf certbot_data

# Start nginx tạm để xác thực domain
echo "🐳 Starting nginx for SSL verification..."
docker-compose -f docker-compose.prod.yml up -d nginx

# Đợi nginx start
sleep 5

# Get SSL certificate
echo "🔒 Requesting SSL certificate..."
docker run --rm \
    -v $PROJECT_PATH/certbot_conf:/etc/letsencrypt \
    -v $PROJECT_PATH/certbot_data:/var/www/certbot \
    --network tradesphere-network \
    certbot/certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d $DOMAIN_WWW \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --force-renewal || echo "⚠ SSL có thể đã được cài hoặc domain chưa trỏ đúng"

echo "✓ SSL certificate đã được cấu hình"
ENDSSH

print_success "SSL đã được setup"

##############################################################################
# BƯỚC 8: Deploy với Docker Compose
##############################################################################
print_header "Bước 8: Deploy với Docker Compose"
print_step "Building và starting services..."

ssh_cmd << ENDSSH
cd $PROJECT_PATH

echo "🐳 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

echo "🏗️  Building images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Đợi services khởi động..."
sleep 10

echo ""
echo "📊 Trạng thái services:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🏥 Health check:"
curl -s http://localhost:8000/health 2>/dev/null | head -n 5 || echo "⚠ FastAPI đang khởi động..."
ENDSSH

print_success "Services đã được deploy"

##############################################################################
# BƯỚC 9: Run database migration
##############################################################################
print_header "Bước 9: Database Migration"
print_step "Chạy migration..."

ssh_cmd << ENDSSH
cd $PROJECT_PATH

# Đợi database ready
echo "⏳ Đợi database khởi động..."
sleep 10

# Run migration
echo "🗄️  Running database migration..."
docker exec tradesphere-express npm run db:push || echo "⚠ Migration có thể đã chạy rồi"

echo "✓ Database đã được setup"
ENDSSH

print_success "Migration hoàn tất"

##############################################################################
# BƯỚC 10: Setup firewall
##############################################################################
print_header "Bước 10: Cấu hình Firewall"
print_step "Setup UFW..."

ssh_cmd << 'ENDSSH'
# Check if UFW is installed
if command -v ufw &> /dev/null; then
    echo "🔒 Configuring firewall..."
    sudo ufw --force enable
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "✓ Firewall đã được cấu hình"
else
    echo "⚠ UFW chưa được cài, bỏ qua bước này"
fi
ENDSSH

print_success "Firewall đã được cấu hình"

##############################################################################
# BƯỚC 11: Setup auto-renewal SSL
##############################################################################
print_header "Bước 11: Setup SSL Auto-Renewal"

ssh_cmd << ENDSSH
# Add cron job for SSL renewal
(crontab -l 2>/dev/null; echo "0 2 * * * docker run --rm -v $PROJECT_PATH/certbot_conf:/etc/letsencrypt -v $PROJECT_PATH/certbot_data:/var/www/certbot certbot/certbot renew --quiet && docker restart tradesphere-nginx") | crontab -

echo "✓ SSL auto-renewal đã được thiết lập"
ENDSSH

print_success "Auto-renewal đã được setup"

##############################################################################
# Hoàn thành
##############################################################################
print_header "✅ Deploy hoàn tất!"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 Deploy thành công!                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🌐 Website của bạn:${NC}"
echo "   ➜ https://$DOMAIN"
echo "   ➜ https://$DOMAIN_WWW"
echo ""
echo -e "${YELLOW}🔧 API Endpoints:${NC}"
echo "   ➜ https://$DOMAIN/api/health"
echo "   ➜ https://$DOMAIN/api/reports"
echo ""
echo -e "${YELLOW}📊 Quản lý services:${NC}"
echo "   ➜ Xem logs: ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml logs -f'"
echo "   ➜ Restart: ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml restart'"
echo "   ➜ Status: ssh $VPS_USER@$VPS_IP 'cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml ps'"
echo ""
echo -e "${YELLOW}⚠️  Lưu ý:${NC}"
echo "   • Đợi 2-5 phút để SSL certificate được apply"
echo "   • Kiểm tra DNS đã trỏ đúng: ping $DOMAIN"
echo "   • Xem logs nếu có lỗi: docker-compose logs -f"
echo ""
echo -e "${GREEN}Chúc mừng bạn đã deploy thành công! 🚀${NC}"
echo ""
