# Zalo OA Integration - Hoàn Thành

## ✅ Trạng Thái

**Zalo Access Token đã hoạt động!**

- 🟢 Access Token: Đã lấy thành công và cập nhật vào hệ thống
- 🟢 Refresh Token: Đã lưu tại `/root/tradesphere/scripts/zalo_refresh_token.txt` trên VPS
- 🟢 Gửi tin nhắn: Đã test thành công (message_id: 07d2624a55cd0f9556da)
- 🟢 AI Chat: Đang hoạt động với model gpt-3.5-turbo
- 🟢 Webhook: Nhận và xử lý tin nhắn thành công

## 📋 Thông Tin Hệ Thống

### Zalo OA
- **OA ID**: 433408824941888677
- **App ID**: 548847842150265811
- **Webhook URL**: https://thuatnguyen.io.vn/api/v1/zalo/webhook
- **Access Token**: Expires sau 25 giờ (expires at: 2025-12-28 00:02:47)

### VPS
- **IP**: 103.130.218.214
- **Domain**: thuatnguyen.io.vn
- **SSL**: Valid đến 26/03/2026
- **Scripts Location**: /root/tradesphere/scripts/

### OpenAI
- **Model**: gpt-3.5-turbo
- **API Key**: Đã cấu hình
- **Credits**: $5.00 available (expires Jan 2027)

## 🔄 Auto-Refresh Token

### Cách Setup (Chạy Trên VPS)

```bash
# 1. SSH vào VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# 2. Di chuyển đến thư mục scripts
cd /root/tradesphere/scripts

# 3. Cài đặt Python requests nếu chưa có
pip3 install requests

# 4. Test refresh token thủ công
python3 refresh_zalo_token.py

# 5. Setup cron job (tự động chạy mỗi 20 giờ)
chmod +x refresh_zalo_token_cron.sh
crontab -e

# Thêm dòng sau vào crontab:
0 */20 * * * /root/tradesphere/scripts/refresh_zalo_token_cron.sh >> /var/log/zalo_refresh.log 2>&1

# 6. Kiểm tra cron job
crontab -l
```

### Cách Hoạt Động

1. **Script `refresh_zalo_token.py`**:
   - Đọc refresh_token từ file `zalo_refresh_token.txt`
   - Gửi request đến Zalo API để lấy access_token mới
   - Cập nhật file `.env` với access_token mới
   - Lưu refresh_token mới (nếu có)
   - Restart FastAPI container để load token mới

2. **Cron Job**:
   - Chạy tự động mỗi 20 giờ (trước khi token hết hạn)
   - Log output vào `/var/log/zalo_refresh.log`
   - Gửi email thông báo nếu có lỗi (optional)

## 📝 Kiểm Tra Logs

### FastAPI Logs
```bash
# SSH vào VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# Xem logs real-time
docker logs -f tradesphere-fastapi

# Xem 100 dòng cuối
docker logs tradesphere-fastapi --tail 100
```

### Database Logs
```bash
# Kiểm tra tin nhắn mới nhất
docker exec -e PGPASSWORD=tradesphere_password tradesphere-postgres psql -U tradesphere -d tradesphere -c "SELECT zalo_user_id, message_content, is_from_user, sent_at FROM zalo_messages ORDER BY sent_at DESC LIMIT 10;"
```

### Token Refresh Logs
```bash
# Xem log của auto-refresh
tail -f /var/log/zalo_refresh.log
```

## 🧪 Testing

### 1. Test Gửi Tin Nhắn (Từ Local)
```bash
curl -X POST https://thuatnguyen.io.vn/api/v1/zalo/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE",
    "message": "Test message from TradeSphere"
  }'
```

### 2. Test Webhook (Gửi tin nhắn từ Zalo OA)
- Mở Zalo trên điện thoại
- Tìm OA "TradeSphere" (hoặc OA của bạn)
- Gửi tin nhắn bất kỳ
- Bot sẽ trả lời tự động bằng AI

### 3. Test AI Chat
Gửi tin nhắn:
- "Xin chào"
- "Tôi bị lừa đảo"
- "0123456789" (số điện thoại)
- "123456789012" (số tài khoản ngân hàng)

### 4. Test Token Refresh
```bash
# Chạy thủ công trên VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214
cd /root/tradesphere/scripts
python3 refresh_zalo_token.py
```

## 🔧 Troubleshooting

### Lỗi "Access token is invalid"
```bash
# 1. Kiểm tra token trong container
docker exec tradesphere-fastapi printenv | grep ZALO_ACCESS_TOKEN

# 2. Kiểm tra .env file
cat /root/tradesphere/.env | grep ZALO_ACCESS_TOKEN

# 3. Refresh token thủ công
cd /root/tradesphere/scripts
python3 refresh_zalo_token.py

# 4. Restart container
cd /root/tradesphere
docker-compose -f docker-compose.prod.yml down fastapi
docker-compose -f docker-compose.prod.yml up -d fastapi
```

### Token Hết Hạn
Nếu cả access_token và refresh_token đều hết hạn, cần lấy token mới:

```bash
# Trên local machine
cd /media/tnt/01DBF4083BC73BB04/CODE/TradeSphere/fastapi-service/app/scripts
./get_zalo_token_auto.sh

# Sau đó upload .env mới lên VPS
rsync -avz -e 'ssh -i ~/.ssh/id_ed25519' ../../../../../../.env root@103.130.218.214:/root/tradesphere/

# Upload refresh token mới
rsync -avz -e 'ssh -i ~/.ssh/id_ed25519' zalo_refresh_token.txt root@103.130.218.214:/root/tradesphere/scripts/

# Restart container
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214 "cd /root/tradesphere && docker-compose -f docker-compose.prod.yml down fastapi && docker-compose -f docker-compose.prod.yml up -d fastapi"
```

### Container Không Start
```bash
# Xem logs lỗi
docker logs tradesphere-fastapi

# Rebuild container
cd /root/tradesphere
docker-compose -f docker-compose.prod.yml build --no-cache fastapi
docker-compose -f docker-compose.prod.yml up -d fastapi
```

## 📊 Monitoring

### Kiểm Tra Trạng Thái Hệ Thống
```bash
# Trạng thái containers
docker ps

# Disk usage
df -h

# Memory usage
free -h

# Số lượng tin nhắn
docker exec -e PGPASSWORD=tradesphere_password tradesphere-postgres psql -U tradesphere -d tradesphere -c "SELECT COUNT(*) as total_messages, COUNT(CASE WHEN is_from_user THEN 1 END) as from_users, COUNT(CASE WHEN NOT is_from_user THEN 1 END) as from_bot FROM zalo_messages;"
```

## 📚 Tài Liệu Liên Quan

- [ZALO_INTEGRATION_GUIDE.md](./ZALO_INTEGRATION_GUIDE.md) - Hướng dẫn tích hợp chi tiết
- [ZALO_TOKEN_REFRESH_GUIDE.md](./fastapi-service/app/scripts/ZALO_TOKEN_REFRESH_GUIDE.md) - Hướng dẫn refresh token
- [WEBHOOK_SETUP_GUIDE.txt](./WEBHOOK_SETUP_GUIDE.txt) - Setup webhook
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Kiến trúc hệ thống

## ✨ Tính Năng Hoạt Động

- ✅ Nhận tin nhắn từ Zalo OA
- ✅ AI tự động trả lời (GPT-3.5-turbo)
- ✅ Tìm kiếm lừa đảo khi phát hiện số điện thoại/tài khoản
- ✅ Lưu lịch sử chat vào database
- ✅ Gửi tin nhắn chủ động
- ✅ Auto-refresh access token
- ✅ Rate limiting
- ✅ Error handling
- ✅ Logging đầy đủ

## 🎯 Kế Hoạch Tiếp Theo

1. ✅ Setup auto-refresh token với cron job
2. ⏳ Monitor và test trong 24-48 giờ
3. ⏳ Thêm metrics và monitoring (Prometheus/Grafana)
4. ⏳ Setup alerting khi token sắp hết hạn
5. ⏳ Tối ưu hóa AI responses
6. ⏳ Thêm rich messages (buttons, templates)
7. ⏳ Setup backup tự động cho database

## 🎉 Thành Tựu

**Hệ thống TradeSphere đã hoàn thành tích hợp Zalo OA!**

- Deployment hoàn chỉnh trên VPS với Docker
- SSL certificate đầy đủ
- Webhook hoạt động 24/7
- AI chat integration với OpenAI
- Database logging đầy đủ
- Auto-refresh mechanism
- Production-ready!

---
*Cập nhật lần cuối: 26/12/2025 23:07*
