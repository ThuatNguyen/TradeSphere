# Kế hoạch Triển khai - Anti-Scam Platform

## Timeline Tổng thể: 4-6 tuần

---

## PHASE 1: Chuẩn bị & Tích hợp cơ bản (Tuần 1-2)

### Sprint 1.1: Setup FastAPI Service (3-4 ngày)

#### Task 1.1.1: Migrate Flask → FastAPI
- [ ] Tạo cấu trúc dự án FastAPI mới
  ```
  fastapi-service/
  ├── app/
  │   ├── __init__.py
  │   ├── main.py              # Entry point
  │   ├── config.py            # Settings
  │   ├── database.py          # PostgreSQL connection
  │   ├── models/              # SQLAlchemy models
  │   ├── schemas/             # Pydantic schemas
  │   ├── api/
  │   │   ├── v1/
  │   │   │   ├── endpoints/
  │   │   │   │   ├── scams.py      # Crawl endpoints
  │   │   │   │   ├── ai.py         # AI endpoints
  │   │   │   │   └── cache.py      # Cache management
  │   │   │   └── api.py
  │   ├── services/
  │   │   ├── crawler.py       # Selenium crawlers
  │   │   ├── ai_service.py    # AI/LLM service
  │   │   └── cache_service.py # Redis cache
  │   └── utils/
  │       ├── security.py
  │       └── helpers.py
  ├── tests/
  ├── requirements.txt
  ├── Dockerfile
  └── .env.example
  ```

- [ ] Port code crawl từ Flask sang FastAPI
  - Async functions cho better performance
  - Dependency injection
  - Auto-generated OpenAPI docs

- [ ] Thêm PostgreSQL integration
  - SQLAlchemy models matching Drizzle schema
  - Connection pooling
  - Migration scripts (Alembic)

- [ ] Setup Redis caching
  - Cache crawl results (TTL: 1 hour)
  - Rate limiting với Redis
  - Session storage

**Deliverable:**
- FastAPI service chạy được với endpoints crawl
- API docs tại `http://localhost:8000/docs`

---

#### Task 1.1.2: Extend Database Schema
- [ ] Thêm các bảng mới vào Drizzle schema
  ```typescript
  // shared/schema.ts
  
  export const scamSearches = pgTable("scam_searches", {
    id: serial("id").primaryKey(),
    keyword: text("keyword").notNull(),
    source: text("source"), // 'web' | 'zalo'
    userId: integer("user_id"),
    zaloUserId: text("zalo_user_id"),
    resultsCount: integer("results_count"),
    searchTime: timestamp("search_time").defaultNow(),
    responseTimeMs: integer("response_time_ms"),
  });

  export const scamCache = pgTable("scam_cache", {
    id: serial("id").primaryKey(),
    keyword: text("keyword").notNull(),
    source: text("source").notNull(),
    data: text("data").notNull(), // JSON string
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
    hitCount: integer("hit_count").default(0),
  });

  export const zaloUsers = pgTable("zalo_users", {
    id: serial("id").primaryKey(),
    zaloUserId: text("zalo_user_id").unique().notNull(),
    displayName: text("display_name"),
    avatar: text("avatar"),
    followedAt: timestamp("followed_at").defaultNow(),
    lastInteraction: timestamp("last_interaction"),
    isActive: boolean("is_active").default(true),
    preferences: text("preferences"), // JSON
  });

  export const zaloMessages = pgTable("zalo_messages", {
    id: serial("id").primaryKey(),
    zaloUserId: text("zalo_user_id").notNull(),
    messageType: text("message_type"),
    messageContent: text("message_content"),
    isFromUser: boolean("is_from_user"),
    sentAt: timestamp("sent_at").defaultNow(),
  });

  export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    type: text("type"),
    title: text("title"),
    content: text("content"),
    targetChannel: text("target_channel"),
    status: text("status").default("pending"),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
  });

  export const apiLogs = pgTable("api_logs", {
    id: serial("id").primaryKey(),
    service: text("service"),
    endpoint: text("endpoint"),
    method: text("method"),
    statusCode: integer("status_code"),
    responseTimeMs: integer("response_time_ms"),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
  });
  ```

- [ ] Generate migrations
  ```bash
  npm run db:generate
  npm run db:migrate
  ```

- [ ] Tạo tương đương SQLAlchemy models cho FastAPI

**Deliverable:**
- Database schema đầy đủ cho cả 3 services
- Migrations applied successfully

---

#### Task 1.1.3: Express ↔ FastAPI Integration
- [ ] Tạo API client trong Express
  ```typescript
  // server/lib/pythonClient.ts
  import axios from 'axios';
  
  const pythonAPI = axios.create({
    baseURL: process.env.PYTHON_API_URL || 'http://localhost:8000',
    timeout: 30000,
    headers: {
      'X-API-Key': process.env.PYTHON_API_KEY,
    },
  });

  export async function searchScams(keyword: string, type?: string) {
    const response = await pythonAPI.get('/api/v1/scams/search', {
      params: { keyword, type },
    });
    return response.data;
  }

  export async function analyzeText(text: string) {
    const response = await pythonAPI.post('/api/v1/ai/analyze', { text });
    return response.data;
  }

  export async function chatWithAI(message: string, sessionId: string) {
    const response = await pythonAPI.post('/api/v1/ai/chat', {
      message,
      session_id: sessionId,
    });
    return response.data;
  }
  ```

- [ ] Thêm proxy endpoints trong Express routes
  ```typescript
  // server/routes.ts
  
  // Scam search (proxy to Python)
  app.get("/api/scams/search", async (req, res) => {
    try {
      const { keyword, type } = req.query;
      
      // Log search
      await db.insert(scamSearches).values({
        keyword: keyword as string,
        source: 'web',
        userId: req.user?.id,
      });

      // Call Python API
      const result = await searchScams(keyword as string, type as string);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // AI Chat (proxy to Python)
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const result = await chatWithAI(message, sessionId);
      
      // Save to database
      await db.insert(chatMessages).values({
        sessionId,
        message: result.response,
        isUser: false,
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Chat failed' });
    }
  });
  ```

- [ ] Thêm error handling & retry logic
- [ ] Circuit breaker pattern (optional)

**Deliverable:**
- Express có thể gọi FastAPI endpoints
- Error handling robust
- Logging đầy đủ

---

### Sprint 1.2: AI Integration (3-4 ngày)

#### Task 1.2.1: Setup AI Service
- [ ] Chọn AI provider:
  - **Option 1**: OpenAI GPT-4 (paid, best quality)
  - **Option 2**: Google Gemini (free tier available)
  - **Option 3**: Local LLM (Ollama + Llama2/Mistral)

- [ ] Implement AI service trong FastAPI
  ```python
  # app/services/ai_service.py
  from openai import AsyncOpenAI
  import asyncio

  class AIService:
      def __init__(self):
          self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
          
      async def chat(self, message: str, context: list = None):
          """AI chatbot"""
          messages = [
              {"role": "system", "content": ANTI_SCAM_PROMPT},
          ]
          
          if context:
              messages.extend(context)
              
          messages.append({"role": "user", "content": message})
          
          response = await self.client.chat.completions.create(
              model="gpt-4-turbo-preview",
              messages=messages,
              temperature=0.7,
              max_tokens=500,
          )
          
          return response.choices[0].message.content
      
      async def analyze_scam_text(self, text: str):
          """Phân tích văn bản có dấu hiệu lừa đảo"""
          prompt = f"""
          Phân tích đoạn văn bản sau và xác định xem có dấu hiệu lừa đảo không:
          
          {text}
          
          Trả về JSON với format:
          {{
            "is_scam": true/false,
            "confidence": 0-100,
            "indicators": ["dấu hiệu 1", "dấu hiệu 2"],
            "explanation": "giải thích chi tiết"
          }}
          """
          
          response = await self.client.chat.completions.create(
              model="gpt-4-turbo-preview",
              messages=[{"role": "user", "content": prompt}],
              response_format={ "type": "json_object" }
          )
          
          return json.loads(response.choices[0].message.content)
      
      async def predict_risk(self, phone: str, bank_account: str, 
                             amount: int, description: str):
          """Dự đoán mức độ nguy hiểm"""
          # Combine crawl data + AI analysis
          pass
  ```

- [ ] Tạo prompt templates cho các use cases
  ```python
  # app/prompts.py
  
  ANTI_SCAM_PROMPT = """
  Bạn là trợ lý AI chuyên về phòng chống lừa đảo tại Việt Nam.
  
  Nhiệm vụ:
  - Tư vấn cách nhận biết lừa đảo
  - Phân tích thông tin nghi ngờ
  - Đưa ra cảnh báo và khuyến nghị
  
  Phong cách:
  - Thân thiện, dễ hiểu
  - Cụ thể, có ví dụ minh họa
  - Luôn khuyến khích người dùng cảnh giác
  
  Khi người dùng hỏi về số điện thoại/STK, bạn sẽ tìm kiếm trong database 
  và kết hợp phân tích AI để đưa ra đánh giá.
  """
  
  ANALYZE_SCAM_PROMPT = """
  Phân tích văn bản sau để xác định khả năng lừa đảo.
  
  Các dấu hiệu thường gặp:
  - Yêu cầu chuyển tiền gấp
  - Mạo danh cơ quan chức năng
  - Hứa hẹn lợi nhuận cao, nhanh chóng
  - Đe dọa, gây áp lực tâm lý
  - Lỗi chính tả, ngữ pháp
  - Link rút gọn đáng ngờ
  
  Văn bản: {text}
  """
  ```

**Deliverable:**
- AI service working với OpenAI/Gemini
- Chat API endpoint functional
- Analyze API endpoint functional

---

#### Task 1.2.2: Enhance Chatbox UI
- [ ] Update chatbox component với AI
  ```typescript
  // client/src/components/chatbox.tsx
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAIEnabled, setIsAIEnabled] = useState(true);

  async function sendMessage(text: string) {
    // Add user message
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    // Call AI API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: sessionStorage.getItem('chatSessionId'),
      }),
    });
    
    const data = await response.json();
    
    // Add AI response
    const aiMsg = { 
      role: 'assistant', 
      content: data.response, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, aiMsg]);
  }
  ```

- [ ] Thêm features:
  - Quick actions (Check số ĐT, Check STK)
  - File upload (screenshot)
  - Voice input (optional)
  - Typing indicator
  - Message reactions

**Deliverable:**
- Chatbox tích hợp AI hoàn chỉnh
- UX smooth và responsive

---

## PHASE 2: Zalo OA Integration (Tuần 3)

### Sprint 2.1: Zalo OA Setup (2-3 ngày)

#### Task 2.1.1: Đăng ký & Cấu hình Zalo OA
- [ ] Đăng ký Zalo Official Account
  - Truy cập: https://oa.zalo.me/
  - Tạo OA (loại: Tổ chức/Doanh nghiệp)
  - Xác thực danh tính

- [ ] Cấu hình OA
  - Thông tin cơ bản (tên, avatar, mô tả)
  - Kích hoạt tính năng webhook
  - Lấy credentials (OA ID, Secret Key, Access Token)

- [ ] Đọc docs
  - Zalo OA API: https://developers.zalo.me/docs/official-account
  - Webhook events
  - Message types

**Deliverable:**
- Zalo OA đã được tạo và xác thực
- Credentials đầy đủ

---

#### Task 2.1.2: Implement Webhook Service
- [ ] Chọn approach:
  - **Option 1**: Separate Express service (port 8001)
  - **Option 2**: Integrate vào FastAPI (recommended)

- [ ] Tạo webhook handler
  ```python
  # app/api/v1/endpoints/zalo.py
  from fastapi import APIRouter, Header, Request
  import hmac
  import hashlib

  router = APIRouter()

  @router.post("/webhook")
  async def zalo_webhook(
      request: Request,
      x_zalo_signature: str = Header(None)
  ):
      """Nhận webhook từ Zalo"""
      body = await request.body()
      
      # Verify signature
      if not verify_zalo_signature(body, x_zalo_signature):
          raise HTTPException(status_code=401, detail="Invalid signature")
      
      data = await request.json()
      event_type = data.get("event_name")
      
      if event_type == "user_send_text":
          await handle_text_message(data)
      elif event_type == "user_send_image":
          await handle_image_message(data)
      elif event_type == "follow":
          await handle_follow(data)
      elif event_type == "unfollow":
          await handle_unfollow(data)
      
      return {"status": "ok"}

  async def handle_text_message(data: dict):
      """Xử lý tin nhắn text"""
      user_id = data["sender"]["id"]
      message = data["message"]["text"]
      
      # Save to database
      await save_zalo_message(user_id, message, is_from_user=True)
      
      # Process message
      if is_phone_number(message):
          response = await search_scam_for_zalo(message)
      elif is_bank_account(message):
          response = await search_scam_for_zalo(message)
      else:
          # AI chat
          response = await ai_service.chat(message, context=[])
      
      # Reply to user
      await send_zalo_message(user_id, response)
      
      # Save response
      await save_zalo_message(user_id, response, is_from_user=False)
  ```

- [ ] Implement Zalo API client
  ```python
  # app/services/zalo_service.py
  import httpx
  from typing import Dict, Any

  class ZaloService:
      def __init__(self):
          self.access_token = settings.ZALO_ACCESS_TOKEN
          self.base_url = "https://openapi.zalo.me/v2.0/oa"
      
      async def send_text_message(self, user_id: str, text: str):
          """Gửi tin nhắn text"""
          async with httpx.AsyncClient() as client:
              response = await client.post(
                  f"{self.base_url}/message",
                  headers={
                      "access_token": self.access_token,
                      "Content-Type": "application/json",
                  },
                  json={
                      "recipient": {"user_id": user_id},
                      "message": {"text": text}
                  }
              )
              return response.json()
      
      async def send_template_message(self, user_id: str, template: Dict):
          """Gửi tin nhắn template (buttons, list)"""
          # Implementation
          pass
      
      async def send_broadcast(self, message: str, target_users: list = None):
          """Gửi broadcast tới nhiều user"""
          # Implementation
          pass
      
      async def get_follower_list(self, offset: int = 0, count: int = 50):
          """Lấy danh sách follower"""
          async with httpx.AsyncClient() as client:
              response = await client.get(
                  f"{self.base_url}/getfollowers",
                  headers={"access_token": self.access_token},
                  params={"offset": offset, "count": count}
              )
              return response.json()
  ```

**Deliverable:**
- Webhook service chạy được
- Nhận và xử lý messages từ Zalo
- Reply messages thành công

---

#### Task 2.1.3: Expose Webhook Publicly
- [ ] Setup ngrok cho development
  ```bash
  ngrok http 8000
  # Lấy URL: https://abc123.ngrok.io
  ```

- [ ] Cấu hình webhook URL trong Zalo OA
  - URL: `https://abc123.ngrok.io/api/v1/zalo/webhook`
  - Verify webhook

- [ ] Production: Setup domain & SSL
  - Domain: `api.yourdomain.com`
  - Nginx reverse proxy
  - Let's Encrypt SSL

**Deliverable:**
- Webhook URL accessible publicly
- Zalo có thể gửi events tới server

---

### Sprint 2.2: Zalo OA Features (2-3 ngày)

#### Task 2.2.1: Tra cứu qua Zalo
- [ ] Implement quick search commands
  ```
  User gửi: 0123456789
  Bot trả: [Đang kiểm tra số điện thoại...]
           [Kết quả từ 3 nguồn]
           
  User gửi: 123456789 (STK)
  Bot trả: [Đang kiểm tra số tài khoản...]
  
  User gửi: /help
  Bot trả: [Danh sách lệnh]
  ```

- [ ] Format responses cho Zalo
  ```python
  def format_scam_results_for_zalo(results: dict) -> str:
      """Format kết quả cho Zalo message"""
      if results["total_results"] == 0:
          return """
  ✅ KHÔNG TÌM THẤY CẢNH BÁO
  
  Số/tài khoản này chưa có báo cáo lừa đảo.
  
  ⚠️ Lưu ý: Không có báo cáo ≠ An toàn 100%
  Luôn cẩn thận khi giao dịch!
  """
      
      message = f"""
  🚨 PHÁT HIỆN CẢNH BÁO
  
  Từ khóa: {results['keyword']}
  Tổng số báo cáo: {results['total_results']}
  
  """
      
      for source in results["sources"]:
          if source["total_scams"] > 0:
              message += f"\n📌 {source['source'].upper()}:\n"
              for item in source["data"][:2]:  # Limit 2 per source
                  message += f"  • {item['name']}\n"
                  message += f"    {item.get('date', 'N/A')}\n"
      
      message += "\n⚠️ Cảnh báo: Có thể là lừa đảo!"
      message += "\n💻 Xem chi tiết: https://tradesphere.com/search?q=" + results['keyword']
      
      return message
  ```

**Deliverable:**
- Tra cứu số ĐT/STK qua Zalo working
- Response format đẹp, dễ đọc

---

#### Task 2.2.2: AI Chat qua Zalo
- [ ] Integrate AI service với Zalo messages
- [ ] Context management (lưu lịch sử chat)
- [ ] Thêm quick replies
  ```python
  # Quick reply buttons
  QUICK_REPLIES = [
      {"title": "Kiểm tra SĐT", "payload": "CHECK_PHONE"},
      {"title": "Kiểm tra STK", "payload": "CHECK_BANK"},
      {"title": "Mẹo phòng chống", "payload": "TIPS"},
      {"title": "Báo cáo lừa đảo", "payload": "REPORT"},
  ]
  ```

**Deliverable:**
- AI chat working trên Zalo
- Natural conversation flow

---

#### Task 2.2.3: Notification System
- [ ] Implement broadcast notifications
  ```python
  # Send daily tips
  @scheduler.scheduled_job('cron', hour=9)
  async def send_daily_tip():
      tip = get_random_scam_prevention_tip()
      followers = await zalo_service.get_all_followers()
      
      for follower in followers:
          await zalo_service.send_text_message(
              follower["user_id"],
              f"💡 Mẹo hôm nay:\n\n{tip}"
          )
  ```

- [ ] New report alerts
  ```python
  async def on_new_report_created(report: Report):
      """Gửi alert khi có báo cáo mới hot"""
      if report.amount > 10_000_000:  # > 10 triệu
          message = f"""
  🚨 CẢNH BÁO MỚI
  
  Số điện thoại: {report.phone_number}
  Số tiền: {report.amount:,} VNĐ
  Ngân hàng: {report.bank}
  
  ⚠️ Cẩn thận với số này!
  """
          await zalo_service.send_broadcast(message)
  ```

**Deliverable:**
- Notification system working
- Scheduled broadcasts
- Event-triggered alerts

---

## PHASE 3: Polish & Optimization (Tuần 4)

### Sprint 3.1: Performance & Caching (2-3 ngày)

#### Task 3.1.1: Redis Caching Layer
- [ ] Implement caching strategy
  ```python
  # app/services/cache_service.py
  from redis import asyncio as aioredis
  import json

  class CacheService:
      def __init__(self):
          self.redis = aioredis.from_url(
              settings.REDIS_URL,
              encoding="utf-8",
              decode_responses=True
          )
      
      async def get_scam_search(self, keyword: str) -> dict | None:
          """Get cached search result"""
          key = f"scam:search:{keyword}"
          data = await self.redis.get(key)
          return json.loads(data) if data else None
      
      async def set_scam_search(self, keyword: str, data: dict, ttl: int = 3600):
          """Cache search result"""
          key = f"scam:search:{keyword}"
          await self.redis.setex(key, ttl, json.dumps(data, ensure_ascii=False))
      
      async def get_or_fetch(self, keyword: str, fetch_func):
          """Cache-aside pattern"""
          cached = await self.get_scam_search(keyword)
          if cached:
              return cached
          
          # Fetch from source
          data = await fetch_func(keyword)
          await self.set_scam_search(keyword, data)
          return data
  ```

- [ ] Database query optimization
  - Indexes on frequently queried columns
  - Connection pooling
  - Query result caching

**Deliverable:**
- Redis caching functional
- Response time < 500ms for cached queries
- Cache hit ratio > 70%

---

#### Task 3.1.2: Rate Limiting & Security
- [ ] Implement rate limiting
  ```python
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address
  from slowapi.errors import RateLimitExceeded

  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter
  app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

  @app.get("/api/v1/scams/search")
  @limiter.limit("10/minute")  # 10 requests per minute
  async def search_scams(request: Request, keyword: str):
      # Implementation
      pass
  ```

- [ ] Add API key authentication
- [ ] Input validation & sanitization
- [ ] SQL injection prevention
- [ ] XSS protection

**Deliverable:**
- Rate limiting active
- Security measures implemented
- No critical vulnerabilities

---

### Sprint 3.2: Monitoring & DevOps (2-3 ngày)

#### Task 3.2.1: Logging & Monitoring
- [ ] Setup structured logging
  ```python
  import logging
  from pythonjsonlogger import jsonlogger

  logger = logging.getLogger()
  logHandler = logging.StreamHandler()
  formatter = jsonlogger.JsonFormatter()
  logHandler.setFormatter(formatter)
  logger.addHandler(logHandler)
  ```

- [ ] Add Prometheus metrics
  ```python
  from prometheus_client import Counter, Histogram, generate_latest

  http_requests_total = Counter(
      'http_requests_total',
      'Total HTTP requests',
      ['method', 'endpoint', 'status']
  )

  http_request_duration_seconds = Histogram(
      'http_request_duration_seconds',
      'HTTP request latency',
      ['method', 'endpoint']
  )
  ```

- [ ] Setup health checks
  ```python
  @app.get("/health")
  async def health_check():
      return {
          "status": "healthy",
          "database": await check_db_connection(),
          "redis": await check_redis_connection(),
          "selenium": check_selenium_driver(),
      }
  ```

**Deliverable:**
- Comprehensive logging
- Metrics endpoint `/metrics`
- Health check endpoint `/health`

---

#### Task 3.2.2: Docker & Deployment
- [ ] Create Dockerfiles
  ```dockerfile
  # fastapi-service/Dockerfile
  FROM python:3.11-slim

  WORKDIR /app

  # Install Chrome for Selenium
  RUN apt-get update && apt-get install -y \
      wget \
      gnupg \
      unzip \
      && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
      && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
      && apt-get update && apt-get install -y google-chrome-stable \
      && rm -rf /var/lib/apt/lists/*

  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt

  COPY . .

  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

- [ ] Docker Compose for full stack
  ```yaml
  # docker-compose.yml
  version: '3.8'

  services:
    postgres:
      image: postgres:15
      environment:
        POSTGRES_DB: tradesphere
        POSTGRES_USER: user
        POSTGRES_PASSWORD: password
      volumes:
        - postgres_data:/var/lib/postgresql/data
      ports:
        - "5432:5432"

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"

    fastapi:
      build: ./fastapi-service
      environment:
        DATABASE_URL: postgresql://user:password@postgres:5432/tradesphere
        REDIS_URL: redis://redis:6379
        OPENAI_API_KEY: ${OPENAI_API_KEY}
      depends_on:
        - postgres
        - redis
      ports:
        - "8000:8000"

    express:
      build: .
      environment:
        DATABASE_URL: postgresql://user:password@postgres:5432/tradesphere
        PYTHON_API_URL: http://fastapi:8000
      depends_on:
        - postgres
        - fastapi
      ports:
        - "5000:5000"

    nginx:
      image: nginx:alpine
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf
      ports:
        - "80:80"
        - "443:443"
      depends_on:
        - express
        - fastapi

  volumes:
    postgres_data:
  ```

- [ ] CI/CD pipeline (GitHub Actions)
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy
  
  on:
    push:
      branches: [main]
  
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Deploy to VPS
          run: |
            # SSH and docker-compose pull/up
  ```

**Deliverable:**
- Dockerized services
- Docker Compose working locally
- Deployment pipeline ready

---

## PHASE 4: Testing & Launch (Tuần 5-6)

### Sprint 4.1: Testing (3-4 ngày)

#### Task 4.1.1: Unit Tests
- [ ] FastAPI tests
  ```python
  # tests/test_scam_search.py
  from fastapi.testclient import TestClient
  
  def test_search_scams():
      response = client.get("/api/v1/scams/search?keyword=0123456789")
      assert response.status_code == 200
      assert "total_results" in response.json()
  ```

- [ ] Express tests
  ```typescript
  // server/tests/routes.test.ts
  import request from 'supertest';
  
  describe('Scam Search', () => {
    it('should return search results', async () => {
      const res = await request(app)
        .get('/api/scams/search?keyword=0123456789');
      expect(res.status).toBe(200);
    });
  });
  ```

**Deliverable:**
- Test coverage > 70%
- All critical paths tested

---

#### Task 4.1.2: Integration Tests
- [ ] End-to-end tests
  - Web → Express → FastAPI → Database
  - Zalo webhook → Processing → Response
- [ ] Load testing (k6, Apache Bench)
  ```javascript
  // load-test.js
  import http from 'k6/http';
  
  export default function () {
    http.get('http://localhost:8000/api/v1/scams/search?keyword=0123456789');
  }
  ```

**Deliverable:**
- E2E tests passing
- System handles 100 req/s

---

### Sprint 4.2: Launch Preparation (2-3 ngày)

#### Task 4.2.1: Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide
- [ ] Admin manual
- [ ] Deployment guide

**Deliverable:**
- Complete documentation

---

#### Task 4.2.2: Soft Launch
- [ ] Deploy to staging
- [ ] Invite beta users
- [ ] Collect feedback
- [ ] Bug fixes
- [ ] Performance tuning

**Deliverable:**
- Stable staging environment
- Beta feedback incorporated

---

#### Task 4.2.3: Production Launch
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] On-call rotation
- [ ] Marketing push

**Deliverable:**
- 🚀 **PRODUCTION LIVE!**

---

## Post-Launch (Ongoing)

### Monitoring & Maintenance
- [ ] Daily health checks
- [ ] Weekly performance reviews
- [ ] Monthly security audits
- [ ] Quarterly feature updates

### Feature Backlog (Future)
- [ ] Mobile app (React Native)
- [ ] Telegram bot
- [ ] Messenger integration
- [ ] Advanced ML models
- [ ] Community features (forum, voting)
- [ ] API marketplace

---

## Resources & Tools

### Development
- **IDE**: VS Code with extensions (Python, TypeScript, Docker)
- **API Testing**: Postman, Insomnia
- **Database**: TablePlus, DBeaver
- **Git**: GitHub/GitLab

### Monitoring
- **Logs**: Sentry, Datadog
- **Metrics**: Prometheus + Grafana
- **Uptime**: UptimeRobot
- **Analytics**: Google Analytics, Mixpanel

### Communication
- **Project Management**: Trello, Notion, Linear
- **Team Chat**: Slack, Discord
- **Documentation**: Notion, Confluence

---

## Estimated Budget

### Development Costs
- Developers: 1-2 fullstack devs × 6 weeks
- DevOps: Part-time for setup

### Infrastructure (Monthly)
- VPS: $20-50 (2-4GB RAM)
- Database: $15-30 (managed PostgreSQL)
- Redis: $10-20 (managed Redis)
- Domains & SSL: $15/year
- **Total**: ~$50-100/month

### Third-Party Services
- OpenAI API: $20-100/month (depends on usage)
- Zalo OA: Free (basic features)
- CDN: Cloudflare (free tier)
- **Total**: ~$20-100/month

### Grand Total: $70-200/month

---

## Success Metrics

### Technical KPIs
- Uptime: > 99.5%
- Response time: < 1s (p95)
- Error rate: < 0.1%
- Cache hit ratio: > 70%

### Business KPIs
- Daily active users: 100+ (month 1)
- Search queries: 500+/day
- Zalo OA followers: 1000+ (month 3)
- User retention: > 40%

---

## Risk Management

### Technical Risks
- **Selenium crashes**: Retry logic, health checks
- **API rate limits**: Caching, queue system
- **Database overload**: Read replicas, connection pooling
- **DDoS attacks**: Cloudflare, rate limiting

### Business Risks
- **Low adoption**: Marketing, SEO, partnerships
- **Legal issues**: Terms of service, privacy policy
- **Competition**: Unique features, better UX

---

## Next Steps

1. **Immediate** (This week):
   - [ ] Review architecture
   - [ ] Setup development environment
   - [ ] Start Sprint 1.1

2. **Short-term** (Next 2 weeks):
   - [ ] Complete Phase 1
   - [ ] Test FastAPI integration

3. **Mid-term** (Month 1):
   - [ ] Complete all phases
   - [ ] Beta launch

4. **Long-term** (Quarter 1):
   - [ ] Production launch
   - [ ] 1000+ active users

---

**Questions? Need clarification? Let's discuss!** 🚀
