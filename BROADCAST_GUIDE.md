# 📣 Hướng Dẫn Sử Dụng Broadcast Feature

## Tổng Quan

Hệ thống Broadcast cho phép admin gửi thông báo hàng loạt đến tất cả người dùng đang theo dõi Zalo OA của bạn.

## Tính Năng

✅ Tạo và quản lý broadcast campaigns  
✅ Gửi tin nhắn cho tất cả followers  
✅ Rate limiting tự động (1.5s/message = 40 msg/phút)  
✅ Retry logic khi gửi thất bại  
✅ Theo dõi thống kê chi tiết (success/failed)  
✅ Lưu lịch sử gửi vào database  
✅ UI admin thân thiện  

---

## 🚀 Deploy Lên VPS

### 1. Chạy Migration

```bash
# Từ máy local
bash deploy-broadcast.sh
```

Script sẽ tự động:
- Upload migration file
- Chạy migration trên database
- Update code Python
- Restart FastAPI service

### 2. Build & Deploy Frontend

```bash
cd client
npm run build

# Deploy dist folder lên VPS (via Docker hoặc manual)
```

---

## 📱 Sử Dụng Qua UI

### Truy cập Admin Panel

```
https://thuatnguyen.io.vn/admin/broadcast
```

### Tab "Tạo mới"

1. **Tiêu đề**: Đặt tên cho campaign (VD: "Cảnh báo lừa đảo tháng 12")
2. **Nội dung**: Viết nội dung tin nhắn (tối đa 2000 ký tự)
   ```
   🚨 CẢNH BÁO LỪA ĐẢO
   
   Gần đây xuất hiện nhiều trường hợp lừa đảo qua Zalo...
   
   ✅ CÁCH PHÒNG TRÁNH:
   • Không chuyển tiền cho người lạ
   • Xác minh thông tin
   
   Hãy cảnh giác! 🛡️
   ```
3. **Đối tượng**: Chọn "Tất cả người dùng"
4. Click **"Tạo Campaign"**

### Tab "Danh sách"

- Xem tất cả campaigns đã tạo
- Trạng thái: Draft, Sending, Completed, Failed
- Actions:
  - **Gửi ngay**: Gửi campaign ngay lập tức
  - **Xem chi tiết**: Xem thống kê
  - **Xóa**: Xóa campaign (chỉ draft/failed)

### Tab "Thống kê"

- Tổng số người dùng
- Số lượng gửi thành công/thất bại
- Tỷ lệ thành công (%)
- Danh sách user gửi thất bại với error message

---

## 🔧 Sử Dụng Qua API

### 1. Tạo Campaign

```bash
curl -X POST "https://thuatnguyen.io.vn/api/v1/zalo/broadcast/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cảnh báo lừa đảo",
    "content": "🚨 CẢNH BÁO...",
    "target": "all"
  }'
```

Response:
```json
{
  "id": 1,
  "title": "Cảnh báo lừa đảo",
  "status": "draft",
  "total_users": 0,
  ...
}
```

### 2. Gửi Campaign

```bash
curl -X POST "https://thuatnguyen.io.vn/api/v1/zalo/broadcast/1/send" \
  -H "Content-Type: application/json" \
  -d '{"send_now": true}'
```

Response:
```json
{
  "message": "Broadcast started",
  "campaign_id": 1,
  "status": "sending"
}
```

### 3. Xem Thống Kê

```bash
curl "https://thuatnguyen.io.vn/api/v1/zalo/broadcast/1/stats"
```

Response:
```json
{
  "campaign_id": 1,
  "status": "completed",
  "total_users": 121,
  "success_count": 118,
  "failed_count": 3,
  "success_rate": 97.52,
  "failed_users": [
    {"user_id": "123", "error": "User blocked OA"}
  ]
}
```

### 4. Lấy Danh Sách Campaigns

```bash
curl "https://thuatnguyen.io.vn/api/v1/zalo/broadcast/campaigns?status=completed"
```

---

## 📝 Best Practices

### Nội Dung Tin Nhắn

✅ **NÊN:**
- Ngắn gọn, súc tích (< 1000 ký tự)
- Có emoji để thu hút (🚨 ✅ 📱 💰)
- Có call-to-action rõ ràng
- Chia thành đoạn để dễ đọc
- Có chữ ký (tên OA)

❌ **KHÔNG NÊN:**
- Quá dài (> 2000 ký tự)
- Toàn chữ in hoa
- Nhiều link (spam)
- Nội dung quảng cáo
- Gửi quá thường xuyên

### Thời Gian Gửi

- **Giờ tốt nhất**: 9h-11h, 14h-16h, 19h-21h
- **Tránh**: Sáng sớm (< 8h), khuya (> 22h)
- **Tần suất**: Tối đa 1-2 lần/tuần

### Rate Limiting

- Mặc định: **1.5 giây/message** (40 msg/phút)
- 121 followers → mất ~3 phút để gửi hết
- Zalo có thể block nếu gửi quá nhanh

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Token Expiration

- Access token hết hạn sau 24h
- Cron job tự động refresh mỗi 23h
- Nếu token hết hạn: broadcast sẽ fail

### 2. User Actions

- User có thể **unfollow** nếu spam
- User có thể **block OA**
- Gửi failed → kiểm tra logs để biết lý do

### 3. Pháp Lý

- Chỉ gửi nội dung hữu ích, liên quan
- Không spam, không quảng cáo lố
- Tuân thủ quy định của Zalo

---

## 🔍 Troubleshooting

### Campaign status "sending" quá lâu

```bash
# Check FastAPI logs
ssh root@103.130.218.214 'docker-compose -f /home/root/tradesphere/docker-compose.prod.yml logs -f fastapi'
```

### Nhiều message gửi failed

- Kiểm tra access token còn hạn không
- Xem error message trong stats
- User có thể đã unfollow/block OA

### Database migration failed

```bash
# Manual run migration
ssh root@103.130.218.214
cd /home/root/tradesphere
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d tradesphere

# Copy paste nội dung migrations/add_broadcast_tables.sql
```

---

## 📊 Ví Dụ Template

### Template 1: Cảnh Báo Lừa Đảo

```
🚨 CẢNH BÁO LỪA ĐẢO

Gần đây xuất hiện nhiều trường hợp lừa đảo qua tin nhắn Zalo với thủ đoạn:

📱 Mạo danh cán bộ công an, ngân hàng
💰 Yêu cầu chuyển tiền khẩn cấp
🎁 Trúng thưởng giả mạo
🔗 Link lừa đảo đánh cắp tài khoản

✅ CÁCH PHÒNG TRÁNH:
• KHÔNG chuyển tiền cho người lạ
• Xác minh thông tin qua kênh chính thức
• Tra cứu SĐT/STK tại: https://thuatnguyen.io.vn
• Nhắn tin cho OA này để kiểm tra

Hãy cảnh giác và bảo vệ bản thân! 🛡️

---
Công an xã Cam Hồng - Quảng Trị
```

### Template 2: Hướng Dẫn Sử Dụng

```
📚 HƯỚNG DẪN SỬ DỤNG OA

Chào bạn! Đây là những gì tôi có thể giúp:

🔍 TRA CỨU:
• Gửi số điện thoại để kiểm tra lừa đảo
• Gửi số tài khoản để tra cứu
• Gửi nội dung tin nhắn để phân tích

💬 TƯ VẤN:
• Hỏi về cách phòng chống lừa đảo
• Chat với AI để được hỗ trợ

📱 VÍ DỤ:
"0928710278"
"1234567890"
"help"

Gửi tin nhắn bất kỳ để bắt đầu!
```

---

## 📞 Support

Nếu cần hỗ trợ:
1. Check logs trên VPS
2. Xem API docs: https://thuatnguyen.io.vn/docs
3. Review code trong `fastapi-service/app/api/v1/endpoints/zalo.py`
