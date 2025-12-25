import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertBlogPostSchema, insertAdminSchema, insertChatSessionSchema, insertChatMessageSchema, updateBlogPostSchema, insertScamSearchSchema } from "@shared/schema";
import { z } from "zod";
import { searchScams, chatWithAI, analyzeText, getCacheStats, clearCache } from "./lib/pythonClient";

export async function registerRoutes(app: Express): Promise<Server> {
  // Search reports
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const results = await storage.searchReports(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search reports" });
    }
  });

  // Get recent reports
  app.get("/api/reports/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const reports = await storage.getRecentReports(limit);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent reports" });
    }
  });

  // Create report
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create report" });
      }
    }
  });

  // Get report detail
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to get report" });
    }
  });

  // Get all blog posts
  app.get("/api/blogs", async (req, res) => {
    try {
      const search = req.query.search as string;
      const posts = await storage.getAllBlogPosts(search);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get blog posts" });
    }
  });

  // Get blog post by slug
  app.get("/api/blogs/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Increment view count
      await storage.updateBlogPostViews(post.id);
      res.json({ ...post, views: (post.views || 0) + 1 });
    } catch (error) {
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });

  // Get blog post by id
  app.get("/api/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      
      // Increment view count
      await storage.updateBlogPostViews(id);
      res.json({ ...post, views: (post.views || 0) + 1 });
    } catch (error) {
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });

  // Create blog post
  app.post("/api/blogs", async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create blog post" });
      }
    }
  });

  // ========== PYTHON API PROXY ROUTES ==========
  
  // Scam search (proxy to Python API)
  app.get("/api/scams/search", async (req, res) => {
    const startTime = Date.now();
    try {
      const { keyword, type } = req.query;
      
      console.log(`🔍 Scam search request: keyword="${keyword}", type="${type || 'all'}"`);
      
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: "Keyword is required" });
      }
      
      // Search in local database first
      console.log(`📊 Searching local database for: ${keyword}...`);
      const localReports = await storage.searchReports(keyword);
      
      // If found in local database, return immediately without external search
      if (localReports.length > 0) {
        const duration = Date.now() - startTime;
        const localSource = {
          success: true,
          source: 'tradesphere.db',
          keyword: keyword,
          total_scams: localReports.length,
          data: localReports.map(report => ({
            name: report.accusedName,
            phone: report.phoneNumber || '',
            account_number: report.accountNumber || '',
            bank: report.bank || '',
            amount: report.scamAmount?.toString() || '',
            description: report.description,
            date: report.createdAt?.toISOString().split('T')[0] || '',
            detail_link: `/detail/${report.id}`,
            report_id: report.id
          }))
        };
        
        const result = {
          success: true,
          keyword: keyword,
          total_results: localReports.length,
          sources: [localSource],
          cached: false,
          response_time_ms: duration
        };
        
        console.log(`✅ Found ${localReports.length} results in local DB in ${duration}ms (skipped external search)`);
        
        // Log search to database
        try {
          await storage.createScamSearch({
            keyword,
            source: 'local',
            resultsCount: localReports.length,
            responseTimeMs: duration,
          });
        } catch (dbError) {
          console.error("⚠️ Failed to log search:", dbError);
        }
        
        return res.json(result);
      }
      
      // No local results, search external sources
      console.log(`⏳ No local results, calling Python API for: ${keyword}...`);
      const result = await searchScams(keyword, type as string);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Search completed in ${duration}ms: ${result.total_results || 0} results found from external sources`);
      
      // Log search to database
      try {
        await storage.createScamSearch({
          keyword,
          source: 'web',
          resultsCount: result.total_results || 0,
          responseTimeMs: result.response_time_ms || null,
        });
      } catch (dbError) {
        console.error("⚠️ Failed to log search:", dbError);
      }
      
      res.json(result);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Scam search failed after ${duration}ms:`, {
        keyword: req.query.keyword,
        errorCode: error.code,
        errorMessage: error.message,
        isTimeout: error.code === 'ECONNABORTED',
        status: error.response?.status,
      });
      
      res.status(500).json({ 
        error: "Search failed", 
        message: error.code === 'ECONNABORTED' ? 'Request timeout - search taking too long' : error.message,
        details: error.response?.data || undefined
      });
    }
  });

  // AI Chat (proxy to Python API for better responses)
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, sessionId, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Call Python AI service
      const result = await chatWithAI(message, sessionId, context);
      
      // Save to database
      if (sessionId) {
        try {
          let session = await storage.getChatSession(sessionId);
          if (!session) {
            session = await storage.createChatSession({
              sessionId,
              userAgent: req.headers['user-agent'] || null,
              ipAddress: req.ip || null
            });
          }
          
          await storage.createChatMessage({
            sessionId,
            message,
            isUser: true
          });
          
          await storage.createChatMessage({
            sessionId,
            message: result.response,
            isUser: false
          });
        } catch (dbError) {
          console.error("Chat DB error:", dbError);
        }
      }
      
      res.json(result);
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({ 
        error: "Chat failed", 
        message: error.message 
      });
    }
  });

  // Analyze text for scam indicators
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const result = await analyzeText(text);
      res.json(result);
    } catch (error: any) {
      console.error("Text analysis error:", error);
      res.status(500).json({ 
        error: "Analysis failed", 
        message: error.message 
      });
    }
  });

  // Cache stats (admin)
  app.get("/api/admin/cache/stats", async (req, res) => {
    try {
      const stats = await getCacheStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get cache stats", 
        message: error.message 
      });
    }
  });

  // Clear cache (admin)
  app.delete("/api/admin/cache/clear", async (req, res) => {
    try {
      const { pattern } = req.query;
      const result = await clearCache(pattern as string);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to clear cache", 
        message: error.message 
      });
    }
  });

  // ========== LEGACY ROUTES (kept for backward compatibility) ==========
  
  // AI Chat endpoint (enhanced responses)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const messageText = message.toLowerCase();
      
      // Save user message to database if sessionId provided
      if (sessionId) {
        try {
          // Create or get session
          let session = await storage.getChatSession(sessionId);
          if (!session) {
            session = await storage.createChatSession({
              sessionId,
              userAgent: req.headers['user-agent'] || null,
              ipAddress: req.ip || null
            });
          }
          
          // Save user message
          await storage.createChatMessage({
            sessionId,
            message,
            isUser: true
          });
        } catch (dbError) {
          console.error("Chat DB error:", dbError);
        }
      }
      
      let response = "Xin chào! Tôi là AI hỗ trợ phòng chống lừa đảo. Bạn có thể chia sẻ thông tin nghi ngờ hoặc hỏi cách phòng tránh lừa đảo.";
      
      // Specific fraud type responses
      if (messageText.includes("otp") || messageText.includes("mã xác thực") || messageText.includes("mã otp")) {
        response = "🚨 CẢNH BÁO: Ngân hàng KHÔNG BAO GIỜ yêu cầu OTP qua điện thoại hay tin nhắn! Đây là thủ đoạn lừa đảo phổ biến. Hãy:\n\n• Không cung cấp mã OTP cho ai\n• Liên hệ trực tiếp ngân hàng qua hotline chính thức\n• Báo cáo ngay nếu đã bị lừa";
      } else if (messageText.includes("đầu tư") || messageText.includes("lợi nhuận") || messageText.includes("bitcoin") || messageText.includes("forex")) {
        response = "💰 CẢNH BÁO ĐẦU TƯ: Hãy cẩn thận với các cơ hội đầu tư hứa hẹn lợi nhuận cao!\n\n• Kiểm tra giấy phép hoạt động\n• Không chuyển tiền trước khi xác minh\n• Tìm hiểu về công ty qua nhiều nguồn\n• Nếu quá tốt để tin được thì có thể là lừa đảo";
      } else if (messageText.includes("chuyển tiền") || messageText.includes("tài khoản") || messageText.includes("ngân hàng")) {
        response = "💳 BẢNG MẬT CHUYỂN TIỀN:\n\n• Xác minh người nhận qua điện thoại\n• Kiểm tra thông tin tài khoản kỹ lưỡng\n• Chuyển số tiền nhỏ để thử nghiệm trước\n• Lưu lại mọi bằng chứng giao dịch\n• Không chuyển tiền cho người lạ";
      } else if (messageText.includes("facebook") || messageText.includes("zalo") || messageText.includes("mạng xã hội")) {
        response = "📱 LỪA ĐẢO MẠNG XÃ HỘI:\n\n• Cảnh giác với tài khoản fake\n• Không click link lạ\n• Xác minh danh tính qua video call\n• Không chia sẻ thông tin cá nhân\n• Báo cáo tài khoản đáng ngờ";
      } else if (messageText.includes("tin nhắn") || messageText.includes("sms") || messageText.includes("link")) {
        response = "📧 LỪA ĐẢO TIN NHẮN:\n\n• Không click vào link lạ\n• Kiểm tra số điện thoại gửi tin\n• Ngân hàng không gửi link trong tin nhắn\n• Truy cập website chính thức thay vì qua link\n• Báo cáo tin nhắn spam";
      } else if (messageText.includes("giúp") || messageText.includes("hỗ trợ") || messageText.includes("tư vấn")) {
        response = "🤝 TÔI CÓ THỂ HỖ TRỢ:\n\n• Tư vấn nhận diện lừa đảo\n• Hướng dẫn cách phòng tránh\n• Kiểm tra thông tin đáng ngờ\n• Cách báo cáo lừa đảo\n\nHãy chia sẻ tình huống cụ thể để tôi tư vấn chính xác hơn!";
      } else if (messageText.includes("bị lừa") || messageText.includes("mất tiền") || messageText.includes("bị chiếm")) {
        response = "😰 BẠN ĐÃ BỊ LỪA? HÀNH ĐỘNG NGAY:\n\n1️⃣ Liên hệ ngân hàng khóa tài khoản\n2️⃣ Báo cáo công an địa phương\n3️⃣ Lưu lại mọi bằng chứng\n4️⃣ Tạo tố cáo trên website này\n5️⃣ Thông báo cho người thân cảnh giác\n\nThời gian vàng trong 24h đầu!";
      } else if (messageText.includes("số điện thoại") || messageText.includes("sđt") || /\d{10,11}/.test(messageText)) {
        response = "📞 KIỂM TRA SỐ ĐIỆN THOẠI:\n\n• Sử dụng tính năng tìm kiếm trên trang chủ\n• Kiểm tra trong cơ sở dữ liệu tố cáo\n• Tra cứu trên các diễn đàn uy tín\n• Cảnh giác nếu số lạ gọi về tài chính\n\nHãy tìm kiếm số điện thoại đó ngay!";
      }
      
      // Save AI response to database if sessionId provided
      if (sessionId) {
        try {
          await storage.createChatMessage({
            sessionId,
            message: response,
            isUser: false
          });
        } catch (dbError) {
          console.error("Chat DB save error:", dbError);
        }
      }
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ admin: { id: admin.id, username: admin.username, role: admin.role } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin - Get all reports with pagination
  app.get("/api/admin/reports", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const reports = await storage.getAllReports(limit, offset);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  // Admin - Update report
  app.put("/api/admin/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const report = await storage.updateReport(id, updateData);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // Admin - Delete report
  app.delete("/api/admin/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Admin - Update blog post
  app.put("/api/admin/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateBlogPostSchema.parse(req.body);
      const post = await storage.updateBlogPost(id, validatedData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update blog post" });
      }
    }
  });

  // Admin - Delete blog post
  app.delete("/api/admin/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Admin - Get all chat sessions
  app.get("/api/admin/chat/sessions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const sessions = await storage.getAllChatSessions(limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat sessions" });
    }
  });

  // Admin - Get chat messages for a session
  app.get("/api/admin/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const limit = parseInt(req.query.limit as string) || 100;
      const messages = await storage.getChatMessages(sessionId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
