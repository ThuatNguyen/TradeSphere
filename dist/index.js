var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  admins: () => admins,
  blogPosts: () => blogPosts,
  chatMessages: () => chatMessages,
  chatSessions: () => chatSessions,
  insertAdminSchema: () => insertAdminSchema,
  insertBlogPostSchema: () => insertBlogPostSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertChatSessionSchema: () => insertChatSessionSchema,
  insertReportSchema: () => insertReportSchema,
  insertUserSchema: () => insertUserSchema,
  reports: () => reports,
  updateBlogPostSchema: () => updateBlogPostSchema,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  accusedName: text("accused_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  accountNumber: text("account_number"),
  bank: text("bank"),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  reporterName: text("reporter_name"),
  reporterPhone: text("reporter_phone"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow()
});
var blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  tags: text("tags").array(),
  readTime: integer("read_time").default(5),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow()
});
var chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true
});
var insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  views: true
});
var insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true
});
var insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});
var updateBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  views: true
}).partial();

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
dotenv.config();
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async createReport(insertReport) {
    const [report] = await db.insert(reports).values({
      ...insertReport,
      accountNumber: insertReport.accountNumber || null,
      bank: insertReport.bank || null,
      isAnonymous: insertReport.isAnonymous || false,
      reporterName: insertReport.reporterName || null,
      reporterPhone: insertReport.reporterPhone || null,
      receiptUrl: null
    }).returning();
    return report;
  }
  async getReport(id) {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || void 0;
  }
  async searchReports(query) {
    const searchLower = query.toLowerCase().trim();
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    return allReports.filter(
      (report) => report.accusedName.toLowerCase().includes(searchLower) || report.phoneNumber.includes(query) || report.accountNumber && report.accountNumber.includes(query)
    );
  }
  async getRecentReports(limit = 6) {
    return await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(limit);
  }
  async getAllReports(limit = 50, offset = 0) {
    return await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(limit).offset(offset);
  }
  async updateReport(id, data) {
    const [report] = await db.update(reports).set(data).where(eq(reports.id, id)).returning();
    return report;
  }
  async deleteReport(id) {
    await db.delete(reports).where(eq(reports.id, id));
  }
  async createBlogPost(insertPost) {
    const [post] = await db.insert(blogPosts).values({
      ...insertPost,
      coverImage: insertPost.coverImage || null,
      tags: insertPost.tags || null,
      readTime: insertPost.readTime || 5
    }).returning();
    return post;
  }
  async getBlogPost(id) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || void 0;
  }
  async getBlogPostBySlug(slug) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || void 0;
  }
  async getAllBlogPosts(search) {
    const allPosts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    if (!search) {
      return allPosts;
    }
    const searchLower = search.toLowerCase();
    return allPosts.filter(
      (post) => post.title.toLowerCase().includes(searchLower) || post.excerpt.toLowerCase().includes(searchLower) || post.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }
  async updateBlogPostViews(id) {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (post) {
      await db.update(blogPosts).set({ views: (post.views || 0) + 1 }).where(eq(blogPosts.id, id));
    }
  }
  async updateBlogPost(id, data) {
    const [post] = await db.update(blogPosts).set(data).where(eq(blogPosts.id, id)).returning();
    return post;
  }
  async deleteBlogPost(id) {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
  async createAdmin(insertAdmin) {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }
  async getAdmin(id) {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || void 0;
  }
  async getAdminByUsername(username) {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || void 0;
  }
  async createChatSession(insertSession) {
    const [session] = await db.insert(chatSessions).values(insertSession).returning();
    return session;
  }
  async getChatSession(sessionId) {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId));
    return session || void 0;
  }
  async createChatMessage(insertMessage) {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }
  async getChatMessages(sessionId, limit = 100) {
    return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(asc(chatMessages.timestamp)).limit(limit);
  }
  async getAllChatSessions(limit = 100) {
    return await db.select().from(chatSessions).orderBy(desc(chatSessions.createdAt)).limit(limit);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q || "";
      const results = await storage.searchReports(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search reports" });
    }
  });
  app2.get("/api/reports/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 6;
      const reports2 = await storage.getRecentReports(limit);
      res.json(reports2);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent reports" });
    }
  });
  app2.post("/api/reports", async (req, res) => {
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
  app2.get("/api/reports/:id", async (req, res) => {
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
  app2.get("/api/blogs", async (req, res) => {
    try {
      const search = req.query.search;
      const posts = await storage.getAllBlogPosts(search);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get blog posts" });
    }
  });
  app2.get("/api/blogs/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      await storage.updateBlogPostViews(post.id);
      res.json({ ...post, views: (post.views || 0) + 1 });
    } catch (error) {
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });
  app2.get("/api/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      await storage.updateBlogPostViews(id);
      res.json({ ...post, views: (post.views || 0) + 1 });
    } catch (error) {
      res.status(500).json({ error: "Failed to get blog post" });
    }
  });
  app2.post("/api/blogs", async (req, res) => {
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
  app2.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const messageText = message.toLowerCase();
      if (sessionId) {
        try {
          let session = await storage.getChatSession(sessionId);
          if (!session) {
            session = await storage.createChatSession({
              sessionId,
              userAgent: req.headers["user-agent"] || null,
              ipAddress: req.ip || null
            });
          }
          await storage.createChatMessage({
            sessionId,
            message,
            isUser: true
          });
        } catch (dbError) {
          console.error("Chat DB error:", dbError);
        }
      }
      let response = "Xin ch\xE0o! T\xF4i l\xE0 AI h\u1ED7 tr\u1EE3 ph\xF2ng ch\u1ED1ng l\u1EEBa \u0111\u1EA3o. B\u1EA1n c\xF3 th\u1EC3 chia s\u1EBB th\xF4ng tin nghi ng\u1EDD ho\u1EB7c h\u1ECFi c\xE1ch ph\xF2ng tr\xE1nh l\u1EEBa \u0111\u1EA3o.";
      if (messageText.includes("otp") || messageText.includes("m\xE3 x\xE1c th\u1EF1c") || messageText.includes("m\xE3 otp")) {
        response = "\u{1F6A8} C\u1EA2NH B\xC1O: Ng\xE2n h\xE0ng KH\xD4NG BAO GI\u1EDC y\xEAu c\u1EA7u OTP qua \u0111i\u1EC7n tho\u1EA1i hay tin nh\u1EAFn! \u0110\xE2y l\xE0 th\u1EE7 \u0111o\u1EA1n l\u1EEBa \u0111\u1EA3o ph\u1ED5 bi\u1EBFn. H\xE3y:\n\n\u2022 Kh\xF4ng cung c\u1EA5p m\xE3 OTP cho ai\n\u2022 Li\xEAn h\u1EC7 tr\u1EF1c ti\u1EBFp ng\xE2n h\xE0ng qua hotline ch\xEDnh th\u1EE9c\n\u2022 B\xE1o c\xE1o ngay n\u1EBFu \u0111\xE3 b\u1ECB l\u1EEBa";
      } else if (messageText.includes("\u0111\u1EA7u t\u01B0") || messageText.includes("l\u1EE3i nhu\u1EADn") || messageText.includes("bitcoin") || messageText.includes("forex")) {
        response = "\u{1F4B0} C\u1EA2NH B\xC1O \u0110\u1EA6U T\u01AF: H\xE3y c\u1EA9n th\u1EADn v\u1EDBi c\xE1c c\u01A1 h\u1ED9i \u0111\u1EA7u t\u01B0 h\u1EE9a h\u1EB9n l\u1EE3i nhu\u1EADn cao!\n\n\u2022 Ki\u1EC3m tra gi\u1EA5y ph\xE9p ho\u1EA1t \u0111\u1ED9ng\n\u2022 Kh\xF4ng chuy\u1EC3n ti\u1EC1n tr\u01B0\u1EDBc khi x\xE1c minh\n\u2022 T\xECm hi\u1EC3u v\u1EC1 c\xF4ng ty qua nhi\u1EC1u ngu\u1ED3n\n\u2022 N\u1EBFu qu\xE1 t\u1ED1t \u0111\u1EC3 tin \u0111\u01B0\u1EE3c th\xEC c\xF3 th\u1EC3 l\xE0 l\u1EEBa \u0111\u1EA3o";
      } else if (messageText.includes("chuy\u1EC3n ti\u1EC1n") || messageText.includes("t\xE0i kho\u1EA3n") || messageText.includes("ng\xE2n h\xE0ng")) {
        response = "\u{1F4B3} B\u1EA2NG M\u1EACT CHUY\u1EC2N TI\u1EC0N:\n\n\u2022 X\xE1c minh ng\u01B0\u1EDDi nh\u1EADn qua \u0111i\u1EC7n tho\u1EA1i\n\u2022 Ki\u1EC3m tra th\xF4ng tin t\xE0i kho\u1EA3n k\u1EF9 l\u01B0\u1EE1ng\n\u2022 Chuy\u1EC3n s\u1ED1 ti\u1EC1n nh\u1ECF \u0111\u1EC3 th\u1EED nghi\u1EC7m tr\u01B0\u1EDBc\n\u2022 L\u01B0u l\u1EA1i m\u1ECDi b\u1EB1ng ch\u1EE9ng giao d\u1ECBch\n\u2022 Kh\xF4ng chuy\u1EC3n ti\u1EC1n cho ng\u01B0\u1EDDi l\u1EA1";
      } else if (messageText.includes("facebook") || messageText.includes("zalo") || messageText.includes("m\u1EA1ng x\xE3 h\u1ED9i")) {
        response = "\u{1F4F1} L\u1EEAA \u0110\u1EA2O M\u1EA0NG X\xC3 H\u1ED8I:\n\n\u2022 C\u1EA3nh gi\xE1c v\u1EDBi t\xE0i kho\u1EA3n fake\n\u2022 Kh\xF4ng click link l\u1EA1\n\u2022 X\xE1c minh danh t\xEDnh qua video call\n\u2022 Kh\xF4ng chia s\u1EBB th\xF4ng tin c\xE1 nh\xE2n\n\u2022 B\xE1o c\xE1o t\xE0i kho\u1EA3n \u0111\xE1ng ng\u1EDD";
      } else if (messageText.includes("tin nh\u1EAFn") || messageText.includes("sms") || messageText.includes("link")) {
        response = "\u{1F4E7} L\u1EEAA \u0110\u1EA2O TIN NH\u1EAEN:\n\n\u2022 Kh\xF4ng click v\xE0o link l\u1EA1\n\u2022 Ki\u1EC3m tra s\u1ED1 \u0111i\u1EC7n tho\u1EA1i g\u1EEDi tin\n\u2022 Ng\xE2n h\xE0ng kh\xF4ng g\u1EEDi link trong tin nh\u1EAFn\n\u2022 Truy c\u1EADp website ch\xEDnh th\u1EE9c thay v\xEC qua link\n\u2022 B\xE1o c\xE1o tin nh\u1EAFn spam";
      } else if (messageText.includes("gi\xFAp") || messageText.includes("h\u1ED7 tr\u1EE3") || messageText.includes("t\u01B0 v\u1EA5n")) {
        response = "\u{1F91D} T\xD4I C\xD3 TH\u1EC2 H\u1ED6 TR\u1EE2:\n\n\u2022 T\u01B0 v\u1EA5n nh\u1EADn di\u1EC7n l\u1EEBa \u0111\u1EA3o\n\u2022 H\u01B0\u1EDBng d\u1EABn c\xE1ch ph\xF2ng tr\xE1nh\n\u2022 Ki\u1EC3m tra th\xF4ng tin \u0111\xE1ng ng\u1EDD\n\u2022 C\xE1ch b\xE1o c\xE1o l\u1EEBa \u0111\u1EA3o\n\nH\xE3y chia s\u1EBB t\xECnh hu\u1ED1ng c\u1EE5 th\u1EC3 \u0111\u1EC3 t\xF4i t\u01B0 v\u1EA5n ch\xEDnh x\xE1c h\u01A1n!";
      } else if (messageText.includes("b\u1ECB l\u1EEBa") || messageText.includes("m\u1EA5t ti\u1EC1n") || messageText.includes("b\u1ECB chi\u1EBFm")) {
        response = "\u{1F630} B\u1EA0N \u0110\xC3 B\u1ECA L\u1EEAA? H\xC0NH \u0110\u1ED8NG NGAY:\n\n1\uFE0F\u20E3 Li\xEAn h\u1EC7 ng\xE2n h\xE0ng kh\xF3a t\xE0i kho\u1EA3n\n2\uFE0F\u20E3 B\xE1o c\xE1o c\xF4ng an \u0111\u1ECBa ph\u01B0\u01A1ng\n3\uFE0F\u20E3 L\u01B0u l\u1EA1i m\u1ECDi b\u1EB1ng ch\u1EE9ng\n4\uFE0F\u20E3 T\u1EA1o t\u1ED1 c\xE1o tr\xEAn website n\xE0y\n5\uFE0F\u20E3 Th\xF4ng b\xE1o cho ng\u01B0\u1EDDi th\xE2n c\u1EA3nh gi\xE1c\n\nTh\u1EDDi gian v\xE0ng trong 24h \u0111\u1EA7u!";
      } else if (messageText.includes("s\u1ED1 \u0111i\u1EC7n tho\u1EA1i") || messageText.includes("s\u0111t") || /\d{10,11}/.test(messageText)) {
        response = "\u{1F4DE} KI\u1EC2M TRA S\u1ED0 \u0110I\u1EC6N THO\u1EA0I:\n\n\u2022 S\u1EED d\u1EE5ng t\xEDnh n\u0103ng t\xECm ki\u1EBFm tr\xEAn trang ch\u1EE7\n\u2022 Ki\u1EC3m tra trong c\u01A1 s\u1EDF d\u1EEF li\u1EC7u t\u1ED1 c\xE1o\n\u2022 Tra c\u1EE9u tr\xEAn c\xE1c di\u1EC5n \u0111\xE0n uy t\xEDn\n\u2022 C\u1EA3nh gi\xE1c n\u1EBFu s\u1ED1 l\u1EA1 g\u1ECDi v\u1EC1 t\xE0i ch\xEDnh\n\nH\xE3y t\xECm ki\u1EBFm s\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u0111\xF3 ngay!";
      }
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
  app2.post("/api/admin/login", async (req, res) => {
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
  app2.get("/api/admin/reports", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const reports2 = await storage.getAllReports(limit, offset);
      res.json(reports2);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reports" });
    }
  });
  app2.put("/api/admin/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const report = await storage.updateReport(id, updateData);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });
  app2.delete("/api/admin/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });
  app2.put("/api/admin/blogs/:id", async (req, res) => {
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
  app2.delete("/api/admin/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog post" });
    }
  });
  app2.get("/api/admin/chat/sessions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const sessions = await storage.getAllChatSessions(limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat sessions" });
    }
  });
  app2.get("/api/admin/chat/sessions/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const limit = parseInt(req.query.limit) || 100;
      const messages = await storage.getChatMessages(sessionId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/initDb.ts
async function initializeDatabase() {
  try {
    const existingReports = await db.select().from(reports).limit(1);
    const existingBlogs = await db.select().from(blogPosts).limit(1);
    const existingAdmins = await db.select().from(admins).limit(1);
    if (existingReports.length === 0) {
      await db.insert(reports).values([
        {
          accusedName: "Nguy\u1EC5n V\u0103n A",
          phoneNumber: "0123456789",
          accountNumber: "1234567890123",
          bank: "vietcombank",
          amount: 5e6,
          description: "L\u1EEBa \u0111\u1EA3o qua Facebook b\u1EB1ng c\xE1ch gi\u1EA3 m\u1EA1o b\xE1n h\xE0ng online. \u0110\xE3 chuy\u1EC3n ti\u1EC1n nh\u01B0ng kh\xF4ng nh\u1EADn \u0111\u01B0\u1EE3c h\xE0ng v\xE0 b\u1ECB ch\u1EB7n li\xEAn l\u1EA1c.",
          isAnonymous: false,
          reporterName: "Tr\u1EA7n Th\u1ECB B",
          reporterPhone: "0987654321",
          receiptUrl: null
        },
        {
          accusedName: "L\xEA Minh C",
          phoneNumber: "0987123456",
          accountNumber: "9876543210987",
          bank: "techcombank",
          amount: 1e7,
          description: "L\u1EEBa \u0111\u1EA3o \u0111\u1EA7u t\u01B0 ti\u1EC1n \u1EA3o v\u1EDBi l\u1EDDi h\u1EE9a l\u1EE3i nhu\u1EADn cao. Sau khi chuy\u1EC3n ti\u1EC1n kh\xF4ng th\u1EC3 r\xFAt \u0111\u01B0\u1EE3c v\xE0 m\u1EA5t li\xEAn l\u1EA1c.",
          isAnonymous: true,
          reporterName: null,
          reporterPhone: null,
          receiptUrl: null
        },
        {
          accusedName: "Ph\u1EA1m V\u0103n D",
          phoneNumber: "0369852147",
          accountNumber: null,
          bank: null,
          amount: 2e6,
          description: "L\u1EEBa \u0111\u1EA3o qua tin nh\u1EAFn gi\u1EA3 m\u1EA1o ng\xE2n h\xE0ng y\xEAu c\u1EA7u c\u1EADp nh\u1EADt th\xF4ng tin v\xE0 l\u1EA5y m\xE3 OTP.",
          isAnonymous: false,
          reporterName: "Ho\xE0ng Th\u1ECB E",
          reporterPhone: "0912345678",
          receiptUrl: null
        }
      ]);
      console.log("\u2713 Sample reports added to database");
    }
    if (existingBlogs.length === 0) {
      await db.insert(blogPosts).values([
        {
          title: "10 th\u1EE7 \u0111o\u1EA1n l\u1EEBa \u0111\u1EA3o ph\u1ED5 bi\u1EBFn nh\u1EA5t n\u0103m 2024",
          slug: "10-thu-doan-lua-dao-pho-bien-nhat-2024",
          excerpt: "C\u1EADp nh\u1EADt nh\u1EEFng ph\u01B0\u01A1ng th\u1EE9c l\u1EEBa \u0111\u1EA3o m\u1EDBi nh\u1EA5t m\xE0 c\xE1c k\u1EBB x\u1EA5u \u0111ang s\u1EED d\u1EE5ng \u0111\u1EC3 chi\u1EBFm \u0111o\u1EA1t t\xE0i s\u1EA3n c\u1EE7a ng\u01B0\u1EDDi d\xE2n. T\u1EEB vi\u1EC7c gi\u1EA3 m\u1EA1o ng\xE2n h\xE0ng \u0111\u1EBFn l\u1EEBa \u0111\u1EA3o \u0111\u1EA7u t\u01B0...",
          content: "Trong n\u0103m 2024, c\xE1c th\u1EE7 \u0111o\u1EA1n l\u1EEBa \u0111\u1EA3o ng\xE0y c\xE0ng tinh vi v\xE0 \u0111a d\u1EA1ng. D\u01B0\u1EDBi \u0111\xE2y l\xE0 10 th\u1EE7 \u0111o\u1EA1n ph\u1ED5 bi\u1EBFn nh\u1EA5t m\xE0 b\u1EA1n c\u1EA7n bi\u1EBFt:\n\n1. Gi\u1EA3 m\u1EA1o tin nh\u1EAFn ng\xE2n h\xE0ng\n2. L\u1EEBa \u0111\u1EA3o qua m\u1EA1ng x\xE3 h\u1ED9i\n3. \u0110\u1EA7u t\u01B0 ti\u1EC1n \u1EA3o c\xF3 l\u1EE3i nhu\u1EADn cao\n4. Gi\u1EA3 m\u1EA1o nh\xE2n vi\xEAn c\xF4ng an\n5. L\u1EEBa \u0111\u1EA3o qua \u1EE9ng d\u1EE5ng h\u1EB9n h\xF2\n6. B\xE1n h\xE0ng online kh\xF4ng giao h\xE0ng\n7. L\u1EEBa \u0111\u1EA3o vay ti\u1EC1n online\n8. Gi\u1EA3 m\u1EA1o nh\xE2n vi\xEAn b\u1EA3o hi\u1EC3m\n9. L\u1EEBa \u0111\u1EA3o qua game online\n10. Chi\u1EBFm \u0111o\u1EA1t t\xE0i kho\u1EA3n Facebook\n\nH\xE3y lu\xF4n c\u1EA3nh gi\xE1c v\xE0 x\xE1c minh th\xF4ng tin t\u1EEB nhi\u1EC1u ngu\u1ED3n tr\u01B0\u1EDBc khi th\u1EF1c hi\u1EC7n b\u1EA5t k\u1EF3 giao d\u1ECBch n\xE0o.",
          coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3",
          tags: ["l\u1EEBa \u0111\u1EA3o online", "ph\xF2ng ch\u1ED1ng", "c\u1EA3nh b\xE1o"],
          readTime: 8,
          views: 0
        },
        {
          title: "C\xE1ch nh\u1EADn bi\u1EBFt tin nh\u1EAFn l\u1EEBa \u0111\u1EA3o t\u1EEB ng\xE2n h\xE0ng",
          slug: "cach-nhan-biet-tin-nhan-lua-dao-tu-ngan-hang",
          excerpt: "H\u01B0\u1EDBng d\u1EABn chi ti\u1EBFt c\xE1ch ph\xE2n bi\u1EC7t tin nh\u1EAFn th\u1EADt v\xE0 gi\u1EA3 t\u1EEB ng\xE2n h\xE0ng \u0111\u1EC3 tr\xE1nh b\u1ECB l\u1EEBa \u0111\u1EA3o...",
          content: "Ng\xE2n h\xE0ng kh\xF4ng bao gi\u1EDD y\xEAu c\u1EA7u th\xF4ng tin c\xE1 nh\xE2n qua tin nh\u1EAFn. D\u01B0\u1EDBi \u0111\xE2y l\xE0 nh\u1EEFng d\u1EA5u hi\u1EC7u nh\u1EADn bi\u1EBFt tin nh\u1EAFn l\u1EEBa \u0111\u1EA3o:\n\n- Y\xEAu c\u1EA7u cung c\u1EA5p m\xE3 OTP\n- Link d\u1EABn \u0111\u1EBFn trang web kh\xF4ng ch\xEDnh th\u1EE9c\n- Th\xF4ng b\xE1o t\xE0i kho\u1EA3n b\u1ECB kh\xF3a \u0111\u1ED9t ng\u1ED9t\n- Y\xEAu c\u1EA7u x\xE1c nh\u1EADn th\xF4ng tin th\u1EBB\n- S\u1ED1 \u0111i\u1EC7n tho\u1EA1i g\u1EEDi tin kh\xF4ng ph\u1EA3i c\u1EE7a ng\xE2n h\xE0ng\n\nLu\xF4n li\xEAn h\u1EC7 tr\u1EF1c ti\u1EBFp v\u1EDBi ng\xE2n h\xE0ng qua hotline ch\xEDnh th\u1EE9c \u0111\u1EC3 x\xE1c minh.",
          coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
          tags: ["ng\xE2n h\xE0ng", "tin nh\u1EAFn", "ph\xF2ng ch\u1ED1ng"],
          readTime: 5,
          views: 0
        },
        {
          title: "L\u1EEBa \u0111\u1EA3o qua m\u1EA1ng x\xE3 h\u1ED9i: C\xE1ch th\u1EE9c v\xE0 ph\xF2ng tr\xE1nh",
          slug: "lua-dao-qua-mang-xa-hoi-cach-thuc-va-phong-tranh",
          excerpt: "Ph\xE2n t\xEDch c\xE1c h\xECnh th\u1EE9c l\u1EEBa \u0111\u1EA3o ph\u1ED5 bi\u1EBFn tr\xEAn Facebook, Zalo v\xE0 c\xE1ch b\u1EA3o v\u1EC7 b\u1EA3n th\xE2n...",
          content: "M\u1EA1ng x\xE3 h\u1ED9i l\xE0 m\xF4i tr\u01B0\u1EDDng m\xE0u m\u1EE1 cho c\xE1c ho\u1EA1t \u0111\u1ED9ng l\u1EEBa \u0111\u1EA3o. C\xE1c th\u1EE7 \u0111o\u1EA1n ph\u1ED5 bi\u1EBFn:\n\n- Gi\u1EA3 m\u1EA1o danh t\xEDnh ng\u01B0\u1EDDi quen\n- B\xE1n h\xE0ng online gi\u1EA3\n- L\u1EEBa \u0111\u1EA3o t\xECnh c\u1EA3m\n- \u0110\u1EA7u t\u01B0 t\xE0i ch\xEDnh \u1EA3o\n- Chi\u1EBFm \u0111o\u1EA1t t\xE0i kho\u1EA3n\n\nC\xE1ch ph\xF2ng tr\xE1nh:\n- X\xE1c minh danh t\xEDnh qua video call\n- Kh\xF4ng chuy\u1EC3n ti\u1EC1n cho ng\u01B0\u1EDDi l\u1EA1\n- Ki\u1EC3m tra th\xF4ng tin ng\u01B0\u1EDDi b\xE1n\n- B\xE1o c\xE1o t\xE0i kho\u1EA3n \u0111\xE1ng ng\u1EDD\n- S\u1EED d\u1EE5ng m\u1EADt kh\u1EA9u m\u1EA1nh",
          coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3",
          tags: ["m\u1EA1ng x\xE3 h\u1ED9i", "facebook", "zalo"],
          readTime: 7,
          views: 0
        }
      ]);
      console.log("\u2713 Sample blog posts added to database");
    }
    if (existingAdmins.length === 0) {
      await db.insert(admins).values([
        {
          username: "admin",
          password: "admin123",
          // Note: In production, this should be hashed
          role: "admin"
        }
      ]);
      console.log("\u2713 Default admin account created (username: admin, password: admin123)");
    }
    console.log("\u2713 Database initialization completed");
  } catch (error) {
    console.error("\u274C Database initialization failed:", error);
    throw error;
  }
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await initializeDatabase();
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
