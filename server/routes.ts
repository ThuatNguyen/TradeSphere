import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertBlogPostSchema } from "@shared/schema";
import { z } from "zod";

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

  // AI Chat endpoint (enhanced responses)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const messageText = message.toLowerCase();
      
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
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
