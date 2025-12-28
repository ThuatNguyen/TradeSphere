# 🚀 Hướng Dẫn Deploy TradeSphere lên VPS với Tên Miền Tinogroup

## 📋 Yêu Cầu
- ✅ VPS đã cài đặt Ubuntu 20.04+ hoặc Debian
- ✅ Tên miền tinogroup đã trỏ về IP VPS
- ✅ SSH access vào VPS
- ✅ Docker và Docker Compose sẽ được cài trong quá trình setup

---

## 🎯 Bước 1: Chuẩn Bị VPS

### 1.1. Kết nối SSH vào VPS
```bash
ssh root@your-vps-ip
# hoặc
ssh ubuntu@your-vps-ip
```

### 1.2. Cài Đặt Docker & Docker Compose
```bash
# Update hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt các gói cần thiết
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common git

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào group docker
sudo usermod -aG docker $USER

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kiểm tra cài đặt
docker --version
docker-compose --version

# Logout và login lại để apply group changes
exit
```

### 1.3. Tạo Thư Mục Project
```bash
# Kết nối lại SSH
ssh ubuntu@your-vps-ip  # hoặc user của bạn

# Tạo thư mục project
mkdir -p ~/tradesphere
cd ~/tradesphere
```

---

## 🎯 Bước 2: Upload Code Lên VPS

### Phương án A: Sử dụng Git (Khuyến nghị)
```bash
# Trên VPS
cd ~/tradesphere
git clone <your-git-repository-url> .

# Nếu là private repo
git clone https://username:token@github.com/yourusername/tradesphere.git .
```

### Phương án B: Upload bằng rsync từ máy local
```bash
# Chạy trên máy local (thư mục hiện tại của project)
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '__pycache__' \
    --exclude '*.log' \
    ./ ubuntu@your-vps-ip:~/tradesphere/
```

### Phương án C: Upload bằng SCP
```bash
# Trên máy local, nén project
tar -czf tradesphere.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='__pycache__' \
    .

# Upload lên VPS
scp tradesphere.tar.gz ubuntu@your-vps-ip:~/

# Trên VPS, giải nén
cd ~/tradesphere
tar -xzf ../tradesphere.tar.gz
```

---

## 🎯 Bước 3: Cấu Hình Tên Miền

### 3.1. Trỏ Domain về VPS
Tại nhà cung cấp domain (ví dụ: Cloudflare, GoDaddy, etc.):
```
Type: A Record
Name: @ (hoặc www)
Value: <IP-VPS-của-bạn>
TTL: Auto hoặc 3600

Type: A Record (nếu muốn subdomain)
Name: www
Value: <IP-VPS-của-bạn>
TTL: Auto hoặc 3600
```

### 3.2. Kiểm tra DNS đã trỏ đúng
```bash
# Trên máy local hoặc VPS
ping tinogroup.com
# Hoặc
nslookup tinogroup.com
```

---

## 🎯 Bước 4: Cấu Hình Environment Variables

### 4.1. Tạo file .env
```bash
# Trên VPS
cd ~/tradesphere
nano .env
```

### 4.2. Nội dung file .env
```bash
# Database Configuration
POSTGRES_USER=tradesphere
POSTGRES_PASSWORD=your-strong-password-here
DATABASE_URL=postgresql://tradesphere:your-strong-password-here@postgres:5432/tradesphere

# Redis
REDIS_URL=redis://redis:6379

# Zalo OA Configuration (nếu có)
ZALO_OA_ID=your-zalo-oa-id
ZALO_ACCESS_TOKEN=your-zalo-access-token
ZALO_SECRET_KEY=your-zalo-secret-key

# Domain
DOMAIN=tinogroup.com

# Production mode
NODE_ENV=production
```

**Lưu file:** Ctrl+X → Y → Enter

---

## 🎯 Bước 5: Cập Nhật Domain trong Nginx Config

### 5.1. Sửa file nginx.prod.conf
```bash
cd ~/tradesphere
nano nginx.prod.conf
```

### 5.2. Thay đổi domain
Tìm và thay `zalo.tino.org` thành `tinogroup.com`:
```nginx
server {
    listen 443 ssl http2;
    server_name tinogroup.com www.tinogroup.com;  # ← Thay đổi ở đây

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tinogroup.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tinogroup.com/privkey.pem;
    
    # ... rest of config
}
```

---

## 🎯 Bước 6: Setup SSL Certificate (HTTPS)

### 6.1. Chạy Nginx tạm thời để xác thực domain
```bash
cd ~/tradesphere

# Start services (không có SSL lần đầu)
docker-compose -f docker-compose.prod.yml up -d postgres redis fastapi express nginx

# Kiểm tra nginx đang chạy
docker ps | grep nginx
```

### 6.2. Cài đặt Let's Encrypt SSL
```bash
# Tạo thư mục SSL
mkdir -p ~/tradesphere/ssl

# Chạy certbot để lấy certificate
docker run -it --rm \
    -v ~/tradesphere/ssl:/etc/letsencrypt \
    -v ~/tradesphere:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly --standalone \
    -d tinogroup.com \
    -d www.tinogroup.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive

# Hoặc nếu nginx đang chạy, dùng webroot mode
docker run -it --rm \
    -v ~/tradesphere/ssl:/etc/letsencrypt \
    -v ~/tradesphere:/var/www/certbot \
    certbot/certbot certonly --webroot \
    -w /var/www/certbot \
    -d tinogroup.com \
    -d www.tinogroup.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

### 6.3. Setup Auto-Renewal
```bash
# Tạo cron job để tự động renew
crontab -e

# Thêm dòng này (chạy mỗi ngày lúc 2 giờ sáng)
0 2 * * * docker run --rm -v ~/tradesphere/ssl:/etc/letsencrypt -v ~/tradesphere:/var/www/certbot certbot/certbot renew --quiet && docker restart tradesphere-nginx
```

---

## 🎯 Bước 7: Deploy với Docker

### 7.1. Build và Start tất cả services
```bash
cd ~/tradesphere

# Pull images và build
docker-compose -f docker-compose.prod.yml build --no-cache

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Kiểm tra trạng thái
docker-compose -f docker-compose.prod.yml ps
```

### 7.2. Kiểm tra logs
```bash
# Xem logs tất cả services
docker-compose -f docker-compose.prod.yml logs -f

# Xem logs từng service
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f express
docker-compose -f docker-compose.prod.yml logs -f fastapi
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### 7.3. Chạy Database Migration
```bash
# Chạy migration
docker exec tradesphere-express npm run db:push
```

---

## 🎯 Bước 8: Kiểm Tra Website

### 8.1. Test trên browser
```
https://tinogroup.com
https://www.tinogroup.com
```

### 8.2. Test API
```bash
# Health check FastAPI
curl https://tinogroup.com/api/health

# Test Express API
curl https://tinogroup.com/api/reports
```

### 8.3. Check SSL Certificate
```bash
# Kiểm tra SSL
curl -vI https://tinogroup.com 2>&1 | grep -i ssl

# Hoặc truy cập
https://www.ssllabs.com/ssltest/analyze.html?d=tinogroup.com
```

---

## 🔧 Các Lệnh Quản Lý

### Restart Services
```bash
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml restart
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml stop
```

### Start Services
```bash
docker-compose -f docker-compose.prod.yml start
```

### Rebuild một service cụ thể
```bash
# Rebuild Express
docker-compose -f docker-compose.prod.yml up -d --build express

# Rebuild FastAPI
docker-compose -f docker-compose.prod.yml up -d --build fastapi
```

### Update Code và Redeploy
```bash
cd ~/tradesphere

# Pull code mới (nếu dùng git)
git pull origin main

# Rebuild và restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Xem resource usage
```bash
docker stats
```

### Backup Database
```bash
# Backup PostgreSQL
docker exec tradesphere-postgres pg_dump -U tradesphere tradesphere > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
cat backup_20241226_120000.sql | docker exec -i tradesphere-postgres psql -U tradesphere tradesphere
```

---

## 🔒 Bảo Mật

### 1. Setup Firewall
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 2. Bảo mật SSH
```bash
# Sửa file SSH config
sudo nano /etc/ssh/sshd_config

# Disable root login và password authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 3. Thay đổi mật khẩu mạnh trong .env
- Sử dụng password generator
- Ít nhất 16 ký tự
- Kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt

---

## 📊 Monitoring

### Setup tự động restart khi server khởi động lại
```bash
# Services đã có restart: unless-stopped trong docker-compose
# Để đảm bảo Docker khởi động cùng hệ thống
sudo systemctl enable docker
```

### Setup monitoring logs
```bash
# Xem logs realtime
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Setup log rotation
sudo nano /etc/logrotate.d/docker-containers
```

---

## 🆘 Troubleshooting

### Website không truy cập được
```bash
# 1. Kiểm tra nginx
docker logs tradesphere-nginx

# 2. Kiểm tra port
sudo netstat -tulpn | grep -E ':(80|443)'

# 3. Kiểm tra firewall
sudo ufw status

# 4. Restart nginx
docker restart tradesphere-nginx
```

### SSL certificate lỗi
```bash
# Xem chi tiết certificate
docker run --rm -v ~/tradesphere/ssl:/etc/letsencrypt certbot/certbot certificates

# Renew manually
docker run --rm -v ~/tradesphere/ssl:/etc/letsencrypt -v ~/tradesphere:/var/www/certbot certbot/certbot renew --force-renewal

# Restart nginx
docker restart tradesphere-nginx
```

### Database connection lỗi
```bash
# Check PostgreSQL
docker logs tradesphere-postgres

# Restart PostgreSQL
docker restart tradesphere-postgres

# Kiểm tra connection
docker exec tradesphere-postgres psql -U tradesphere -d tradesphere -c "SELECT 1;"
```

### Services không start
```bash
# Xem lỗi chi tiết
docker-compose -f docker-compose.prod.yml logs

# Kiểm tra disk space
df -h

# Kiểm tra memory
free -m

# Clean up Docker
docker system prune -a
```

---

## 📝 Checklist Deploy

- [ ] VPS đã cài Docker & Docker Compose
- [ ] Domain đã trỏ về IP VPS
- [ ] Code đã upload lên VPS
- [ ] File .env đã cấu hình đầy đủ
- [ ] nginx.prod.conf đã thay đổi domain
- [ ] SSL certificate đã cài đặt
- [ ] Services đã start thành công
- [ ] Database migration đã chạy
- [ ] Website truy cập được qua HTTPS
- [ ] Firewall đã cấu hình
- [ ] Backup được thiết lập

---

## 🎉 Hoàn Thành!

Website của bạn đã chạy tại:
- **HTTPS:** https://tinogroup.com
- **API:** https://tinogroup.com/api/
- **Health Check:** https://tinogroup.com/api/health

**Lưu ý:** 
- Thay đổi các mật khẩu mặc định trong file .env
- Setup backup định kỳ cho database
- Monitor logs thường xuyên
- Update Docker images định kỳ

Chúc bạn deploy thành công! 🚀
