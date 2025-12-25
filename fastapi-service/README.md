# FastAPI Service - Quick Start Guide

## 📋 Cài đặt

### 1. Chuẩn bị môi trường

```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere/fastapi-service
```

### 2. Tạo virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
```

### 3. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 4. Cấu hình môi trường

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/tradesphere
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=your_openai_api_key
ZALO_ACCESS_TOKEN=your_zalo_token
```

### 5. Chạy service

```bash
# Development mode (auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🐳 Sử dụng Docker

### Chạy toàn bộ stack

```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere

# Copy và cấu hình environment
cp .env.docker .env
# Chỉnh sửa .env với API keys của bạn

# Khởi động services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down

# Dừng và xóa volumes
docker-compose down -v
```

### Services sẽ chạy trên:
- **Express**: http://localhost:5000
- **FastAPI**: http://localhost:8000
- **FastAPI Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Nginx**: http://localhost:80

## 📚 API Documentation

### Tự động sinh docs
Truy cập: http://localhost:8000/docs

### API Endpoints

#### 1. Scam Search
```bash
# Tìm kiếm trên tất cả nguồn
GET /api/v1/scams/search?keyword=0123456789

# Tìm kiếm trên một nguồn cụ thể
GET /api/v1/scams/search?keyword=0123456789&type=admin
GET /api/v1/scams/admin?keyword=0123456789
GET /api/v1/scams/checkscam?keyword=0123456789
GET /api/v1/scams/chongluadao?keyword=0123456789
```

#### 2. AI Services
```bash
# Chat với AI
POST /api/v1/ai/chat
Body: {
  "message": "Làm sao để nhận biết lừa đảo?",
  "session_id": "optional-session-id",
  "context": []
}

# Phân tích văn bản
POST /api/v1/ai/analyze
Body: {
  "text": "Bạn đã trúng giải 100 triệu, chuyển 5 triệu phí..."
}
```

#### 3. Zalo OA
```bash
# Webhook (được gọi tự động từ Zalo)
POST /api/v1/zalo/webhook

# Gửi tin nhắn (admin/testing)
POST /api/v1/zalo/send
Body: {
  "user_id": "zalo_user_id",
  "message": "Hello from API"
}

# Lấy danh sách followers
GET /api/v1/zalo/followers?offset=0&count=50
```

#### 4. Cache Management
```bash
# Thống kê cache
GET /api/v1/cache/stats

# Xóa cache
DELETE /api/v1/cache/clear?pattern=scam:search:*
```

#### 5. Health Check
```bash
GET /health
```

## 🧪 Testing

### Test với curl

```bash
# Health check
curl http://localhost:8000/health

# Tìm kiếm scam
curl "http://localhost:8000/api/v1/scams/search?keyword=0123456789"

# Chat AI
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Cách nhận biết lừa đảo qua tin nhắn?"}'

# Phân tích văn bản
curl -X POST http://localhost:8000/api/v1/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Chuyển tiền ngay để nhận giải thưởng!"}'
```

### Test với Python

```python
import httpx
import asyncio

async def test_api():
    async with httpx.AsyncClient() as client:
        # Search
        response = await client.get(
            "http://localhost:8000/api/v1/scams/search",
            params={"keyword": "0123456789"}
        )
        print(response.json())
        
        # AI Chat
        response = await client.post(
            "http://localhost:8000/api/v1/ai/chat",
            json={"message": "Làm sao phát hiện lừa đảo?"}
        )
        print(response.json())

asyncio.run(test_api())
```

## 🔧 Troubleshooting

### Selenium không chạy
```bash
# Cài đặt Chrome và ChromeDriver
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Hoặc sử dụng webdriver-manager (đã có trong requirements.txt)
```

### Redis connection error
```bash
# Kiểm tra Redis đang chạy
redis-cli ping
# Nếu không, khởi động Redis
sudo service redis-server start
```

### PostgreSQL connection error
```bash
# Kiểm tra PostgreSQL đang chạy
sudo service postgresql status
# Tạo database
psql -U postgres -c "CREATE DATABASE tradesphere;"
```

### OpenAI API error
- Kiểm tra API key trong `.env`
- Kiểm tra credit OpenAI
- Hoặc sử dụng Google Gemini (free tier)

## 📊 Database Migrations

### Tạo migration mới (Alembic)

```bash
# Init (lần đầu)
alembic init alembic

# Tạo migration
alembic revision --autogenerate -m "Add new tables"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Hoặc tạo tables trực tiếp (development)

Tables sẽ tự động được tạo khi khởi động app (xem `app/main.py:lifespan`)

## 🚀 Deployment

### PM2 (Production)

```bash
# Cài đặt PM2
npm install -g pm2

# Tạo ecosystem file
pm2 ecosystem

# Chỉnh sửa ecosystem.config.js
# Sau đó start
pm2 start ecosystem.config.js

# Xem logs
pm2 logs

# Monitor
pm2 monit
```

### Gunicorn + Uvicorn Workers

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Nginx Configuration

Đã có sẵn trong `nginx.conf`. Deploy bằng:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/tradesphere
sudo ln -s /etc/nginx/sites-available/tradesphere /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | PostgreSQL connection string | - | ✅ |
| REDIS_URL | Redis connection string | redis://localhost:6379/0 | ✅ |
| OPENAI_API_KEY | OpenAI API key | - | ⚠️ |
| ZALO_ACCESS_TOKEN | Zalo OA access token | - | For Zalo |
| ZALO_SECRET_KEY | Zalo webhook secret | - | For Zalo |
| ENVIRONMENT | dev/production | development | ❌ |
| DEBUG | Enable debug mode | True | ❌ |
| ALLOWED_ORIGINS | CORS origins | localhost | ❌ |

## 🔐 Security Notes

1. **API Keys**: Không commit `.env` vào git
2. **Database**: Sử dụng strong password trong production
3. **CORS**: Giới hạn origins trong production
4. **Rate Limiting**: Đã có sẵn, có thể điều chỉnh trong code
5. **Webhook Signature**: Uncomment verification trong production

## 📞 Support

- **Issues**: Tạo issue trên GitHub
- **Email**: support@tradesphere.com
- **Docs**: http://localhost:8000/docs

## 📄 License

MIT License - see LICENSE file
