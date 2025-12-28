# 🚀 Quick Start - Deploy to Tinogroup VPS

## Triển khai nhanh trong 5 phút

### 1️⃣ Cấu hình thông tin VPS

Mở file `deploy-tinogroup.sh` và sửa các thông tin:

```bash
VPS_IP="123.456.789.0"           # ← IP VPS của bạn
VPS_USER="ubuntu"                # ← User SSH
SSH_KEY="~/.ssh/id_rsa"         # ← SSH key (hoặc để trống)
DOMAIN="tinogroup.com"          # ← Domain chính
EMAIL="admin@tinogroup.com"     # ← Email của bạn
```

### 2️⃣ Chạy script deploy

```bash
# Cho phép script chạy
chmod +x deploy-tinogroup.sh

# Chạy deploy
./deploy-tinogroup.sh
```

Script sẽ tự động:
- ✅ Cài đặt Docker & Docker Compose
- ✅ Upload code lên VPS
- ✅ Cấu hình môi trường (.env)
- ✅ Setup SSL certificate (HTTPS)
- ✅ Deploy tất cả services
- ✅ Setup firewall
- ✅ Cấu hình auto-renewal SSL

### 3️⃣ Kiểm tra website

Sau khi deploy xong (2-5 phút), truy cập:

```
https://tinogroup.com
```

---

## 🔧 Các lệnh quản lý thường dùng

### Kết nối SSH vào VPS
```bash
ssh ubuntu@your-vps-ip
```

### Xem logs
```bash
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart services
```bash
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml restart
```

### Stop services
```bash
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml stop
```

### Start services
```bash
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml start
```

### Update code và redeploy
```bash
# Trên máy local
./deploy-tinogroup.sh
```

### Xem trạng thái containers
```bash
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml ps
```

---

## 🆘 Troubleshooting

### Website không truy cập được?

1. **Kiểm tra DNS đã trỏ đúng:**
```bash
ping tinogroup.com
```

2. **Kiểm tra services đang chạy:**
```bash
ssh ubuntu@your-vps-ip
cd ~/tradesphere
docker-compose -f docker-compose.prod.yml ps
```

3. **Xem logs để biết lỗi:**
```bash
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs express
```

4. **Restart tất cả:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### SSL Certificate lỗi?

```bash
# Trên VPS
cd ~/tradesphere

# Force renew SSL
docker run --rm \
    -v $(pwd)/certbot_conf:/etc/letsencrypt \
    -v $(pwd)/certbot_data:/var/www/certbot \
    certbot/certbot renew --force-renewal

# Restart nginx
docker restart tradesphere-nginx
```

### Database lỗi?

```bash
# Restart database
docker restart tradesphere-postgres

# Run migration lại
docker exec tradesphere-express npm run db:push
```

---

## 📚 Tài liệu chi tiết

Xem file [DEPLOY_VPS_TINOGROUP.md](DEPLOY_VPS_TINOGROUP.md) để có hướng dẫn chi tiết từng bước.

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. DNS đã trỏ về IP VPS chưa
2. Firewall đã mở port 80, 443 chưa
3. Services có lỗi gì trong logs không
4. Disk space còn đủ không: `df -h`
5. Memory còn đủ không: `free -m`
