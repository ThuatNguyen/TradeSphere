import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const reports = pgTable("reports", {
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  tags: text("tags").array(),
  readTime: integer("read_time").default(5),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  views: true,
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// Update blog post schema for admin operations
export const updateBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  views: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;

// New tables for Python API integration
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

// Insert schemas for new tables
export const insertScamSearchSchema = createInsertSchema(scamSearches).omit({
  id: true,
  searchTime: true,
});

export const insertZaloUserSchema = createInsertSchema(zaloUsers).omit({
  id: true,
  followedAt: true,
});

export const insertZaloMessageSchema = createInsertSchema(zaloMessages).omit({
  id: true,
  sentAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertApiLogSchema = createInsertSchema(apiLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertScamSearch = z.infer<typeof insertScamSearchSchema>;
export type ScamSearch = typeof scamSearches.$inferSelect;
export type InsertZaloUser = z.infer<typeof insertZaloUserSchema>;
export type ZaloUser = typeof zaloUsers.$inferSelect;
export type InsertZaloMessage = z.infer<typeof insertZaloMessageSchema>;
export type ZaloMessage = typeof zaloMessages.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertApiLog = z.infer<typeof insertApiLogSchema>;
export type ApiLog = typeof apiLogs.$inferSelect;
