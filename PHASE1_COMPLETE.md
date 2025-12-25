# Hướng dẫn Triển khai Phase 1

## ✅ Hoàn thành

Đã hoàn thành Phase 1 với các thành phần:

### 1. ✅ Cấu trúc FastAPI Project
```
fastapi-service/
├── app/
│   ├── main.py              # Entry point
│   ├── config.py            # Settings
│   ├── database.py          # PostgreSQL
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── scams.py     # Crawl endpoints
│   │   │   ├── ai.py        # AI services
│   │   │   ├── zalo.py      # Zalo webhook
│   │   │   └── cache.py     # Cache management
│   │   └── api.py
│   └── services/
│       ├── crawler.py       # Selenium crawlers
│       ├── ai_service.py    # OpenAI integration
│       ├── zalo_service.py  # Zalo OA API
│       └── cache.py         # Redis cache
├── requirements.txt
├── Dockerfile
└── .env.example
```

### 2. ✅ Migrate Flask → FastAPI
- Đã port toàn bộ crawler code
- Async/await cho better performance
- Auto-generated docs tại `/docs`
- Type safety với Pydantic

### 3. ✅ Database Schema Extensions
**Đã thêm vào `shared/schema.ts`:**
- `scamSearches` - Lịch sử tìm kiếm
- `scamCache` - Cache kết quả
- `zaloUsers` - Người dùng Zalo OA
- `zaloMessages` - Tin nhắn Zalo
- `notifications` - Thông báo hệ thống
- `apiLogs` - Logs API calls

### 4. ✅ Express API Client
File: `server/lib/pythonClient.ts`

Các functions có sẵn:
- `searchScams(keyword, type?)`
- `chatWithAI(message, sessionId?, context?)`
- `analyzeText(text)`
- `getCacheStats()`
- `clearCache(pattern?)`

### 5. ✅ Docker Compose
File: `docker-compose.yml`

Services:
- PostgreSQL (port 5432)
- Redis (port 6379)
- FastAPI (port 8000)
- Express (port 5000)
- Nginx (port 80)

### 6. ✅ Zalo Webhook Handler
File: `fastapi-service/app/api/v1/endpoints/zalo.py`

Features:
- Webhook endpoint
- Text message handling
- Auto phone/bank account detection
- AI chat fallback
- Follow/unfollow events

## 🚀 Bắt đầu sử dụng

### Option 1: Docker (Khuyến nghị)

```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere

# 1. Cấu hình environment
cp .env.docker .env
nano .env  # Thêm API keys

# 2. Khởi động services
docker-compose up -d

# 3. Xem logs
docker-compose logs -f fastapi

# 4. Kiểm tra health
curl http://localhost:8000/health
```

### Option 2: Local Development

#### Terminal 1: PostgreSQL & Redis
```bash
# Start PostgreSQL
sudo service postgresql start

# Start Redis
redis-server
```

#### Terminal 2: FastAPI
```bash
cd fastapi-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Chỉnh sửa .env với API keys

uvicorn app.main:app --reload --port 8000
```

#### Terminal 3: Express
```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere
npm install
npm run dev
```

## 📝 Các bước tiếp theo

### 1. Generate Database Migrations

```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere

# Generate migration từ schema mới
npm run db:generate

# Apply migration
npm run db:migrate
```

### 2. Cập nhật Express Routes

Thêm vào `server/routes.ts`:

```typescript
import { searchScams, chatWithAI, analyzeText } from './lib/pythonClient';

// Proxy scam search to Python
app.get("/api/scams/search", async (req, res) => {
  try {
    const { keyword, type } = req.query;
    const result = await searchScams(keyword as string, type as string);
    
    // Log to database
    await db.insert(scamSearches).values({
      keyword: keyword as string,
      source: 'web',
      resultsCount: result.total_results,
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI chat endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const result = await chatWithAI(message, sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Cập nhật Frontend (React)

Tạo hook mới: `client/src/hooks/use-scam-search.ts`

```typescript
import { useState } from 'react';

export function useScamSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  async function search(keyword: string, type?: string) {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ keyword });
      if (type) params.append('type', type);
      
      const response = await fetch(`/api/scams/search?${params}`);
      const data = await response.json();
      
      setResults(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { search, loading, results, error };
}
```

### 4. Test Zalo Webhook

#### Development: Sử dụng ngrok

```bash
# Terminal mới
ngrok http 8000

# Copy URL, ví dụ: https://abc123.ngrok.io
# Webhook URL: https://abc123.ngrok.io/api/v1/zalo/webhook
```

#### Cấu hình trong Zalo OA:
1. Truy cập: https://oa.zalo.me/
2. Chọn OA của bạn → Cài đặt → Webhook
3. URL: `https://abc123.ngrok.io/api/v1/zalo/webhook`
4. Verify

### 5. Test APIs

```bash
# Test FastAPI health
curl http://localhost:8000/health

# Test scam search
curl "http://localhost:8000/api/v1/scams/search?keyword=0123456789"

# Test AI chat
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Làm sao nhận biết lừa đảo?"}'

# Test Express proxy
curl http://localhost:5000/api/scams/search?keyword=0123456789
```

## 🔧 Troubleshooting

### Database Migration Error
```bash
# Reset database (development only)
npm run db:push

# Hoặc manual
psql -U postgres -d tradesphere -f reset.sql
```

### Selenium Error
```bash
# Cài đặt Chrome
sudo apt-get install google-chrome-stable

# Test Selenium
python3 -c "from selenium import webdriver; driver = webdriver.Chrome(); print('OK')"
```

### Redis Connection Error
```bash
# Kiểm tra Redis
redis-cli ping

# Nếu không chạy
sudo service redis-server start

# Hoặc dùng Docker
docker run -d -p 6379:6379 redis:alpine
```

### CORS Error
Thêm vào `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
```

## 📊 Monitoring

### Check Service Status
```bash
# Docker
docker-compose ps

# Logs
docker-compose logs -f

# Specific service
docker-compose logs -f fastapi
```

### API Metrics
- FastAPI Docs: http://localhost:8000/docs
- Express: http://localhost:5000
- Health: http://localhost:8000/health

## 🎯 Next Steps - Phase 2

1. ✅ **Integration Testing**
   - Test Express ↔ FastAPI communication
   - Test Zalo webhook flow
   - Load testing

2. ✅ **UI Updates**
   - Add scam search page
   - Integrate AI chatbot
   - Display results from 3 sources

3. ✅ **Zalo OA Features**
   - Daily tips broadcast
   - New report notifications
   - User analytics

4. ✅ **Performance Optimization**
   - Cache tuning
   - Database indexes
   - Query optimization

## 📚 Documentation

- [FastAPI README](fastapi-service/README.md) - Chi tiết FastAPI service
- [ARCHITECTURE.md](ARCHITECTURE.md) - Kiến trúc hệ thống
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Kế hoạch triển khai

## 🤝 Contributing

1. Fork repo
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit PR

---

**Status**: ✅ Phase 1 Complete - Ready for Integration Testing

**Next**: Begin Phase 2 - Zalo OA Integration & Testing
