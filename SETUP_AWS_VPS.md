# 🚀 Setup TradeSphere trên AWS VPS với Domain Tino.org

## 📋 Yêu cầu

- AWS EC2 instance (Ubuntu 20.04+)
- Domain từ tino.org
- SSH access vào VPS

## 🎯 Các bước setup

### 1️⃣ Cấu hình DNS tại Tino.org

Tạo A Record trỏ subdomain về VPS:

```
Type: A
Name: zalo (hoặc tradesphere)
Value: <AWS_VPS_IP>
TTL: 300
```

Ví dụ: `zalo.tino.org` → `13.212.xxx.xxx`

**Kiểm tra DNS:**
```bash
dig zalo.tino.org +short
# Phải trả về IP của VPS
```

---

### 2️⃣ Cài đặt môi trường trên VPS

SSH vào VPS:
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@<VPS_IP>
```

Cài đặt Docker và Docker Compose:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version

# Logout và login lại để apply group changes
exit
```

---

### 3️⃣ Setup SSL với Let's Encrypt

SSH lại vào VPS và tạo thư mục project:
```bash
mkdir -p /home/ubuntu/tradesphere
cd /home/ubuntu/tradesphere
```

Tạo file `.env`:
```bash
nano .env
```

Nội dung:
```env
POSTGRES_USER=tradesphere
POSTGRES_PASSWORD=your_strong_password_here
ZALO_OA_ID=433408824941888677
ZALO_ACCESS_TOKEN=your_access_token
ZALO_SECRET_KEY=your_secret_key
```

**Tạo SSL certificate:**
```bash
# Tạo thư mục cho certbot
sudo mkdir -p /var/www/certbot

# Chạy certbot standalone để lấy cert lần đầu
sudo docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d zalo.tino.org
```

**Verify certificate:**
```bash
sudo ls -la /etc/letsencrypt/live/zalo.tino.org/
# Phải thấy: fullchain.pem, privkey.pem
```

---

### 4️⃣ Cấu hình file deploy local

Trên **máy local**, mở file `deploy-to-aws.sh`:

```bash
nano deploy-to-aws.sh
```

Sửa các biến:
```bash
AWS_HOST="13.212.xxx.xxx"              # IP VPS AWS
AWS_USER="ubuntu"                       # User SSH
SSH_KEY="~/.ssh/your-key.pem"          # SSH key path
DOMAIN="zalo.tino.org"                 # Domain của bạn
PROJECT_PATH="/home/ubuntu/tradesphere"
```

Sửa domain trong `nginx.prod.conf`:
```bash
nano nginx.prod.conf
```

Tìm và thay:
```nginx
server_name zalo.tino.org;  # Domain của bạn
ssl_certificate /etc/letsencrypt/live/zalo.tino.org/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/zalo.tino.org/privkey.pem;
```

---

### 5️⃣ Deploy lần đầu

Từ **máy local**:

```bash
# Make script executable
chmod +x deploy-to-aws.sh

# Deploy
./deploy-to-aws.sh
```

Script sẽ:
1. ✅ Sync code lên VPS
2. ✅ Build Docker images
3. ✅ Start all services
4. ✅ Health check

---

### 6️⃣ Kiểm tra services

SSH vào VPS:
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@<VPS_IP>
cd /home/ubuntu/tradesphere

# Check containers
sudo docker-compose ps

# Check logs
sudo docker-compose logs -f

# Test health
curl http://localhost:8000/health
```

Từ browser:
- 🌐 **Webhook**: https://zalo.tino.org/api/v1/zalo/webhook
- 📊 **API Docs**: https://zalo.tino.org/docs
- 🔍 **Health**: https://zalo.tino.org/health

---

### 7️⃣ Cấu hình Zalo Webhook

1. **Verify Domain** (nếu cần):
   - Vào: https://developers.zalo.me/app/548847842150265811/verify-domain
   - Domain: `zalo.tino.org`
   - Method: DNS TXT hoặc HTML File

2. **Configure Webhook**:
   - Vào: https://oa.zalo.me/ → Settings → Webhook
   - URL: `https://zalo.tino.org/api/v1/zalo/webhook`
   - Events: ✅ `user_send_text`, `follow`, `unfollow`
   - Click **Verify** → **Save**

---

## 🔄 Deploy updates nhanh

Mỗi lần update code, chỉ cần chạy:

```bash
./deploy-to-aws.sh
```

Script tự động:
- Sync code mới
- Rebuild containers
- Restart services
- Health check

⚡ **Thời gian deploy: ~2-3 phút**

---

## 🧪 Test End-to-End

1. **Mở Zalo app** trên điện thoại
2. **Tìm OA** của bạn (ID: 433408824941888677)
3. **Follow OA**
4. **Gửi số điện thoại**: `0949654358`
5. **Bot trả về**: Kết quả scam search

**Monitor logs:**
```bash
ssh -i ~/.ssh/your-key.pem ubuntu@<VPS_IP>
cd /home/ubuntu/tradesphere
sudo docker-compose logs -f fastapi
```

---

## 🔒 Security Checklist

- ✅ SSL/TLS với Let's Encrypt
- ✅ HTTPS redirect
- ✅ Rate limiting (10 req/s API, 30 req/s webhook)
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ Database password strong
- ✅ Environment variables trong `.env`
- ✅ Firewall: Chỉ mở port 80, 443, 22

**Cấu hình firewall:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 📊 Monitoring

**Check logs:**
```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f fastapi
sudo docker-compose logs -f nginx

# Last 100 lines
sudo docker-compose logs --tail=100 fastapi
```

**Check resource usage:**
```bash
sudo docker stats
```

**Check disk space:**
```bash
df -h
sudo docker system df
```

**Cleanup old images:**
```bash
sudo docker system prune -a
```

---

## 🆘 Troubleshooting

### Issue: SSL certificate error
**Solution:**
```bash
# Renew certificate
sudo docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot renew
  
# Restart nginx
sudo docker-compose restart nginx
```

### Issue: Webhook not receiving
**Solution:**
```bash
# Check webhook endpoint
curl -X POST https://zalo.tino.org/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}'

# Check nginx logs
sudo docker-compose logs nginx | grep webhook

# Check fastapi logs
sudo docker-compose logs fastapi | grep webhook
```

### Issue: Database connection error
**Solution:**
```bash
# Check postgres
sudo docker-compose ps postgres
sudo docker-compose logs postgres

# Restart postgres
sudo docker-compose restart postgres

# Check connection
sudo docker-compose exec postgres psql -U tradesphere -d tradesphere -c "SELECT 1;"
```

---

## 🎉 Done!

Webhook URL: `https://zalo.tino.org/api/v1/zalo/webhook`

Deploy mới: `./deploy-to-aws.sh`

Monitor: `sudo docker-compose logs -f`
