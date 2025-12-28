# AUTO-CHECK ENHANCEMENT - COMPLETE GUIDE

## Overview
This enhancement adds automatic scam checking for phone numbers, bank accounts, and URLs sent to the Zalo OA. When users send any of these types of data, the bot automatically searches internal database and checkscam APIs, then returns results with a link to the web interface for detailed information.

## Features Implemented

### 1. URL Detection
- New function: `is_url(text: str) -> bool`
- Detects various URL formats:
  - Full URLs: `https://example.com`
  - WWW URLs: `www.example.com`
  - Domain only: `example.com`
- Regex pattern matches common TLDs: .com, .vn, .org, .net, .io, .me, .edu, .gov

### 2. Smart Keyword Extraction
- New function: `extract_searchable_keyword(text: str, type: str) -> str`
- Extracts clean searchable terms:
  - **Phone**: Removes spaces, dashes, dots → `0123456789`
  - **Account**: Returns cleaned number → `1234567890`
  - **URL**: Extracts domain only → `example.com`

### 3. Enhanced Response Format
- Modified: `format_scam_results_for_zalo(results: dict, keyword: str) -> str`
- Now includes checkscam link in all responses:
  - Format: `https://thuatnguyen.io.vn/scam-search?keyword={keyword}`
  - Added to both "no results" and "has results" messages
  - Provides direct link for users to view detailed information

### 4. Updated Message Handler
- Modified: `handle_text_message(data: dict, db: Session)`
- Enhanced detection logic:
  1. Check for help command → Show usage guide
  2. Check for phone number → Auto-check with link
  3. Check for bank account → Auto-check with link
  4. Check for URL → Auto-check with link
  5. Otherwise → AI chat response
- All auto-checks now include keyword parameter for link generation

## Code Changes

### File: `fastapi-service/app/api/v1/endpoints/zalo.py`

#### Added Functions (Lines 38-53)
```python
def is_url(text: str) -> bool:
    """Check if text contains a URL"""
    url_pattern = r'https?://[^\s]+|www\.[^\s]+|[^\s]+\.(com|vn|org|net|io|me|edu|gov)[^\s]*'
    return bool(re.search(url_pattern, text, re.IGNORECASE))

def extract_searchable_keyword(text: str, type: str) -> str:
    """Extract clean searchable keyword from text"""
    if type == "phone":
        return re.sub(r'[\s\-\.]', '', text.strip())
    elif type == "account":
        return text.strip()
    elif type == "url":
        # Extract domain from URL
        url_match = re.search(r'(?:https?://)?(?:www\.)?([^\s/]+)', text, re.IGNORECASE)
        return url_match.group(1) if url_match else text.strip()
    return text.strip()
```

#### Modified Function (Lines 54-116)
```python
async def format_scam_results_for_zalo(results: dict, keyword: str = "") -> str:
    """Format search results for Zalo message with checkscam link"""
    
    # Generate checkscam link
    checkscam_link = f"https://thuatnguyen.io.vn/scam-search?keyword={keyword}"
    
    if results.get("total_results", 0) == 0:
        return f"""✅ KHÔNG TÌM THẤY CẢNH BÁO

Từ khóa: {keyword}
Trạng thái: Chưa có báo cáo lừa đảo

⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
Luôn cẩn thận khi giao dịch tiền bạc!

🔍 Xem chi tiết: {checkscam_link}
💡 Gửi tin nhắn để tôi tư vấn thêm."""
    
    # ... rest of the function with link included
```

#### Updated Message Handler (Lines 191-227)
```python
async def handle_text_message(data: dict, db: Session):
    """Handle text message from user"""
    # ... existing code ...
    
    if message_text.lower() in ["/help", "help", "hướng dẫn"]:
        # Updated help text with URL checking
        
    elif is_phone_number(message_text):
        keyword = extract_searchable_keyword(message_text, "phone")
        search_result = await crawler_service.search_all_sources(keyword)
        response_text = await format_scam_results_for_zalo(search_result, keyword)
        
    elif is_bank_account(message_text):
        keyword = extract_searchable_keyword(message_text, "account")
        search_result = await crawler_service.search_all_sources(keyword)
        response_text = await format_scam_results_for_zalo(search_result, keyword)
        
    elif is_url(message_text):
        keyword = extract_searchable_keyword(message_text, "url")
        search_result = await crawler_service.search_all_sources(keyword)
        response_text = await format_scam_results_for_zalo(search_result, keyword)
        
    else:
        # AI chat for other messages
```

## Usage Examples

### Example 1: Phone Number Check
**User sends:** `0123456789` or `0123-456-789`

**Bot response:**
```
✅ KHÔNG TÌM THẤY CẢNH BÁO

Từ khóa: 0123456789
Trạng thái: Chưa có báo cáo lừa đảo

⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
Luôn cẩn thận khi giao dịch tiền bạc!

🔍 Xem chi tiết: https://thuatnguyen.io.vn/scam-search?keyword=0123456789
💡 Gửi tin nhắn để tôi tư vấn thêm.
```

### Example 2: Bank Account Check
**User sends:** `1234567890`

**Bot response:**
```
🚨 PHÁT HIỆN CẢNH BÁO

Từ khóa: 1234567890
Tổng số báo cáo: 5

📱 Nguồn: Internal Database
   Báo cáo: 3 kết quả
   Chi tiết: Có 3 báo cáo lừa đảo từ người dùng

🔍 Xem chi tiết: https://thuatnguyen.io.vn/scam-search?keyword=1234567890
⚠️ Cẩn thận! Đã có cảnh báo về đối tượng này.
```

### Example 3: URL Check
**User sends:** `https://suspicious-site.com` or `www.suspicious-site.com` or `suspicious-site.com`

**Bot extracts domain:** `suspicious-site.com`

**Bot response:**
```
✅ KHÔNG TÌM THẤY CẢNH BÁO

Từ khóa: suspicious-site.com
Trạng thái: Chưa có báo cáo lừa đảo

⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
Luôn cẩn thận khi giao dịch tiền bạc!

🔍 Xem chi tiết: https://thuatnguyen.io.vn/scam-search?keyword=suspicious-site.com
💡 Gửi tin nhắn để tôi tư vấn thêm.
```

### Example 4: Help Command
**User sends:** `/help` or `help` or `hướng dẫn`

**Bot response:**
```
🤖 HƯỚNG DẪN SỬ DỤNG

Gửi cho tôi:
📱 Số điện thoại - Kiểm tra SĐT lừa đảo
💳 Số tài khoản - Kiểm tra STK ngân hàng
🔗 Link website - Kiểm tra trang web lừa đảo
💬 Tin nhắn/Email - Phân tích nội dung
❓ Câu hỏi - Tư vấn phòng chống lừa đảo

Ví dụ:
- 0123456789
- 1234567890
- https://example.com
- "Bạn đã trúng thưởng 100 triệu..."

Gõ /help để xem hướng dẫn này.
```

## Deployment

### Option 1: Automated Deployment Script

```bash
# Make script executable
chmod +x deploy-auto-check-enhancement.sh

# Run deployment
./deploy-auto-check-enhancement.sh
```

The script will:
1. Upload modified `zalo.py` to VPS
2. Restart FastAPI service
3. Test webhook endpoint
4. Display testing instructions

### Option 2: Manual Deployment

```bash
# 1. Upload modified file
scp fastapi-service/app/api/v1/endpoints/zalo.py \
    root@103.130.218.214:/root/tradesphere/fastapi-service/app/api/v1/endpoints/

# 2. SSH to VPS
ssh root@103.130.218.214

# 3. Restart FastAPI service
cd /root/tradesphere
docker-compose restart fastapi

# 4. Check logs
docker-compose logs -f fastapi

# 5. Test webhook
curl https://thuatnguyen.io.vn/api/v1/zalo/webhook
```

## Testing

### Local Testing

1. Start services:
```bash
cd /media/tnt/01DBF4083BC73BB04/CODE/TradeSphere
docker-compose up -d
```

2. Test functions in Python:
```python
from fastapi_service.app.api.v1.endpoints.zalo import is_url, extract_searchable_keyword

# Test URL detection
print(is_url("https://example.com"))  # True
print(is_url("www.example.com"))      # True
print(is_url("example.com"))          # True
print(is_url("0123456789"))           # False

# Test keyword extraction
print(extract_searchable_keyword("0123-456-789", "phone"))     # "0123456789"
print(extract_searchable_keyword("https://example.com", "url"))  # "example.com"
print(extract_searchable_keyword("www.test.vn", "url"))         # "test.vn"
```

### Production Testing

1. Send test messages to Zalo OA (OA ID: 4458948772777913063)
2. Verify bot responses include checkscam links
3. Click links to verify they work correctly
4. Check database logs:
```bash
# SSH to VPS
ssh root@103.130.218.214

# Check recent messages
docker-compose exec postgres psql -U postgres -d tradesphere -c \
  "SELECT * FROM zalo_messages ORDER BY created_at DESC LIMIT 10;"
```

## Monitoring

### Check Logs
```bash
# FastAPI logs
docker-compose logs -f fastapi | grep -E "handle_text_message|format_scam_results"

# All services logs
docker-compose logs -f
```

### Database Queries
```sql
-- Check recent Zalo messages
SELECT 
    zalo_user_id,
    message_content,
    is_from_user,
    created_at
FROM zalo_messages 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check message patterns
SELECT 
    CASE 
        WHEN message_content ~ '^[0-9]{10}$' THEN 'phone'
        WHEN message_content ~ '^[0-9]{6,16}$' THEN 'account'
        WHEN message_content ~ 'https?://' THEN 'url'
        ELSE 'other'
    END as message_type,
    COUNT(*) as count
FROM zalo_messages 
WHERE is_from_user = true 
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY message_type;
```

## Benefits

### 1. Improved User Experience
- Instant scam checking without navigating to website
- Direct link to detailed results
- Clear formatting with emojis

### 2. Increased Engagement
- Users can easily share results (copy link)
- Encourages web traffic to checkscam site
- Better conversion from OA to website users

### 3. Better Coverage
- Now handles URLs in addition to phone/account
- Smart domain extraction from various URL formats
- Consistent experience across all check types

### 4. SEO & Traffic
- Each check generates potential website visit
- Branded links increase recognition
- Better tracking of user behavior

## Technical Notes

### URL Detection Regex
```regex
https?://[^\s]+|www\.[^\s]+|[^\s]+\.(com|vn|org|net|io|me|edu|gov)[^\s]*
```
- Matches: `https://`, `http://`, `www.`, or domain with common TLDs
- Case-insensitive
- Stops at whitespace

### Domain Extraction Regex
```regex
(?:https?://)?(?:www\.)?([^\s/]+)
```
- Optional protocol
- Optional www
- Captures domain until space or slash

### Link Format
```
https://thuatnguyen.io.vn/scam-search?keyword={keyword}
```
- Uses query parameter for compatibility
- Frontend can parse and display results
- Easy to track in analytics

## Troubleshooting

### Issue: Bot not detecting URLs
**Solution:** Check URL format, ensure it matches regex pattern

### Issue: Wrong keyword extracted
**Solution:** Verify `extract_searchable_keyword()` logic for URL type

### Issue: Link not working
**Solution:** Ensure frontend `/scam-search` route exists and handles `keyword` parameter

### Issue: No response from bot
**Solution:** Check FastAPI logs, verify Zalo token is valid

## Future Enhancements

### Possible Improvements
1. Add email address detection
2. Support international phone formats
3. Extract multiple keywords from one message
4. Show preview card instead of text link
5. Add click tracking for generated links
6. A/B test different link formats

### Integration Ideas
1. Send analytics event when link is generated
2. Track conversion rate (link clicks)
3. Personalize links with user ID for tracking
4. Generate shortened URLs for cleaner look

## Summary

This enhancement significantly improves the Zalo OA's capability by:
- ✅ Auto-detecting phone numbers, bank accounts, and URLs
- ✅ Smart keyword extraction for optimal search
- ✅ Including checkscam website links in all responses
- ✅ Providing clear, actionable information to users
- ✅ Driving traffic to the main website

The implementation maintains clean code, follows existing patterns, and provides a foundation for future enhancements.
