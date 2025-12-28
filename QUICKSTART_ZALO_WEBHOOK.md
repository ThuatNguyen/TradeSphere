# 🚀 Quick Start: Setup Zalo Webhook (5 phút)

## Bước 1: Lấy Thông Tin Zalo OA (2 phút)

1. Truy cập: https://oa.zalo.me/
2. Vào **Cài đặt** → **Cấu hình API**
3. Lấy 3 thông tin:
   - **OA ID**: `1234567890123456789`
   - **Access Token**: `xxxxxxxxxxxxx`
   - **Secret Key**: `yyyyyyyyyyyyy`

## Bước 2: Cấu Hình VPS (1 phút)

```bash
# SSH vào VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# Edit .env
cd /root/tradesphere
nano .env
```

Thêm 3 dòng này (thay YOUR_XXX bằng giá trị thật):

```env
ZALO_OA_ID=YOUR_OA_ID
ZALO_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
ZALO_SECRET_KEY=YOUR_SECRET_KEY
```

**Ví dụ:**
```env
ZALO_OA_ID=1234567890123456789
ZALO_ACCESS_TOKEN=abcdefghijklmnopqrstuvwxyz123456
ZALO_SECRET_KEY=secretkey123456789
```

Lưu file (Ctrl+X, Y, Enter) và restart:

```bash
docker-compose -f docker-compose.prod.yml restart fastapi
```

## Bước 3: Đăng Ký Webhook (1 phút)

1. Vào **Zalo OA Admin** → **Cài đặt** → **Webhook**
2. Nhập URL:
   ```
   https://thuatnguyen.io.vn/api/v1/zalo/webhook
   ```
3. Chọn events:
   - ✅ user_send_text
   - ✅ user_send_image
   - ✅ follow
   - ✅ unfollow
4. **Lưu** → Đợi status **Active** ✅

## Bước 4: Test (1 phút)

### Option 1: Test bằng Zalo App

1. Mở Zalo app trên điện thoại
2. Tìm và follow OA của bạn
3. Gửi tin nhắn:
   ```
   0909123456
   ```
4. Bot sẽ tự động trả lời! 🎉

### Option 2: Test bằng Script

```bash
cd /media/tnt/01DBF4083BC73BB04/CODE/TradeSphere
./test-zalo-webhook.sh
```

Chọn option **2** để test với số điện thoại.

## ✅ Xong!

Webhook đã hoạt động! Giờ bot có thể:

- ✅ Nhận tin nhắn từ users
- ✅ Tự động tìm kiếm thông tin lừa đảo
- ✅ Trả lời bằng AI
- ✅ Lưu lịch sử chat

## 🔍 Debug

**Nếu không hoạt động:**

```bash
# 1. Check logs
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214
docker logs tradesphere-fastapi -f

# 2. Check environment
docker exec tradesphere-fastapi printenv | grep ZALO

# 3. Test webhook
curl -X POST https://thuatnguyen.io.vn/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_name":"user_send_text","sender":{"id":"test"},"message":{"text":"hello"}}'
```

## 📚 Chi Tiết

Xem hướng dẫn đầy đủ: [ZALO_WEBHOOK_SETUP.md](ZALO_WEBHOOK_SETUP.md)

---

**Webhook URL:** https://thuatnguyen.io.vn/api/v1/zalo/webhook  
**API Docs:** https://thuatnguyen.io.vn/docs  
**Status:** 🟢 Active
