import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertReportSchema, insertBlogPostSchema, insertAdminSchema, 
  insertChatSessionSchema, insertChatMessageSchema, updateBlogPostSchema, 
  updateReportSchema, insertReportCategorySchema, insertBlogCategorySchema,
  insertAuditLogSchema, insertSystemSettingSchema
} from "@shared/schema";
import { z } from "zod";

// Middleware for admin authentication
const requireAdmin = (req: any, res: any, next: any) => {
  // In a real application, you would verify JWT token here
  // For now, just check if admin credentials are provided
  const adminHeader = req.headers.authorization;
  if (!adminHeader || !adminHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
};

// Middleware for audit logging
const auditLog = (action: string, resourceType: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const resourceId = req.params.id ? parseInt(req.params.id) : null;
      await storage.createAuditLog({
        userId: req.user?.id || null,
        action,
        resourceType,
        resourceId,
        details: { body: req.body, params: req.params, query: req.query },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== PUBLIC ROUTES ====================
  
  // Search reports with enhanced filtering
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const filters = {
        status: req.query.status as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
        isPublic: req.query.isPublic === 'true'
      };
      
      const results = await storage.searchReports(query, filters);
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
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
      console.error('Recent reports error:', error);
      res.status(500).json({ error: "Failed to get recent reports" });
    }
  });

  // Get reports by status
  app.get("/api/reports/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const limit = parseInt(req.query.limit as string) || 50;
      const reports = await storage.getReportsByStatus(status, limit);
      res.json(reports);
    } catch (error) {
      console.error('Reports by status error:', error);
      res.status(500).json({ error: "Failed to get reports by status" });
    }
  });

  // Create report
  app.post("/api/reports", auditLog('create', 'report'), async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      console.error('Create report error:', error);
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
      console.error('Get report error:', error);
      res.status(500).json({ error: "Failed to get report" });
    }
  });

  // ==================== BLOG ROUTES ====================

  // Get all blog posts with enhanced filtering
  app.get("/api/blogs", async (req, res) => {
    try {
      const search = req.query.search as string;
      const filters = {
        category: req.query.category as string,
        status: req.query.status as string || "published",
        featured: req.query.featured === 'true',
        authorId: req.query.authorId ? parseInt(req.query.authorId as string) : undefined
      };
      
      const posts = await storage.getAllBlogPosts(search, filters);
      res.json(posts);
    } catch (error) {
      console.error('Get blogs error:', error);
      res.status(500).json({ error: "Failed to get blog posts" });
    }
  });

  // Get blog posts by category
  app.get("/api/blogs/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const limit = parseInt(req.query.limit as string) || 10;
      const posts = await storage.getBlogPostsByCategory(category, limit);
      res.json(posts);
    } catch (error) {
      console.error('Get blogs by category error:', error);
      res.status(500).json({ error: "Failed to get blog posts by category" });
    }
  });

  // Get featured blog posts
  app.get("/api/blogs/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const posts = await storage.getFeaturedBlogPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error('Get featured blogs error:', error);
      res.status(500).json({ error: "Failed to get featured blog posts" });
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
      
      // Only increment views for published posts
      if (post.status === "published") {
        await storage.updateBlogPostViews(post.id);
        res.json({ ...post, views: (post.views || 0) + 1 });
      } else {
        res.json(post);
      }
    } catch (error) {
      console.error('Get blog by slug error:', error);
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
      
      // Only increment views for published posts
      if (post.status === "published") {
        await storage.updateBlogPostViews(id);
        res.json({ ...post, views: (post.views || 0) + 1 });
      } else {
        res.json(post);
      }
    } catch (error) {
      console.error('Get blog error:', error);
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });

  // Create blog post
  app.post("/api/blogs", auditLog('create', 'blog'), async (req, res) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Create blog error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create blog post" });
      }
    }
  });

  // ==================== CATEGORY ROUTES ====================

  // Get report categories
  app.get("/api/categories/reports", async (req, res) => {
    try {
      const categories = await storage.getReportCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get report categories error:', error);
      res.status(500).json({ error: "Failed to get report categories" });
    }
  });

  // Get blog categories
  app.get("/api/categories/blogs", async (req, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get blog categories error:', error);
      res.status(500).json({ error: "Failed to get blog categories" });
    }
  });

  // ==================== CHAT ROUTES ====================

  // Enhanced AI Chat endpoint
  app.post("/api/chat", auditLog('chat', 'message'), async (req, res) => {
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
              ipAddress: req.ip || null,
              status: "active",
              priority: "normal"
            });
          }
          
          // Save user message
          await storage.createChatMessage({
            sessionId,
            message,
            isUser: true,
            messageType: "text"
          });
        } catch (dbError) {
          console.error("Chat DB error:", dbError);
        }
      }
      
      let response = "Xin chào! Tôi là AI hỗ trợ phòng chống lừa đảo. Bạn có thể chia sẻ thông tin nghi ngờ hoặc hỏi cách phòng tránh lừa đảo.";
      let priority = "normal";
      
      // Enhanced response logic with priority detection
      if (messageText.includes("khẩn cấp") || messageText.includes("bị lừa") || messageText.includes("mất tiền")) {
        priority = "high";
        response = "🚨 TÌNH HUỐNG KHẨN CẤP - BẠN ĐÃ BỊ LỪA?\n\n⚡ HÀNH ĐỘNG NGAY LẬP TỨC:\n1️⃣ Liên hệ ngân hàng khóa tài khoản (24/7)\n2️⃣ Báo cáo công an địa phương\n3️⃣ Lưu giữ mọi bằng chứng (tin nhắn, email, screenshot)\n4️⃣ Tạo tố cáo chi tiết trên website này\n5️⃣ Thông báo ngay cho người thân\n\n⏰ THỜI GIAN VÀNG: 24 giờ đầu là quan trọng nhất!\n\n💬 Hãy chia sẻ chi tiết tình huống để tôi hỗ trợ tốt hơn.";
      } else if (messageText.includes("otp") || messageText.includes("mã xác thực") || messageText.includes("mã otp")) {
        priority = "high";
        response = "🚨 CẢNH BÁO OTP - NGUY HIỂM CAO!\n\n❌ NGÂN HÀNG KHÔNG BAO GIỜ:\n• Gọi điện xin mã OTP\n• Nhắn tin yêu cầu mã xác thực\n• Gửi link để cập nhật thông tin\n\n✅ HÀNH ĐỘNG NGAY:\n• KHÔNG cung cấp mã OTP cho bất kỳ ai\n• Liên hệ ngân hàng qua hotline chính thức\n• Báo cáo ngay nếu đã bị lừa\n\n📞 Hotline các ngân hàng lớn:\n• Vietcombank: 1900 54 54 13\n• Techcombank: 1900 58 88 85\n• BIDV: 1900 9247";
      } else if (messageText.includes("đầu tư") || messageText.includes("lợi nhuận") || messageText.includes("bitcoin") || messageText.includes("forex")) {
        response = "💰 CẢNH BÁO ĐẦU TƯ LỪA ĐẢO!\n\n🚩 DẤU HIỆU NHẬN BIẾT:\n• Hứa hẹn lợi nhuận cao, không rủi ro\n• Yêu cầu chuyển tiền trước\n• Không có giấy phép hoạt động\n• Nhóm Telegram/Facebook kín\n• Không thể rút tiền sau khi đầu tư\n\n✅ CÁCH PHÒNG TRÁNH:\n• Kiểm tra giấy phép tại SBV, SSC\n• Nghiên cứu kỹ công ty\n• Không tin vào lời hứa suông\n• Tham khảo ý kiến chuyên gia\n\n🔍 Tìm kiếm thông tin công ty trên website này trước khi đầu tư!";
      } else if (messageText.includes("chuyển tiền") || messageText.includes("tài khoản") || messageText.includes("ngân hàng")) {
        response = "💳 BẢNG MẬT CHUYỂN TIỀN AN TOÀN:\n\n✅ TRƯỚC KHI CHUYỂN:\n• Xác minh người nhận qua video call\n• Kiểm tra kỹ thông tin tài khoản\n• Tìm hiểu về người/công ty nhận tiền\n• Chuyển số tiền nhỏ để thử nghiệm\n\n⚠️ CẢNH BÁO:\n• Không chuyển tiền cho người lạ\n• Không tin vào ảnh chụp màn hình\n• Cẩn thận với tài khoản mới tạo\n• Lưu lại mọi bằng chứng giao dịch\n\n📱 Sử dụng các app ngân hàng chính thức và bật thông báo giao dịch.";
      } else if (messageText.includes("facebook") || messageText.includes("zalo") || messageText.includes("mạng xã hội")) {
        response = "📱 LỪA ĐẢO MẠNG XÃ HỘI - THỦ ĐOẠN TINH VI!\n\n🎭 HÌNH THỨC PHỔ BIẾN:\n• Giả mạo tài khoản người quen\n• Bán hàng online không giao hàng\n• Lừa đảo tình cảm\n• Đầu tư tài chính ảo\n• Hack tài khoản để lừa bạn bè\n\n🛡️ CÁCH PHÒNG TRÁNH:\n• Xác minh danh tính qua video call\n• Không click vào link lạ\n• Kiểm tra thông tin người bán\n• Không chia sẻ thông tin cá nhân\n• Báo cáo tài khoản đáng ngờ\n\n🔍 Tìm kiếm số điện thoại/tài khoản nghi ngờ trên website này!";
      } else if (messageText.includes("tin nhắn") || messageText.includes("sms") || messageText.includes("link")) {
        response = "📧 NHẬN BIẾT TIN NHẮN LỪA ĐẢO:\n\n🚩 DẤU HIỆU ĐÁNG NGỜ:\n• Số điện thoại lạ gửi tin về ngân hàng\n• Link rút gọn hoặc lạ\n• Yêu cầu cập nhật thông tin gấp\n• Thông báo trúng thưởng\n• Tin nhắn có lỗi chính tả\n\n✅ CÁCH XỬ LÝ:\n• KHÔNG bấm vào link trong tin nhắn\n• Truy cập trực tiếp website chính thức\n• Liên hệ hotline để xác minh\n• Báo cáo tin nhắn spam\n• Chặn số điện thoại lạ\n\n⚠️ Nhớ: Ngân hàng KHÔNG gửi link trong tin nhắn!";
      } else if (messageText.includes("số điện thoại") || messageText.includes("sđt") || /\d{10,11}/.test(messageText)) {
        response = "📞 KIỂM TRA SỐ ĐIỆN THOẠI ĐÁNG NGỜ:\n\n🔍 CÁCH KIỂM TRA:\n• Sử dụng tính năng tìm kiếm trên trang chủ\n• Xem trong cơ sở dữ liệu tố cáo\n• Tra cứu trên Google\n• Kiểm tra trên các diễn đàn\n\n🚨 CẢNH BÁO NẾU:\n• Số lạ gọi về vấn đề tài chính\n• Tự xưng là ngân hàng/công an\n• Yêu cầu thông tin cá nhân\n• Áp lực phải xử lý gấp\n\n✅ HÀNH ĐỘNG:\n• Ghi lại cuộc gọi nếu có thể\n• Không cung cấp thông tin cá nhân\n• Tạo tố cáo trên website này\n• Chia sẻ cảnh báo với người khác";
      } else if (messageText.includes("giúp") || messageText.includes("hỗ trợ") || messageText.includes("tư vấn")) {
        response = "🤝 DỊCH VỤ HỖ TRỢ PHÒNG CHỐNG LỪA ĐẢO:\n\n💬 TÔI CÓ THỂ GIÚP:\n• Tư vấn nhận diện thủ đoạn lừa đảo\n• Hướng dẫn cách phòng tránh\n• Kiểm tra thông tin đáng ngờ\n• Hỗ trợ tạo tố cáo\n• Cung cấp thông tin liên hệ khẩn cấp\n\n📱 CHỨC NĂNG WEBSITE:\n• Tìm kiếm thông tin lừa đảo\n• Đọc tin tức cảnh báo\n• Tạo tố cáo trực tuyến\n• Chia sẻ kinh nghiệm\n\n💡 Hãy mô tả cụ thể tình huống để tôi tư vấn chính xác hơn!";
      }
      
      // Update session priority if needed
      if (sessionId && priority !== "normal") {
        try {
          await storage.updateChatSession(sessionId, { priority });
        } catch (dbError) {
          console.error("Chat session update error:", dbError);
        }
      }
      
      // Save AI response to database if sessionId provided
      if (sessionId) {
        try {
          await storage.createChatMessage({
            sessionId,
            message: response,
            isUser: false,
            messageType: "text"
          });
        } catch (dbError) {
          console.error("Chat DB save error:", dbError);
        }
      }
      
      res.json({ response, priority });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  // Admin login with enhanced security
  app.post("/api/admin/login", auditLog('login', 'admin'), async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminByUsername(username);
      
      if (!admin || admin.password !== password || !admin.isActive) {
        return res.status(401).json({ error: "Invalid credentials or account disabled" });
      }
      
      // Update last login
      await storage.updateAdminLastLogin(admin.id);
      
      res.json({ 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          role: admin.role,
          fullName: admin.fullName,
          permissions: admin.permissions
        } 
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin - Get analytics dashboard
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const [reportStats, blogStats, chatStats] = await Promise.all([
        storage.getReportStats(),
        storage.getBlogStats(),
        storage.getChatStats()
      ]);
      
      res.json({
        reports: reportStats,
        blogs: blogStats,
        chats: chatStats
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // Admin - Get all reports with enhanced filtering
  app.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = {
        status: req.query.status as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
        isPublic: req.query.isPublic === 'true' || req.query.isPublic === 'false' ? req.query.isPublic === 'true' : undefined
      };
      
      const reports = await storage.getAllReports(limit, offset, filters);
      res.json(reports);
    } catch (error) {
      console.error('Admin get reports error:', error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  // Admin - Update report with status tracking
  app.put("/api/admin/reports/:id", requireAdmin, auditLog('update', 'report'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateReportSchema.parse(req.body);
      const report = await storage.updateReport(id, updateData);
      res.json(report);
    } catch (error) {
      console.error('Admin update report error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update report" });
      }
    }
  });

  // Admin - Update report status
  app.patch("/api/admin/reports/:id/status", requireAdmin, auditLog('status_change', 'report'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, verifiedBy } = req.body;
      const report = await storage.updateReportStatus(id, status, verifiedBy);
      res.json(report);
    } catch (error) {
      console.error('Admin update report status error:', error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  // Admin - Delete report
  app.delete("/api/admin/reports/:id", requireAdmin, auditLog('delete', 'report'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete report error:', error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Admin - Update blog post
  app.put("/api/admin/blogs/:id", requireAdmin, auditLog('update', 'blog'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateBlogPostSchema.parse(req.body);
      const post = await storage.updateBlogPost(id, validatedData);
      res.json(post);
    } catch (error) {
      console.error('Admin update blog error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update blog post" });
      }
    }
  });

  // Admin - Delete blog post
  app.delete("/api/admin/blogs/:id", requireAdmin, auditLog('delete', 'blog'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete blog error:', error);
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });

  // Admin - Get all chat sessions with filtering
  app.get("/api/admin/chat/sessions", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        assignedAdmin: req.query.assignedAdmin as string
      };
      
      const sessions = await storage.getAllChatSessions(limit, filters);
      res.json(sessions);
    } catch (error) {
      console.error('Admin get chat sessions error:', error);
      res.status(500).json({ error: "Failed to get chat sessions" });
    }
  });

  // Admin - Get chat messages for a session
  app.get("/api/admin/chat/sessions/:sessionId/messages", requireAdmin, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const limit = parseInt(req.query.limit as string) || 100;
      const messages = await storage.getChatMessages(sessionId, limit);
      res.json(messages);
    } catch (error) {
      console.error('Admin get chat messages error:', error);
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });

  // Admin - Update chat session (assign admin, change priority, etc.)
  app.patch("/api/admin/chat/sessions/:sessionId", requireAdmin, auditLog('update', 'chat_session'), async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const updateData = req.body;
      const session = await storage.updateChatSession(sessionId, updateData);
      res.json(session);
    } catch (error) {
      console.error('Admin update chat session error:', error);
      res.status(500).json({ error: "Failed to update chat session" });
    }
  });

  // Admin - Mark chat messages as read
  app.patch("/api/admin/chat/sessions/:sessionId/read", requireAdmin, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      await storage.markChatMessagesAsRead(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin mark messages read error:', error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // Admin - Create report category
  app.post("/api/admin/categories/reports", requireAdmin, auditLog('create', 'report_category'), async (req, res) => {
    try {
      const validatedData = insertReportCategorySchema.parse(req.body);
      const category = await storage.createReportCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Admin create report category error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create report category" });
      }
    }
  });

  // Admin - Create blog category
  app.post("/api/admin/categories/blogs", requireAdmin, auditLog('create', 'blog_category'), async (req, res) => {
    try {
      const validatedData = insertBlogCategorySchema.parse(req.body);
      const category = await storage.createBlogCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Admin create blog category error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create blog category" });
      }
    }
  });

  // Admin - Get system settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error('Admin get settings error:', error);
      res.status(500).json({ error: "Failed to get system settings" });
    }
  });

  // Admin - Update system setting
  app.put("/api/admin/settings/:key", requireAdmin, auditLog('update', 'system_setting'), async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      const setting = await storage.updateSystemSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error('Admin update setting error:', error);
      res.status(500).json({ error: "Failed to update system setting" });
    }
  });

  // Admin - Get audit logs
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      console.error('Admin get audit logs error:', error);
      res.status(500).json({ error: "Failed to get audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
