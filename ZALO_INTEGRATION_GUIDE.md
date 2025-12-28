# 🤖 Hướng dẫn Tích hợp Zalo OA với TradeSphere

## 📋 Tổng quan

TradeSphere đã tích hợp đầy đủ Zalo Official Account (OA) để:
- ✅ Nhận và xử lý tin nhắn từ người dùng
- ✅ Tự động phát hiện số điện thoại/tài khoản ngân hàng
- ✅ Tra cứu thông tin lừa đảo
- ✅ Tư vấn qua AI chatbot
- ✅ Gửi tin nhắn phản hồi tự động

## 🔧 Setup Zalo OA

### 1. Tạo Zalo Official Account

1. Truy cập: https://oa.zalo.me/
2. Đăng ký tài khoản OA (miễn phí)
3. Lấy thông tin:
   - **OA ID**: Mã định danh OA
   - **Access Token**: Token để gọi API
   - **Secret Key**: Key để verify webhook

### 2. Cấu hình Environment Variables

Cập nhật file `.env`:

```bash
# Zalo OA Configuration
ZALO_OA_ID=433408824941888677
ZALO_ACCESS_TOKEN=qdXgyRVQ2gHdtOYdNT53
ZALO_SECRET_KEY=33M7kiqYXVXljIHS6vp7
```

**Lưu ý:** Thay thế bằng thông tin thực tế từ Zalo OA của bạn.

### 3. Restart Services

```bash
cd /media/tnt/01DBF4083BC73BB03/CODE/TradeSphere
sudo docker-compose restart fastapi
```

## 🧪 Test Cơ bản

### Option 1: Sử dụng Test Script (Khuyến nghị)

```bash
chmod +x test-zalo.sh
./test-zalo.sh
```

Script sẽ test:
- ✓ Health check
- ✓ Send message API
- ✓ Webhook processing
- ✓ Scam search
- ✓ Get followers
- ✓ AI chat

### Option 2: Test Thủ công với cURL

#### Test Send Message

```bash
curl -X POST http://localhost:8000/api/v1/zalo/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_ZALO_USER_ID",
    "message": "Xin chào! Test từ TradeSphere 🤖"
  }'
```

#### Test Webhook (Mock)

```bash
curl -X POST http://localhost:8000/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "user_send_text",
    "sender": {"id": "test_user_123"},
    "message": {"text": "0949654358"}
  }'
```

## 🌐 Setup Webhook với Ngrok

### 1. Cài đặt Ngrok

```bash
# Download ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Hoặc cài qua snap
sudo snap install ngrok
```

### 2. Khởi động Ngrok Tunnel

```bash
ngrok http 8000
```

Output sẽ hiển thị:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

Copy URL `https://abc123.ngrok.io`

### 3. Cấu hình Webhook trong Zalo OA Dashboard

1. Truy cập: https://oa.zalo.me/home
2. Chọn OA của bạn → **Settings** → **Webhook**
3. Điền thông tin:
   - **Webhook URL**: `https://abc123.ngrok.io/api/v1/zalo/webhook`
   - **Events**: Chọn tất cả events (user_send_text, follow, unfollow...)
4. Click **Verify** và **Save**

### 4. Test với Tin nhắn Thực

1. Mở app Zalo trên điện thoại
2. Tìm và Follow OA của bạn
3. Gửi tin nhắn test:
   - `0949654358` - Test tra cứu số điện thoại
   - `1234567890123` - Test tra cứu STK
   - `Tôi bị lừa đảo` - Test AI chat

## 📱 Các Tính năng Đã Implement

### 1. Auto-detect Phone/Bank Account

Khi user gửi tin nhắn:
- Hệ thống tự động phát hiện SĐT hoặc STK
- Tra cứu trong database scam
- Trả về kết quả với format đẹp

```
🚨 PHÁT HIỆN CẢNH BÁO

Từ khóa: 0949654358
Tổng số báo cáo: 5

📌 ADMIN.VN: 3 báo cáo
  • Nguyễn Văn A
    2024-12-20
  • Trần Thị B
    2024-12-18

⚠️ Cảnh báo: Có thể là lừa đảo!
💻 Chi tiết: https://tradesphere.com/search?q=0949654358
```

### 2. AI Chatbot Integration

User hỏi bất kỳ câu hỏi nào → AI trả lời

```
User: "Làm sao nhận biết lừa đảo?"
Bot: "Đây là một số dấu hiệu..."
```

### 3. Follow/Unfollow Events

- Khi user follow → Lưu vào database + Gửi welcome message
- Khi user unfollow → Cập nhật status

### 4. Get Followers List

```bash
curl http://localhost:8000/api/v1/zalo/followers?offset=0&count=10
```

## 🔍 API Endpoints

### POST /api/v1/zalo/webhook
Nhận webhook events từ Zalo OA

**Request:**
```json
{
  "event_name": "user_send_text",
  "sender": {"id": "user_zalo_id"},
  "message": {"text": "0949654358"}
}
```

**Response:**
```json
{
  "status": "processed",
  "message": "Webhook processed successfully"
}
```

### POST /api/v1/zalo/send
Gửi tin nhắn đến user

**Request:**
```json
{
  "user_id": "user_zalo_id",
  "message": "Hello from TradeSphere!"
}
```

**Response:**
```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "msg_123"
  }
}
```

### GET /api/v1/zalo/followers
Lấy danh sách followers

**Query params:**
- `offset`: Vị trí bắt đầu (default: 0)
- `count`: Số lượng (default: 50)

**Response:**
```json
{
  "error": 0,
  "data": {
    "total": 150,
    "followers": [
      {
        "user_id": "123",
        "display_name": "John Doe",
        "avatar": "https://..."
      }
    ]
  }
}
```

## 📊 Database Tracking

### Bảng: zalo_users
Lưu thông tin user đã follow OA

```sql
SELECT * FROM zalo_users LIMIT 5;
```

| id | zalo_user_id | display_name | followed_at | is_active |
|----|--------------|--------------|-------------|-----------|
| 1  | 12345        | John Doe     | 2024-12-25  | true      |

### Bảng: zalo_messages
Log tất cả tin nhắn trao đổi

```sql
SELECT * FROM zalo_messages 
WHERE zalo_user_id = '12345' 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Bảng: scam_searches
Log các lần tra cứu

```sql
SELECT keyword, source, results_count, search_time 
FROM scam_searches 
WHERE source = 'zalo' 
ORDER BY search_time DESC;
```

## 🔧 Troubleshooting

### Lỗi: "Invalid signature"

**Nguyên nhân:** Secret key không đúng hoặc webhook verification fail

**Giải pháp:**
1. Kiểm tra `ZALO_SECRET_KEY` trong `.env`
2. Tạm thời disable signature verification để test:
   ```python
   # File: fastapi-service/app/api/v1/endpoints/zalo.py
   # Comment out line:
   # if not zalo_service.verify_signature(body, x_zalo_signature):
   ```

### Lỗi: "Access token expired"

**Giải pháp:**
1. Truy cập Zalo OA Dashboard
2. Tạo access token mới
3. Cập nhật `ZALO_ACCESS_TOKEN` trong `.env`
4. Restart service

### Webhook không nhận được events

**Checklist:**
- [ ] Ngrok đang chạy
- [ ] Webhook URL đúng trong Zalo dashboard
- [ ] FastAPI service đang chạy (`docker-compose ps`)
- [ ] Check logs: `docker-compose logs -f fastapi`

### Test locally không có ngrok

Sử dụng mock webhook:
```bash
curl -X POST http://localhost:8000/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d @test-webhook-payload.json
```

## 📈 Monitoring & Logs

### Xem logs real-time

```bash
# All services
docker-compose logs -f

# Chỉ FastAPI
docker-compose logs -f fastapi | grep -i zalo
```

### Query database stats

```sql
-- Total Zalo users
SELECT COUNT(*) FROM zalo_users WHERE is_active = true;

-- Messages per day
SELECT DATE(sent_at) as date, COUNT(*) as messages
FROM zalo_messages
GROUP BY DATE(sent_at)
ORDER BY date DESC
LIMIT 7;

-- Top searched keywords from Zalo
SELECT keyword, COUNT(*) as search_count
FROM scam_searches
WHERE source = 'zalo'
GROUP BY keyword
ORDER BY search_count DESC
LIMIT 10;
```

## 🎯 Next Steps

### Phase 2: Advanced Features

1. **Rich Messages**
   - Buttons (Call-to-action)
   - List templates
   - Image attachments

2. **Broadcast Messages**
   - Daily scam alerts
   - New report notifications
   - Tips & tutorials

3. **User Preferences**
   - Language selection
   - Notification settings
   - Saved searches

4. **Analytics Dashboard**
   - User engagement metrics
   - Popular searches
   - Bot performance

### Sample Code: Send Rich Message

```python
# Example: Send message with buttons
await zalo_service.send_template_message(
    user_id="123",
    template_id="button_template",
    template_data={
        "text": "Bạn có muốn tra cứu thêm?",
        "buttons": [
            {
                "title": "Tra cứu số khác",
                "payload": "SEARCH_MORE",
                "type": "oa.open.url"
            },
            {
                "title": "Báo cáo lừa đảo",
                "payload": "REPORT_SCAM",
                "type": "oa.query.show"
            }
        ]
    }
)
```

## 📚 Resources

- [Zalo OA API Documentation](https://developers.zalo.me/docs/official-account)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Ngrok Documentation](https://ngrok.com/docs)
- [TradeSphere API Docs](http://localhost:8000/docs)

## 💡 Tips

1. **Test locally first** với mock data trước khi setup ngrok
2. **Use ngrok free tier** cho development
3. **Monitor logs** khi test với real data
4. **Backup database** trước khi test production
5. **Rate limiting**: Zalo có giới hạn API calls (check docs)

---

**Need help?** Check troubleshooting section hoặc create GitHub issue.

**Happy coding! 🚀**
