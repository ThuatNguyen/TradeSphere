# 📚 Tài liệu API Tìm kiếm Lừa đảo

## 🎯 Tổng quan

Hệ thống tìm kiếm lừa đảo crawl dữ liệu từ 3 nguồn chính:
1. **admin.vn** - Selenium scraping
2. **checkscam.vn** - Selenium scraping  
3. **chongluadao.vn** - API-based (không dùng Selenium)

---

## 📁 Cấu trúc mã nguồn

```
TradeSphere/
├── server/
│   ├── lib/
│   │   └── pythonClient.ts          # Node.js client gọi Python API
│   └── routes.ts                     # Express routes proxy đến Python
│
├── fastapi-service/                  # Python FastAPI Service
│   └── app/
│       ├── main.py                   # FastAPI app chính
│       ├── services/
│       │   └── crawler.py            # ⭐ MÃ NGUỒN CRAWLER CHÍNH
│       └── api/v1/endpoints/
│           └── scams.py              # ⭐ API ENDPOINTS
│
└── crawldata checkscam/              # Thư mục test crawler độc lập
    ├── main.py                       # Script test crawler
    └── test_all_sources.py           # Test tất cả nguồn
```

---

## 🔄 Luồng hoạt động (Flow)

### 1️⃣ **User gọi API từ frontend**
```
Frontend → POST /api/scams/search?keyword=0123456789
```

### 2️⃣ **Express Server (Node.js) proxy request**
File: `server/routes.ts`
```typescript
app.get("/api/scams/search", async (req, res) => {
  const keyword = req.query.keyword as string;
  const type = req.query.type as string;
  
  // Gọi Python API
  const result = await searchScams(keyword, type);
  
  // Lưu vào database
  await storage.createScamSearch({...});
  
  res.json(result);
});
```

### 3️⃣ **Python Client gửi request đến FastAPI**
File: `server/lib/pythonClient.ts`
```typescript
export async function searchScams(keyword: string, type?: string) {
  const response = await pythonAPI.get('/api/v1/scams/search', {
    params: { keyword, type },
  });
  return response.data;
}
```

### 4️⃣ **FastAPI xử lý request**
File: `fastapi-service/app/api/v1/endpoints/scams.py`
```python
@router.get("/search")
async def search_scams(keyword: str, type: Optional[str] = None):
    # 1. Check cache trước
    cached_result = await cache_service.get_scam_search(keyword, type)
    if cached_result:
        return cached_result  # Trả về luôn nếu có cache
    
    # 2. Nếu không có cache, crawl dữ liệu
    if type == "all":
        result = await crawler_service.search_all_sources(keyword)
    elif type == "admin":
        result = crawler_service.scrape_admin_vn(keyword, driver)
    # ...
    
    # 3. Cache kết quả
    await cache_service.set_scam_search(keyword, result, type)
    
    return result
```

### 5️⃣ **Crawler Service crawl dữ liệu**
File: `fastapi-service/app/services/crawler.py`

---

## 🕷️ Chi tiết Crawler

### A. **admin.vn Crawler**

**URL:** `https://admin.vn/scams?keyword={keyword}`

**Phương pháp:** Selenium + BeautifulSoup

**Code:**
```python
def scrape_admin_vn(self, keyword: str, driver: webdriver.Chrome):
    # 1. Truy cập trang web
    url = f"https://admin.vn/scams?keyword={keyword}"
    driver.get(url)
    
    # 2. Đợi page load
    wait = WebDriverWait(driver, timeout)
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "container")))
    
    # 3. Parse HTML với BeautifulSoup
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # 4. Tìm tổng số kết quả
    alert_div = soup.find('div', class_='alert alert-danger text-center')
    total_scams = strong_tags[0].text.strip()  # "50 tố cáo"
    
    # 5. Lấy danh sách scam cards
    scam_cards = soup.find_all('div', class_='scam-card')
    
    # 6. Parse từng card
    for card in scam_cards:
        columns = card.find_all('div', class_='scam-column')
        scam_list.append({
            'name': columns[0].text.strip(),
            'amount': columns[1].text.strip(),
            'phone': columns[2].text.strip(),
            'account_number': columns[3].text.strip(),
            'bank': columns[4].text.strip(),
            'views': columns[5].text.strip(),
            'date': columns[6].text.strip(),
            'detail_link': card.find('a')['href']
        })
    
    return {
        'success': True,
        'source': 'admin.vn',
        'total_scams': total_scams,
        'data': scam_list
    }
```

**HTML Structure admin.vn:**
```html
<div class="alert alert-danger text-center">
    Có <strong>50</strong> tố cáo liên quan đến <strong>0123456789</strong>
</div>

<div class="scam-card">
    <div class="scam-column">Nguyễn Văn A</div>    <!-- Name -->
    <div class="scam-column">5.000.000₫</div>       <!-- Amount -->
    <div class="scam-column">0123456789</div>       <!-- Phone -->
    <div class="scam-column">1234567890</div>       <!-- Account -->
    <div class="scam-column">Vietcombank</div>     <!-- Bank -->
    <div class="scam-column">150 lượt xem</div>    <!-- Views -->
    <div class="scam-column">23/12/2025</div>      <!-- Date -->
    <a href="/scam/123" class="stretched-link"></a>
</div>
```

---

### B. **checkscam.vn Crawler**

**URL:** `https://checkscam.vn/?qh_ss={keyword}`

**Phương pháp:** Selenium + BeautifulSoup

**Code:**
```python
def scrape_checkscam_vn(self, keyword: str, driver: webdriver.Chrome):
    # 1. Truy cập
    url = f"https://checkscam.vn/?qh_ss={keyword}"
    driver.get(url)
    
    # 2. Đợi load
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "pst")))
    
    # 3. Parse HTML
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # 4. Lấy tổng số
    h2_tag = soup.find('h2', class_='h1')
    # Text: 'Có 25 cảnh báo về "0123456789"'
    match = re.search(r'Có (\d+) cảnh báo', text)
    total_scams = match.group(1)
    
    # 5. Lấy danh sách
    ct_divs = soup.find_all('div', class_='ct')
    
    for ct in ct_divs:
        ct1 = ct.find('div', class_='ct1')  # Title
        ct2 = ct.find('div', class_='ct2')  # Metadata
        
        link = ct1.find('a')
        name = link.text.strip()
        detail_link = link['href']
        
        spans = ct2.find_all('span')
        # Parse date và views từ spans
        
        scam_list.append({
            'name': name,
            'date': date,
            'views': views,
            'detail_link': detail_link
        })
    
    return {...}
```

**HTML Structure checkscam.vn:**
```html
<h2 class="h1">Có 25 cảnh báo về "0123456789"</h2>

<div class="ct">
    <div class="ct1">
        <a href="/canh-bao-123">Lừa đảo qua Facebook</a>
    </div>
    <div class="ct2">
        <span>Lượt xem 150</span>
        <span>3 tháng trước</span>
    </div>
</div>
```

---

### C. **chongluadao.vn Crawler**

**URL:** `https://feeds.chongluadao.vn/checkmisc?q={keyword}`

**Phương pháp:** API call (không dùng Selenium)

**Code:**
```python
async def scrape_chongluadao_vn(self, keyword: str):
    # 1. Call API trực tiếp
    url = f"https://feeds.chongluadao.vn/checkmisc?q={keyword}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        data = response.json()
    
    # 2. Parse JSON response
    scam_list = []
    for item in data:
        source = item.get('source')      # 'scamvn' hoặc 'icallme'
        item_data = item.get('data')
        
        if source == 'scamvn':
            scam_list.append({
                'name': item_data.get('name'),
                'phone': item_data.get('phone'),
                'account': item_data.get('account'),
                'bank': item_data.get('bank'),
                'amount': item_data.get('amount'),
                'date': item_data.get('date'),
                'source': 'scamvn',
                'detail_link': item_data.get('link')
            })
        elif source == 'icallme':
            scam_list.append({
                'name': item_data.get('name'),
                'phone': item_data.get('phone'),
                'report_time': item_data.get('report_time'),
                'source': 'icallme',
                'detail_link': item_data.get('link')
            })
    
    return {...}
```

**API Response Format:**
```json
[
    {
        "source": "scamvn",
        "data": {
            "name": "Nguyễn Văn A",
            "phone": "0123456789",
            "account": "1234567890",
            "bank": "Vietcombank",
            "amount": "5.000.000",
            "date": "2025-12-23",
            "link": "https://..."
        }
    },
    {
        "source": "icallme",
        "data": {
            "name": "Spam caller",
            "phone": "0123456789",
            "report_time": "2025-12-23",
            "link": "https://..."
        }
    }
]
```

---

### D. **Search All Sources (Parallel)**

**Code:**
```python
async def search_all_sources(self, keyword: str):
    # 1. Chạy song song 3 crawlers
    loop = asyncio.get_event_loop()
    
    # Selenium crawlers chạy trong thread pool
    future_admin = loop.run_in_executor(
        self.executor, 
        self.scrape_admin_vn, 
        keyword, 
        self.init_driver()
    )
    
    future_checkscam = loop.run_in_executor(
        self.executor, 
        self.scrape_checkscam_vn, 
        keyword, 
        self.init_driver()
    )
    
    # Async crawler
    future_chongluadao = self.scrape_chongluadao_vn(keyword)
    
    # 2. Đợi tất cả hoàn thành
    results = await asyncio.gather(
        future_admin,
        future_checkscam,
        future_chongluadao,
        return_exceptions=True
    )
    
    # 3. Tổng hợp kết quả
    total_results = 0
    for result in results:
        if result.get('success'):
            total_results += int(result.get('total_scams', 0))
    
    return {
        'success': True,
        'keyword': keyword,
        'total_results': total_results,
        'sources': results  # Array gồm 3 sources
    }
```

---

## 🚀 API Endpoints

### 1. **Search All Sources**
```http
GET /api/v1/scams/search?keyword=0123456789&type=all
```

**Response:**
```json
{
    "success": true,
    "keyword": "0123456789",
    "total_results": 75,
    "cached": false,
    "response_time_ms": 3500,
    "sources": [
        {
            "success": true,
            "source": "admin.vn",
            "total_scams": "50",
            "data": [...]
        },
        {
            "success": true,
            "source": "checkscam.vn",
            "total_scams": "25",
            "data": [...]
        },
        {
            "success": true,
            "source": "chongluadao.vn",
            "total_scams": 0,
            "data": []
        }
    ]
}
```

### 2. **Search admin.vn Only**
```http
GET /api/v1/scams/search?keyword=0123456789&type=admin
```

### 3. **Search checkscam.vn Only**
```http
GET /api/v1/scams/search?keyword=0123456789&type=checkscam
```

### 4. **Search chongluadao.vn Only**
```http
GET /api/v1/scams/search?keyword=0123456789&type=chongluadao
```

---

## 💾 Caching Strategy

**Redis Cache:**
- Key format: `scam:search:{type}:{keyword}`
- TTL: 1 hour (configurable)
- Hit count tracking

**Code:**
```python
# Check cache trước
cached_result = await cache_service.get_scam_search(keyword, source_type)
if cached_result:
    cached_result["cached"] = True
    return cached_result

# Crawl và cache
result = await crawler_service.search_all_sources(keyword)
await cache_service.set_scam_search(keyword, result, source_type)
```

---

## 🔧 Configuration

File: `fastapi-service/app/config.py`

```python
SELENIUM_HEADLESS = True          # Chạy Chrome headless
SELENIUM_TIMEOUT = 10             # Timeout cho Selenium
REDIS_URL = "redis://localhost"   # Redis cache
CACHE_TTL = 3600                  # Cache 1 giờ
```

---

## 🧪 Testing

### Test riêng từng nguồn:
```bash
cd "crawldata checkscam"
python test_all_sources.py
```

### Test qua API:
```bash
# Start FastAPI service
cd fastapi-service
uvicorn app.main:app --reload --port 8000

# Test
curl "http://localhost:8000/api/v1/scams/search?keyword=0123456789"
```

---

## 📊 Database Logging

Mỗi search được log vào database:

**Table:** `scam_searches`
```sql
CREATE TABLE scam_searches (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    source TEXT,                 -- 'web' hoặc 'zalo'
    user_id INTEGER,
    zalo_user_id TEXT,
    results_count INTEGER,
    search_time TIMESTAMP DEFAULT NOW(),
    response_time_ms INTEGER
);
```

---

## 🎯 Các điểm quan trọng

### ✅ **Ưu điểm:**
1. **Parallel crawling** - Crawl 3 nguồn đồng thời → Nhanh hơn
2. **Redis caching** - Giảm tải, tăng tốc
3. **Thread pool** - Selenium không block async operations
4. **Error handling** - Mỗi source fail riêng không ảnh hưởng tổng thể
5. **Database logging** - Track usage và performance

### ⚠️ **Lưu ý:**
1. **Selenium dependencies** - Cần Chrome/Chromium và chromedriver
2. **Headless mode** - Để tránh mở browser khi production
3. **Timeout handling** - Cần set timeout hợp lý
4. **Rate limiting** - Cẩn thận khi crawl nhiều request
5. **HTML structure changes** - Web thay đổi có thể break crawler

---

## 🐛 Troubleshooting

### Selenium không chạy:
```bash
# Install Chrome
sudo apt install chromium-browser

# Install chromedriver
pip install webdriver-manager
```

### Redis connection error:
```bash
# Start Redis
redis-server

# Check connection
redis-cli ping
```

### Crawler timeout:
- Tăng `SELENIUM_TIMEOUT` trong config
- Kiểm tra network connection
- Test manual với browser

---

## 📚 Tham khảo

- **Selenium Docs:** https://selenium-python.readthedocs.io/
- **BeautifulSoup Docs:** https://www.crummy.com/software/BeautifulSoup/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **HTTPX Async Client:** https://www.python-httpx.org/

---

**Author:** TradeSphere Team  
**Last Updated:** December 23, 2025
