# 🔗 Hướng Dẫn Setup Zalo Webhook

## 📋 Yêu Cầu

- ✅ Website đã chạy: https://thuatnguyen.io.vn
- ✅ FastAPI service đang hoạt động
- ✅ Có Zalo OA (Official Account) đã được tạo
- ✅ Có quyền quản lý Zalo OA

## 🚀 Bước 1: Lấy Thông Tin Zalo OA

### 1.1. Đăng nhập Zalo OA Admin

Truy cập: https://oa.zalo.me/

### 1.2. Lấy OA ID

1. Vào **Cài đặt** → **Thông tin OA**
2. Sao chép **OA ID** (dạng: 1234567890123456789)

### 1.3. Tạo Access Token

1. Vào **Cài đặt** → **Cấu hình API**
2. Nhấn **Tạo Access Token**
3. Sao chép **Access Token** (dạng: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
4. Sao chép **Secret Key** (dùng để verify webhook signature)

## 🔧 Bước 2: Cấu Hình Environment Variables

### 2.1. Cập nhật file .env trên VPS

```bash
# SSH vào VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# Edit file .env
cd /root/tradesphere
nano .env
```

### 2.2. Thêm Zalo credentials

```env
# Zalo OA Configuration
ZALO_OA_ID=your_oa_id_here
ZALO_ACCESS_TOKEN=your_access_token_here
ZALO_SECRET_KEY=your_secret_key_here
```

**Ví dụ:**
```env
ZALO_OA_ID=1234567890123456789
ZALO_ACCESS_TOKEN=abcdefghijklmnopqrstuvwxyz123456
ZALO_SECRET_KEY=secretkey123456789
```

### 2.3. Restart FastAPI service

```bash
docker-compose -f docker-compose.prod.yml restart fastapi
```

## 🔗 Bước 3: Đăng Ký Webhook URL

### 3.1. Webhook URL của bạn

```
https://thuatnguyen.io.vn/api/v1/zalo/webhook
```

### 3.2. Đăng ký trên Zalo OA Admin

1. Vào **Cài đặt** → **Webhook**
2. Nhập **Webhook URL**: `https://thuatnguyen.io.vn/api/v1/zalo/webhook`
3. Chọn các events muốn nhận:
   - ✅ **user_send_text** - Nhận tin nhắn text
   - ✅ **user_send_image** - Nhận hình ảnh
   - ✅ **follow** - User follow OA
   - ✅ **unfollow** - User unfollow OA
4. Nhấn **Lưu**

### 3.3. Verify webhook

Zalo sẽ gửi request test đến webhook URL. Nếu thành công, status sẽ hiển thị **Active** ✅

## 🧪 Bước 4: Test Webhook

### 4.1. Test bằng Zalo Mobile App

1. Mở **Zalo app** trên điện thoại
2. Tìm và follow **Zalo OA** của bạn
3. Gửi tin nhắn test:

```
0123456789
```

hoặc

```
9704229876543210123456
```

### 4.2. Kiểm tra logs

```bash
# SSH vào VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# Xem logs FastAPI
docker logs tradesphere-fastapi -f --tail=50
```

### 4.3. Test tìm kiếm lừa đảo

**Gửi số điện thoại:**
```
0123456789
```

**Kết quả mong đợi:**
```
✅ KHÔNG TÌM THẤY CẢNH BÁO

Số/tài khoản "0123456789" chưa có báo cáo lừa đảo trong hệ thống.

⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
Luôn cẩn thận khi giao dịch tiền bạc!

💡 Gửi tin nhắn để tôi tư vấn thêm.
```

**Gửi tài khoản ngân hàng:**
```
9704229876543210123456
```

**Kết quả mong đợi:**
```
🚨 PHÁT HIỆN CẢNH BÁO

Từ khóa: 9704229876543210123456
Tổng số báo cáo: 5

📌 CHECKSCAM: 3 báo cáo
  • Nguyễn Văn A
    2024-12-20
  • Trần Thị B
    2024-12-18

⚠️ Cảnh báo: Có thể là lừa đảo!
💻 Chi tiết: https://thuatnguyen.io.vn/search?q=9704229876543210123456
```

## 🎯 Bước 5: Test Tính Năng AI Chat

### 5.1. Gửi tin nhắn tự do

```
Làm sao để tránh bị lừa đảo online?
```

### 5.2. Kết quả mong đợi

Bot sẽ trả lời bằng AI với thông tin hữu ích về phòng chống lừa đảo.

## 🔍 Bước 6: Monitor & Debug

### 6.1. Kiểm tra webhook events

```bash
# Real-time logs
docker logs tradesphere-fastapi -f

# Lọc chỉ Zalo webhook
docker logs tradesphere-fastapi | grep "zalo"
```

### 6.2. Kiểm tra database

```bash
# Connect to PostgreSQL
docker exec -it tradesphere-postgres psql -U tradesphere -d tradesphere

# Xem tin nhắn Zalo
SELECT * FROM zalo_messages ORDER BY created_at DESC LIMIT 10;

# Xem users Zalo
SELECT * FROM zalo_users ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

### 6.3. Test API trực tiếp

```bash
# Test webhook endpoint
curl -X POST https://thuatnguyen.io.vn/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "user_send_text",
    "sender": {
      "id": "test_user_123"
    },
    "recipient": {
      "id": "oa_id"
    },
    "message": {
      "text": "0123456789"
    },
    "timestamp": "1234567890"
  }'
```

## 📊 API Endpoints Có Sẵn

### 1. Webhook Endpoint
```
POST /api/v1/zalo/webhook
```
Nhận events từ Zalo OA

### 2. Send Message
```
POST /api/v1/zalo/send-message
Content-Type: application/json

{
  "user_id": "zalo_user_id",
  "text": "Hello from API!"
}
```

### 3. Get User Profile
```
GET /api/v1/zalo/user/{user_id}
```

### 4. Search Scam
```
GET /api/v1/scam/search?keyword=0123456789
```

### 5. API Docs
```
https://thuatnguyen.io.vn/docs
```

## 🛠️ Troubleshooting

### ❌ Webhook không nhận được events

**Kiểm tra:**
1. URL webhook đã đúng chưa: `https://thuatnguyen.io.vn/api/v1/zalo/webhook`
2. SSL certificate hợp lệ chưa: `curl -I https://thuatnguyen.io.vn`
3. FastAPI service đang chạy: `docker ps | grep fastapi`
4. Firewall có block port 443 không

**Fix:**
```bash
# Restart FastAPI
docker-compose -f docker-compose.prod.yml restart fastapi

# Xem logs
docker logs tradesphere-fastapi --tail=100
```

### ❌ Bot không trả lời tin nhắn

**Kiểm tra:**
1. Access Token còn hợp lệ không
2. OA đã được duyệt chưa
3. Logs có lỗi gì không

**Fix:**
```bash
# Kiểm tra env vars
docker exec tradesphere-fastapi printenv | grep ZALO

# Test send message
curl -X POST https://thuatnguyen.io.vn/api/v1/zalo/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your_zalo_user_id",
    "text": "Test message"
  }'
```

### ❌ Signature verification failed

**Tạm thời disable signature check:**

File: `fastapi-service/app/api/v1/endpoints/zalo.py`

Line 81-83 đã được comment:
```python
# if not zalo_service.verify_signature(body, x_zalo_signature):
#     raise HTTPException(status_code=401, detail="Invalid signature")
```

## 📝 Script Hỗ Trợ

### Test webhook locally
```bash
#!/bin/bash
# test-zalo-webhook.sh

curl -X POST http://localhost:8000/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "user_send_text",
    "sender": {
      "id": "test_user_123"
    },
    "recipient": {
      "id": "oa_id"
    },
    "message": {
      "text": "0909123456"
    },
    "timestamp": "'$(date +%s)'"
  }'
```

### Check webhook status
```bash
#!/bin/bash
# check-webhook.sh

echo "🔍 Checking webhook endpoint..."
curl -I https://thuatnguyen.io.vn/api/v1/zalo/webhook

echo -e "\n📊 FastAPI service status..."
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214 'docker ps | grep fastapi'

echo -e "\n📋 Recent logs..."
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214 'docker logs tradesphere-fastapi --tail=20'
```

## 🎉 Hoàn Tất!

Webhook đã được setup thành công! Bây giờ bạn có thể:

1. ✅ Nhận tin nhắn từ người dùng qua Zalo OA
2. ✅ Bot tự động trả lời với AI
3. ✅ Tìm kiếm thông tin lừa đảo
4. ✅ Monitor user interactions
5. ✅ Gửi tin nhắn chủ động qua API

## 📚 Tài Liệu Tham Khảo

- [Zalo OA Documentation](https://developers.zalo.me/docs/official-account/)
- [Zalo Webhook Events](https://developers.zalo.me/docs/official-account/webhook/su-kien-webhook-post-1131)
- [FastAPI Docs](https://thuatnguyen.io.vn/docs)

---

**Cần hỗ trợ?** Liên hệ admin hoặc xem logs để debug! 🚀
