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

  // AI Chat endpoint (mock response)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      // Simple mock AI responses based on keywords
      let response = "Tôi có thể giúp bạn kiểm tra thông tin lừa đảo. Bạn có thể chia sẻ thêm chi tiết không?";
      
      if (message.toLowerCase().includes("otp") || message.toLowerCase().includes("mã xác thực")) {
        response = "⚠️ Cảnh báo! Ngân hàng không bao giờ yêu cầu OTP qua tin nhắn hay cuộc gọi. Đây có thể là lừa đảo. Không cung cấp mã OTP cho bất kỳ ai!";
      } else if (message.toLowerCase().includes("đầu tư") || message.toLowerCase().includes("lợi nhuận")) {
        response = "🚨 Hãy cẩn thận với các lời mời đầu tư hứa hẹn lợi nhuận cao! Kiểm tra kỹ giấy phép hoạt động và không chuyển tiền nếu chưa chắc chắn.";
      } else if (message.toLowerCase().includes("chuyển tiền") || message.toLowerCase().includes("tài khoản")) {
        response = "💡 Trước khi chuyển tiền, hãy xác minh thông tin người nhận qua nhiều kênh khác nhau. Gọi điện trực tiếp để xác nhận.";
      }
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
