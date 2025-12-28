# 🤖 Setup OpenAI API cho AI Chat

## ⚠️ Hiện Tại

Webhook đã hoạt động nhưng AI chat bị lỗi:
```
Lỗi AI service: Error code: 401 - Incorrect API key provided
```

## 🔧 Fix Bằng Cách Thêm OpenAI API Key

### Option 1: Sử Dụng OpenAI (Khuyến Nghị)

**Bước 1: Lấy OpenAI API Key**

1. Truy cập: https://platform.openai.com/api-keys
2. Đăng ký/đăng nhập OpenAI account
3. Nhấn **Create new secret key**
4. Sao chép key (dạng: `sk-xxxxxxxxxxxxxxxxxxxxx`)

**Bước 2: Cấu Hình VPS**

```bash
# SSH vào VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# Edit .env
cd /root/tradesphere
nano .env
```

**Thêm dòng này:**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

**Bước 3: Restart FastAPI**

```bash
docker-compose -f docker-compose.prod.yml restart fastapi
```

**Bước 4: Test AI Chat**

```bash
curl -X POST https://thuatnguyen.io.vn/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "user_send_text",
    "sender": {"id": "test_123"},
    "message": {"text": "Làm sao để tránh bị lừa đảo?"}
  }'
```

### Option 2: Disable AI Chat (Tạm Thời)

Nếu không muốn dùng AI, có thể disable tạm thời:

**File:** `fastapi-service/app/api/v1/endpoints/zalo.py`

Comment dòng AI response:

```python
# Line ~150
# response_text = await ai_service.generate_scam_advice(user_message)
response_text = "Xin chào! Tôi là bot hỗ trợ kiểm tra lừa đảo. Vui lòng gửi số điện thoại hoặc số tài khoản để kiểm tra."
```

## ✅ Tính Năng Đang Hoạt Động

Ngay cả khi chưa có OpenAI API key, các tính năng sau vẫn hoạt động:

1. ✅ **Scam Search** - Tìm kiếm số điện thoại/tài khoản ngân hàng
2. ✅ **Database Logging** - Lưu lịch sử chat
3. ✅ **Webhook Events** - Follow/unfollow users
4. ✅ **Send Messages** - Gửi tin nhắn chủ động

## 🧪 Test Scam Search (Không Cần AI)

```bash
# Test với số điện thoại
curl -X POST https://thuatnguyen.io.vn/api/v1/zalo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "user_send_text",
    "sender": {"id": "test_123"},
    "message": {"text": "0909123456"}
  }'

# Kết quả:
# ✅ KHÔNG TÌM THẤY CẢNH BÁO
# Số/tài khoản "0909123456" chưa có báo cáo lừa đảo...
```

## 💰 Chi Phí OpenAI API

- **Mô hình**: GPT-3.5-turbo (~$0.002 / 1K tokens)
- **Ước tính**: 100 tin nhắn/ngày ≈ $0.05/ngày ≈ $1.5/tháng
- **Free tier**: $5 credit cho account mới

## 🔄 Alternative: Use Free AI

Nếu không muốn trả phí, có thể thay OpenAI bằng:

1. **Gemini API** (Google) - Free tier: 60 requests/minute
2. **Hugging Face** - Free models
3. **Ollama** - Local AI models

## 📊 Kiểm Tra Logs

```bash
# Xem logs realtime
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214
docker logs tradesphere-fastapi -f

# Filter AI errors
docker logs tradesphere-fastapi | grep -i "ai service"

# Check database
docker exec -it tradesphere-postgres psql -U tradesphere -d tradesphere
SELECT * FROM zalo_messages ORDER BY sent_at DESC LIMIT 5;
\q
```

## ✅ Summary

**ĐANG HOẠT ĐỘNG:**
- ✅ Webhook nhận tin nhắn
- ✅ Scam search với số điện thoại/tài khoản
- ✅ Database logging
- ✅ Follow/unfollow events

**CẦN CONFIG:**
- ❌ AI chat (cần OpenAI API key)

**NEXT STEPS:**
1. Lấy OpenAI API key
2. Thêm vào `.env` file
3. Restart FastAPI service
4. Test lại AI chat

---

**Webhook URL:** https://thuatnguyen.io.vn/api/v1/zalo/webhook  
**Status:** 🟢 Active (Scam search works, AI pending)
