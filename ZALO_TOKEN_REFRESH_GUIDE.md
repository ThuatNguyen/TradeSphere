# Hướng dẫn Auto Refresh Zalo Access Token

## 📋 Tổng quan

Zalo Access Token hết hạn sau **25 giờ**. Bạn cần refresh token trước khi hết hạn.

## 🔧 Các cách refresh token:

### 1. Manual - Dùng Bash script (Nhanh)

```bash
bash /tmp/refresh_zalo_token.sh
```

Nhập refresh token khi được hỏi.

---

### 2. Manual - Dùng Python script (Tự động update .env)

```bash
python3 fastapi-service/app/scripts/refresh_zalo_token.py YOUR_REFRESH_TOKEN
```

Hoặc chạy interactive:
```bash
python3 fastapi-service/app/scripts/refresh_zalo_token.py
# Nhập refresh token khi được hỏi
```

---

### 3. Manual - Dùng curl trực tiếp

```bash
curl -X POST "https://oauth.zaloapp.com/v4/oa/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "secret_key: 33M7kiqYXVXljIHS6vp7" \
  -d "app_id=548847842150265811" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "grant_type=refresh_token" | jq '.'
```

---

## 🤖 Setup Auto Refresh (Khuyên dùng)

### Bước 1: Lưu refresh token lần đầu

Sau khi lấy được access token và refresh token lần đầu:

```bash
# Trên VPS
echo "YOUR_REFRESH_TOKEN" > /root/tradesphere/.zalo_refresh_token
chmod 600 /root/tradesphere/.zalo_refresh_token
```

### Bước 2: Upload script lên VPS

```bash
# Từ máy local
rsync -avz -e "ssh -i ~/.ssh/id_ed25519" \
  refresh_zalo_token_cron.sh \
  root@103.130.218.214:/root/tradesphere/
```

### Bước 3: Cho phép thực thi

```bash
# Trên VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214 \
  "chmod +x /root/tradesphere/refresh_zalo_token_cron.sh"
```

### Bước 4: Setup Cron job (chạy mỗi 24 giờ)

```bash
# Trên VPS
ssh -i ~/.ssh/id_ed25519 root@103.130.218.214

# Thêm cron job
crontab -e

# Thêm dòng này (chạy lúc 3:00 AM mỗi ngày):
0 3 * * * /root/tradesphere/refresh_zalo_token_cron.sh >> /var/log/zalo_refresh.log 2>&1
```

### Bước 5: Test script

```bash
# Test chạy script
/root/tradesphere/refresh_zalo_token_cron.sh

# Xem log
tail -f /var/log/zalo_refresh.log
```

---

## 📝 Response Format

**Success:**
```json
{
  "access_token": "new_access_token_here",
  "refresh_token": "new_refresh_token_here",
  "expires_in": 90000
}
```

**Error:**
```json
{
  "error": -14xxx,
  "error_name": "Invalid refresh token",
  "error_description": "..."
}
```

---

## ⚠️ Lưu ý quan trọng:

1. **Lưu Refresh Token mới:** Mỗi lần refresh, bạn nhận được refresh token MỚI. Phải lưu token mới này để dùng cho lần sau!

2. **Refresh trước khi hết hạn:** Token hết hạn sau 25 giờ, nên refresh sau 24 giờ để an toàn.

3. **Token chỉ dùng 1 lần:** Mỗi refresh token chỉ dùng được 1 lần. Sau đó phải dùng refresh token mới.

4. **Backup refresh token:** Lưu refresh token ở nơi an toàn. Nếu mất, phải làm lại flow OAuth từ đầu.

---

## 🔍 Troubleshooting

### Error: Invalid refresh token
- Refresh token đã hết hạn hoặc đã dùng rồi
- Giải pháp: Làm lại OAuth flow để lấy token mới

### Error: Invalid app_id
- App ID sai
- Kiểm tra lại App ID trong Zalo Developer Console

### Container không restart
- Kiểm tra docker-compose.prod.yml có đúng path không
- Chạy manual: `docker-compose -f docker-compose.prod.yml restart fastapi`

---

## 📚 Tham khảo

- Zalo OA API Documentation: https://developers.zalo.me/docs/official-account
- OAuth2 Flow: https://developers.zalo.me/docs/official-account/bat-dau/xac-thuc-va-uy-quyen-cho-ung-dung-new
