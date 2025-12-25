# Quick Start Guide - TradeSphere Anti-Scam Platform

## 🚀 Khởi động hệ thống

### 1. Start Backend Services (2 terminals)

**Terminal 1 - Express Backend:**
```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere
npm run dev
```

**Terminal 2 - FastAPI Service:**
```bash
cd /media/tnt/01DBF4083BC73BB0/CODE/TradeSphere/fastapi-service
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Access Application

- **Frontend:** http://localhost:5173
- **Scam Search Page:** http://localhost:5173/scam-search
- **API Docs:** http://localhost:8000/docs
- **Express API:** http://localhost:5000

---

## 🧪 Test Features

### 1. Tra cứu lừa đảo
1. Mở: http://localhost:5173/scam-search
2. Nhập số điện thoại hoặc STK: `0123456789`
3. Click "Tìm kiếm"
4. Xem kết quả từ 3 nguồn

### 2. Test API trực tiếp

**Search Scam:**
```bash
curl "http://localhost:5000/api/scams/search?keyword=0123456789"
```

**AI Chat:**
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Cách nhận biết lừa đảo?"}'
```

**Cache Stats:**
```bash
curl http://localhost:5000/api/admin/cache/stats
```

---

## 📦 Optional Setup

### Install Redis (for caching)
```bash
sudo apt install redis-server
sudo systemctl start redis
redis-cli ping  # Should return PONG
```

### Add OpenAI API Key (for AI chat)
Edit: `fastapi-service/.env`
```env
OPENAI_API_KEY=sk-your-real-api-key-here
```

### Setup Zalo OA (for notifications)
Edit: `fastapi-service/.env`
```env
ZALO_OA_ID=your_oa_id
ZALO_ACCESS_TOKEN=your_token
ZALO_SECRET_KEY=your_secret
```

---

## 🔧 Troubleshooting

### FastAPI không start
```bash
cd fastapi-service
source venv/bin/activate
pkill -f uvicorn
python -m uvicorn app.main:app --reload --port 8000
```

### Express error
```bash
npm install
npm run dev
```

### Database connection error
Check `.env` file có DATABASE_URL đúng:
```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/tradesphere
```

### Port đã sử dụng
```bash
# Kill process on port 8000
sudo lsof -ti:8000 | xargs kill -9

# Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9
```

---

## 📚 Documentation

- **Phase 2 Complete:** [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Docs:** http://localhost:8000/docs

---

## ✅ System Status Check

```bash
# Check all services
curl http://localhost:5000/          # Express
curl http://localhost:8000/          # FastAPI
curl http://localhost:8000/health    # Health check
```

**Expected Responses:**
- Express: Should return HTML
- FastAPI: `{"message":"Anti-Scam API","version":"1.0.0"}`
- Health: `{"status":"degraded",...}` (degraded OK if Redis not installed)
