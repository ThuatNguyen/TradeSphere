# Kiến trúc Hệ thống Anti-Scam Platform

## Tổng quan

Hệ thống chống lừa đảo tích hợp 3 nền tảng:
- **Web App (React + Express)**: Trung tâm quản lý và giao diện chính
- **Python API (FastAPI)**: Crawl dữ liệu và xử lý AI
- **Zalo OA**: Kênh tiếp cận người dùng qua Zalo

## 1. Kiến trúc Tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                      Người dùng                              │
└────────┬─────────────────────────┬────────────────────────┬─┘
         │                         │                        │
    ┌────▼────┐              ┌─────▼──────┐        ┌───────▼────┐
    │  Web    │              │  Zalo OA   │        │ Mobile Web │
    │ Browser │              │  Webhook   │        │            │
    └────┬────┘              └─────┬──────┘        └───────┬────┘
         │                         │                       │
         └────────────┬────────────┴───────────────────────┘
                      │
         ┌────────────▼────────────┐
         │   NGINX Reverse Proxy   │
         │   (API Gateway Layer)   │
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼─────┐            ┌─────▼─────┐
    │ Express  │◄───────────┤  FastAPI  │
    │ Backend  │  HTTP API  │  Service  │
    │(Node.js) │            │ (Python)  │
    └────┬─────┘            └─────┬─────┘
         │                        │
    ┌────▼────────────────────────▼────┐
    │      PostgreSQL Database         │
    │  (Shared Data Layer - Drizzle)   │
    └──────────────────────────────────┘
```

## 2. Chi tiết các Thành phần

### 2.1 Web Application (React + Express)
**Port:** 5000 (production) / 5173 (dev)

**Chức năng:**
- Giao diện web chính
- Quản lý báo cáo lừa đảo
- Blog & tin tức
- Dashboard admin
- Chat AI với người dùng
- Hiển thị kết quả tra cứu

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Database ORM: Drizzle ORM
- UI: TailwindCSS + shadcn/ui

### 2.2 Python API Service (FastAPI)
**Port:** 8000

**Chức năng:**
- Crawl dữ liệu từ 3 nguồn:
  - admin.vn
  - checkscam.vn
  - chongluadao.vn
- Xử lý AI (NLP, phân tích ngữ nghĩa)
- Chatbot AI với LLM
- Cache kết quả tìm kiếm
- Xử lý background jobs

**Tech Stack:**
- Framework: **FastAPI** (khuyến nghị vì async, docs tự động, performance cao)
- Web Scraping: Selenium + BeautifulSoup
- AI/ML: OpenAI API / Google Gemini / Local LLM
- Cache: Redis
- Queue: Celery (cho background tasks)

### 2.3 Zalo OA Integration
**Port:** 8001 (webhook service)

**Chức năng:**
- Nhận tin nhắn từ Zalo OA
- Tra cứu số điện thoại/STK
- Chatbot AI qua Zalo
- Gửi cảnh báo, tips phòng chống lừa đảo
- Đẩy thông báo báo cáo mới

**Tech Stack:**
- Service: Node.js Express hoặc FastAPI
- Webhook handler
- Zalo Mini App SDK (tùy chọn)

### 2.4 Database (PostgreSQL)
**Shared Schema:**

```sql
-- Bảng chính từ TradeSphere (giữ nguyên)
- users              -- Người dùng đăng ký
- reports            -- Báo cáo lừa đảo
- blog_posts         -- Bài viết blog
- admins             -- Quản trị viên
- chat_sessions      -- Phiên chat
- chat_messages      -- Tin nhắn chat

-- Bảng mới cho tích hợp
- scam_searches      -- Lịch sử tìm kiếm
- scam_cache         -- Cache kết quả crawl
- zalo_users         -- Người dùng Zalo OA
- zalo_messages      -- Lịch sử tin nhắn Zalo
- notifications      -- Thông báo/cảnh báo
- api_logs           -- Log các request
```

## 3. Luồng Dữ liệu

### 3.1 Tra cứu Số Điện thoại/STK
```
User (Web/Zalo) → Express/FastAPI → Check Cache
                                    ↓ (Cache miss)
                              Python Service
                                    ↓
                      Crawl 3 nguồn (parallel)
                                    ↓
                            Aggregate & AI
                                    ↓
                          Save to Database
                                    ↓
                        Return to User
```

### 3.2 Chatbot AI
```
User Question → Express/Zalo Webhook
                    ↓
            FastAPI AI Service
                    ↓
        ┌───────────┴───────────┐
        │                       │
   Check DB          Query LLM (GPT/Gemini)
   (Context)                    │
        │                       │
        └───────────┬───────────┘
                    ↓
            Generate Response
                    ↓
            Save to History
                    ↓
            Return to User
```

### 3.3 Zalo OA Flow
```
Zalo User → Zalo Server → Webhook (Express/FastAPI)
                               ↓
                    Parse & Route Message
                               ↓
                    ┌──────────┴──────────┐
                    │                     │
              Check Scam           AI Chat
                    │                     │
            FastAPI Service      FastAPI AI
                    │                     │
                    └──────────┬──────────┘
                               ↓
                      Format Response
                               ↓
                    Zalo API (Reply)
                               ↓
                           Zalo User
```

## 4. API Architecture

### 4.1 Express Backend (Node.js)
**Base URL:** `/api`

**Endpoints:**
```
# Existing
POST   /api/reports              -- Tạo báo cáo mới
GET    /api/reports              -- Lấy danh sách báo cáo
GET    /api/reports/:id          -- Chi tiết báo cáo
GET    /api/blogs                -- Danh sách blog
POST   /api/chat                 -- Chat với AI

# New - Proxy to Python
GET    /api/scams/search         -- Tìm kiếm (proxy to Python)
POST   /api/scams/check          -- Kiểm tra nhanh
GET    /api/scams/history        -- Lịch sử tìm kiếm
```

### 4.2 FastAPI Service (Python)
**Base URL:** `http://localhost:8000`

**Endpoints:**
```
# Scam Search
GET    /api/v1/scams/search      -- Tìm kiếm trên 3 nguồn
GET    /api/v1/scams/admin       -- Tìm trên admin.vn
GET    /api/v1/scams/checkscam   -- Tìm trên checkscam.vn
GET    /api/v1/scams/chongluadao -- Tìm trên chongluadao.vn
GET    /api/v1/scams/detail      -- Chi tiết 1 báo cáo

# AI Services
POST   /api/v1/ai/chat           -- AI chatbot
POST   /api/v1/ai/analyze        -- Phân tích văn bản lừa đảo
POST   /api/v1/ai/predict        -- Dự đoán nguy cơ

# Cache Management
GET    /api/v1/cache/stats       -- Thống kê cache
DELETE /api/v1/cache/clear       -- Xóa cache

# Health Check
GET    /health                   -- Health check
GET    /metrics                  -- Prometheus metrics
```

### 4.3 Zalo OA Webhook
**Base URL:** `http://localhost:8001`

**Endpoints:**
```
POST   /zalo/webhook             -- Nhận webhook từ Zalo
GET    /zalo/oa-info             -- Thông tin OA
POST   /zalo/send                -- Gửi tin nhắn chủ động
POST   /zalo/broadcast           -- Gửi broadcast
GET    /zalo/followers           -- Danh sách follower
```

## 5. Công nghệ & Thư viện

### 5.1 Express Backend
```json
{
  "express": "^4.18.0",
  "drizzle-orm": "latest",
  "pg": "^8.11.0",
  "axios": "^1.6.0",         // Gọi Python API
  "socket.io": "^4.6.0",     // Real-time
  "express-rate-limit": "^6.0.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5"
}
```

### 5.2 FastAPI Service
```txt
fastapi==0.108.0
uvicorn[standard]==0.25.0
pydantic==2.5.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
selenium==4.16.0
beautifulsoup4==4.12.2
httpx==0.26.0
openai==1.6.1              # Hoặc google-generativeai
langchain==0.1.0           # Optional: LLM framework
python-jose[cryptography]  # JWT
passlib[bcrypt]            # Password hashing
```

### 5.3 Zalo OA Service
```json
{
  "zalojs": "^1.0.0",        // Zalo SDK (nếu có)
  "axios": "^1.6.0",
  "express": "^4.18.0"
}
```

## 6. Database Schema Extensions

```sql
-- Lịch sử tìm kiếm
CREATE TABLE scam_searches (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    source VARCHAR(50),           -- web, zalo
    user_id INTEGER,               -- NULL nếu anonymous
    zalo_user_id VARCHAR(100),
    results_count INTEGER,
    search_time TIMESTAMP DEFAULT NOW(),
    response_time_ms INTEGER,
    INDEX idx_keyword (keyword),
    INDEX idx_created (search_time)
);

-- Cache kết quả crawl
CREATE TABLE scam_cache (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    source VARCHAR(50),            -- admin, checkscam, chongluadao
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    UNIQUE(keyword, source)
);

-- Người dùng Zalo
CREATE TABLE zalo_users (
    id SERIAL PRIMARY KEY,
    zalo_user_id VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar VARCHAR(500),
    followed_at TIMESTAMP DEFAULT NOW(),
    last_interaction TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB
);

-- Tin nhắn Zalo
CREATE TABLE zalo_messages (
    id SERIAL PRIMARY KEY,
    zalo_user_id VARCHAR(100) NOT NULL,
    message_type VARCHAR(50),      -- text, image, sticker
    message_content TEXT,
    is_from_user BOOLEAN,
    sent_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user (zalo_user_id),
    INDEX idx_sent (sent_at)
);

-- Thông báo
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),              -- new_report, warning, tip
    title VARCHAR(255),
    content TEXT,
    target_channel VARCHAR(50),    -- web, zalo, all
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API Logs
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    service VARCHAR(50),           -- express, fastapi, zalo
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    user_agent TEXT,
    ip_address VARCHAR(45),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. Deployment Architecture

### 7.1 Development
```
Docker Compose Stack:
- Container 1: PostgreSQL (5432)
- Container 2: Redis (6379)
- Container 3: Express Backend (5000)
- Container 4: FastAPI Service (8000)
- Container 5: Zalo Webhook (8001)
- Container 6: Nginx (80, 443)
```

### 7.2 Production
```
VPS/Cloud:
├── Nginx (Reverse Proxy)
│   ├── SSL/TLS termination
│   ├── Rate limiting
│   ├── Load balancing
│   └── Static files
├── PM2 (Process Manager)
│   ├── Express (2-4 instances)
│   ├── FastAPI (Gunicorn + Uvicorn workers)
│   └── Zalo Webhook
├── PostgreSQL (Managed DB)
├── Redis (Cache & Queue)
└── Monitoring
    ├── Prometheus + Grafana
    └── ELK Stack (logs)
```

## 8. Security Considerations

1. **API Keys & Secrets**: Environment variables, không commit
2. **Rate Limiting**: Giới hạn request/IP
3. **Authentication**: JWT tokens, session management
4. **CORS**: Whitelist domains
5. **Input Validation**: Pydantic, Zod schemas
6. **SQL Injection**: ORM (Drizzle, SQLAlchemy)
7. **XSS Protection**: Content Security Policy
8. **HTTPS Only**: Force SSL in production
9. **Webhook Verification**: Zalo signature validation

## 9. Monitoring & Logging

```
Logs Structure:
├── Express: logs/express/*.log
├── FastAPI: logs/fastapi/*.log
├── Zalo: logs/zalo/*.log
├── Nginx: /var/log/nginx/
└── Combined: ELK Stack

Metrics:
- Request rate & latency
- Error rate by service
- Cache hit/miss ratio
- Database query performance
- Crawl success rate
- Zalo webhook delivery
```

## 10. Scaling Strategy

**Phase 1** (Current - 1K users/day):
- Single VPS
- Monolithic deployment
- Basic caching

**Phase 2** (10K users/day):
- Separate Python service
- Redis caching layer
- CDN for static assets

**Phase 3** (100K+ users/day):
- Microservices
- Load balancers
- Database replication
- Message queue (RabbitMQ/Kafka)
- Kubernetes orchestration

## 11. Next Steps

Xem file [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) cho kế hoạch triển khai chi tiết.
