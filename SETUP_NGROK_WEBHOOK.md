# 🌐 Hướng dẫn Setup Webhook với Ngrok và Zalo OA

## Bước 1: Khởi động Ngrok Tunnel ✅

### Option 1: Sử dụng script tự động (Khuyến nghị)

```bash
cd /media/tnt/01DBF4083BC73BB03/CODE/TradeSphere
./start-ngrok.sh
```

### Option 2: Chạy thủ công

```bash
ngrok http 8000
```

### Kết quả mong đợi:

```
ngrok                                                                  
                                                                       
Session Status                online                                  
Account                       your_account (Plan: Free)               
Version                       3.x.x                                   
Region                        Asia Pacific (ap)                       
Latency                       45ms                                    
Web Interface                 http://127.0.0.1:4040                   
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📋 LƯU Ý QUAN TRỌNG:**
- ✅ Copy URL HTTPS: `https://abc123def456.ngrok.io`
- ⚠️ URL này sẽ THAY ĐỔI mỗi lần restart ngrok (free plan)
- 🔄 Mỗi lần URL đổi → phải cập nhật lại trong Zalo dashboard

---

## Bước 2: Cấu hình Webhook trong Zalo OA Dashboard 🔧

### 2.1. Truy cập Zalo OA Dashboard

1. Mở trình duyệt: https://oa.zalo.me/
2. Đăng nhập bằng tài khoản Zalo của bạn
3. Chọn Official Account đã tạo

### 2.2. Vào Settings → Webhook

**Navigation:**
```
Dashboard → Settings (Cài đặt) → Webhook Configuration
```

### 2.3. Điền thông tin Webhook

| Field | Value | Ví dụ |
|-------|-------|-------|
| **Webhook URL** | `https://YOUR_NGROK_URL/api/v1/zalo/webhook` | `https://abc123def456.ngrok.io/api/v1/zalo/webhook` |
| **Events to subscribe** | ☑️ All events | user_send_text, follow, unfollow, etc. |
| **Verification method** | Secret Key | (Auto từ Zalo) |

### 2.4. Verify Webhook

Click button **"Verify"** → Zalo sẽ gửi test request đến webhook của bạn

**Nếu thành công:**
```
✅ Webhook verification successful!
```

**Nếu thất bại:**
- Kiểm tra ngrok có đang chạy không
- Kiểm tra FastAPI service có healthy không: `curl http://localhost:8000/health`
- Xem logs: `docker-compose logs -f fastapi`

### 2.5. Lưu cấu hình

Click **"Save"** để hoàn tất

---

## Bước 3: Test với Zalo App thật 📱

### 3.1. Tìm và Follow OA

**Trên điện thoại:**
1. Mở app **Zalo**
2. Vào tab **Tin nhắn** → Click icon **tìm kiếm**
3. Search: **TradeSphere** (hoặc tên OA của bạn)
4. Click **Quan tâm** (Follow) OA

**Bạn sẽ nhận được tin nhắn chào mừng tự động:**
```
👋 Chào mừng bạn đến với TradeSphere!

🤖 Tôi là trợ lý AI giúp bạn:
✓ Tra cứu số điện thoại lừa đảo
✓ Kiểm tra tài khoản ngân hàng
✓ Tư vấn phòng chống lừa đảo

💡 Gửi số điện thoại hoặc STK để bắt đầu!
```

### 3.2. Test các tính năng

#### Test 1: Tra cứu số điện thoại
```
Gửi tin nhắn: 0949654358
```

**Kết quả mong đợi:**
```
🔍 Đang tra cứu số điện thoại: 0949654358

✅ KHÔNG TÌM THẤY CẢNH BÁO

Số điện thoại "0949654358" chưa có báo cáo lừa đảo trong hệ thống.

⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
Luôn cẩn thận khi giao dịch tiền bạc!

💡 Gửi tin nhắn để tôi tư vấn thêm.
```

#### Test 2: Tra cứu tài khoản ngân hàng
```
Gửi tin nhắn: 1234567890123
```

#### Test 3: Chat với AI
```
Gửi tin nhắn: Làm sao để nhận biết lừa đảo qua điện thoại?
```

**Lưu ý:** Nếu AI không hoạt động, cần cấu hình `OPENAI_API_KEY` trong file `.env`

---

## Monitor & Debug 🔍

### 1. Xem ngrok requests

Mở trình duyệt: http://127.0.0.1:4040

Bạn sẽ thấy:
- ✅ Tất cả HTTP requests đến webhook
- ✅ Request/Response details
- ✅ Status codes
- ✅ Timing information

### 2. Xem FastAPI logs

```bash
# Xem logs real-time
docker-compose logs -f fastapi

# Lọc chỉ Zalo events
docker-compose logs -f fastapi | grep -i zalo

# Xem 50 dòng gần nhất
docker-compose logs --tail=50 fastapi
```

### 3. Kiểm tra database

```bash
# Vào PostgreSQL
docker-compose exec postgres psql -U tradesphere -d tradesphere

# Query Zalo users
SELECT * FROM zalo_users ORDER BY followed_at DESC LIMIT 5;

# Query messages
SELECT * FROM zalo_messages ORDER BY sent_at DESC LIMIT 10;

# Query searches từ Zalo
SELECT * FROM scam_searches WHERE source = 'zalo' ORDER BY search_time DESC;
```

### 4. Test webhook manually

```bash
# Gửi test request đến webhook
curl -X POST https://YOUR_NGROK_URL/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "user_send_text",
    "sender": {"id": "test_user"},
    "message": {"text": "0949654358"}
  }'
```

---

## Troubleshooting 🔧

### ❌ Lỗi: "Webhook verification failed"

**Nguyên nhân:**
- Ngrok không chạy
- URL sai
- FastAPI service không healthy

**Giải pháp:**
```bash
# 1. Check ngrok
ps aux | grep ngrok

# 2. Check FastAPI
curl http://localhost:8000/health

# 3. Restart nếu cần
docker-compose restart fastapi
./start-ngrok.sh
```

### ❌ Lỗi: "Invalid signature"

**Nguyên nhân:** Secret key không khớp

**Giải pháp:**
1. Lấy Secret Key từ Zalo OA Dashboard
2. Cập nhật `.env`:
   ```bash
   ZALO_SECRET_KEY=your_correct_secret_key
   ```
3. Restart:
   ```bash
   docker-compose restart fastapi
   ```

### ❌ Bot không trả lời tin nhắn

**Checklist:**
- [ ] Ngrok đang chạy (`ps aux | grep ngrok`)
- [ ] Webhook đã verify thành công trong Zalo dashboard
- [ ] FastAPI service healthy (`curl http://localhost:8000/health`)
- [ ] Không có lỗi trong logs (`docker-compose logs fastapi`)
- [ ] Database connection OK

**Debug:**
```bash
# Xem ngrok requests
# Mở: http://127.0.0.1:4040

# Xem logs
docker-compose logs -f fastapi

# Test webhook thủ công
curl -X POST http://localhost:8000/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_name":"user_send_text","sender":{"id":"test"},"message":{"text":"test"}}'
```

### ❌ AI không hoạt động

**Nguyên nhân:** OpenAI API key chưa cấu hình hoặc không hợp lệ

**Giải pháp:**
1. Lấy API key tại: https://platform.openai.com/api-keys
2. Cập nhật `.env`:
   ```bash
   OPENAI_API_KEY=sk-your-real-api-key-here
   ```
3. Restart:
   ```bash
   docker-compose restart fastapi
   ```

---

## Tips & Best Practices 💡

### 1. Ngrok Free vs Paid

**Free plan:**
- ✅ Unlimited requests
- ❌ URL changes on restart
- ❌ Session timeout after 2 hours (phải reconnect)

**Paid plan ($8/month):**
- ✅ Fixed URL (custom domain)
- ✅ No timeout
- ✅ Better for production

### 2. Production Deployment

Thay ngrok bằng:
- **VPS/Cloud**: Deploy lên DigitalOcean, AWS, GCP
- **Domain**: Cấu hình SSL certificate
- **Load balancer**: NGINX, Cloudflare

### 3. Security

```bash
# Uncomment signature verification in code
# File: fastapi-service/app/api/v1/endpoints/zalo.py
# Line: if not zalo_service.verify_signature(body, x_zalo_signature):
```

### 4. Rate Limiting

Zalo có giới hạn:
- 2000 messages/hour
- 50 API calls/minute

Monitor usage trong code.

### 5. Testing Best Practices

- ✅ Test locally trước với mock data
- ✅ Verify webhook trước khi test thật
- ✅ Monitor logs khi test
- ✅ Backup database trước major changes

---

## Checklist Hoàn tất ✅

- [ ] Ngrok đã cài đặt và chạy
- [ ] FastAPI service healthy
- [ ] Webhook URL cấu hình đúng trong Zalo dashboard
- [ ] Webhook verified successfully
- [ ] Test gửi tin nhắn thành công
- [ ] Database ghi nhận messages
- [ ] Logs không có errors
- [ ] AI chatbot hoạt động (nếu có OpenAI key)

---

## Next Steps 🚀

### Phase 2: Advanced Features

1. **Rich Messages**
   - Buttons (Quick replies)
   - List templates
   - Image attachments

2. **Broadcast Messages**
   - Daily scam alerts
   - New report notifications
   - Tips & prevention guides

3. **User Management**
   - Block/unblock users
   - User preferences
   - Analytics dashboard

4. **Integration**
   - Connect với frontend
   - Admin dashboard
   - Reporting system

---

## Support & Resources 📚

- **Zalo OA Docs**: https://developers.zalo.me/docs/official-account
- **TradeSphere Docs**: [ZALO_INTEGRATION_GUIDE.md](ZALO_INTEGRATION_GUIDE.md)
- **API Docs**: http://localhost:8000/docs
- **Ngrok Dashboard**: http://127.0.0.1:4040

---

**Câu hỏi?** Check [troubleshooting](#troubleshooting-) section hoặc xem logs!

**Good luck! 🎉**
