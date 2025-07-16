import { 
  users, reports, blogPosts, admins, chatSessions, chatMessages, reportCategories, 
  blogCategories, systemSettings, auditLogs,
  type User, type InsertUser, type Report, type InsertReport, type UpdateReport,
  type BlogPost, type InsertBlogPost, type UpdateBlogPost,
  type Admin, type InsertAdmin, type UpdateAdmin,
  type ChatSession, type InsertChatSession, type UpdateChatSession,
  type ChatMessage, type InsertChatMessage,
  type ReportCategory, type InsertReportCategory,
  type BlogCategory, type InsertBlogCategory,
  type SystemSetting, type InsertSystemSetting,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc, asc, sql, and, or, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  searchReports(query: string, filters?: ReportFilters): Promise<Report[]>;
  getRecentReports(limit?: number): Promise<Report[]>;
  getAllReports(limit?: number, offset?: number, filters?: ReportFilters): Promise<Report[]>;
  getReportsByStatus(status: string, limit?: number): Promise<Report[]>;
  updateReport(id: number, data: UpdateReport): Promise<Report>;
  deleteReport(id: number): Promise<void>;
  updateReportStatus(id: number, status: string, verifiedBy?: string): Promise<Report>;
  
  // Blog operations
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(search?: string, filters?: BlogFilters): Promise<BlogPost[]>;
  getBlogPostsByCategory(category: string, limit?: number): Promise<BlogPost[]>;
  getFeaturedBlogPosts(limit?: number): Promise<BlogPost[]>;
  updateBlogPostViews(id: number): Promise<void>;
  updateBlogPost(id: number, data: UpdateBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  
  // Admin operations
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  updateAdmin(id: number, data: UpdateAdmin): Promise<Admin>;
  updateAdminLastLogin(id: number): Promise<void>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  updateChatSession(sessionId: string, data: UpdateChatSession): Promise<ChatSession>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  getAllChatSessions(limit?: number, filters?: ChatFilters): Promise<ChatSession[]>;
  markChatMessagesAsRead(sessionId: string): Promise<void>;
  
  // Category operations
  createReportCategory(category: InsertReportCategory): Promise<ReportCategory>;
  getReportCategories(): Promise<ReportCategory[]>;
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  getBlogCategories(): Promise<BlogCategory[]>;
  
  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  
  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  
  // Analytics
  getReportStats(): Promise<ReportStats>;
  getBlogStats(): Promise<BlogStats>;
  getChatStats(): Promise<ChatStats>;
}

export interface ReportFilters {
  status?: string;
  category?: string;
  priority?: string;
  isPublic?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface BlogFilters {
  category?: string;
  status?: string;
  featured?: boolean;
  authorId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ChatFilters {
  status?: string;
  priority?: string;
  assignedAdmin?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReportStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  investigating: number;
  byCategory: Array<{ category: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  recentTrend: Array<{ date: string; count: number }>;
}

export interface BlogStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  byCategory: Array<{ category: string; count: number }>;
  mostViewed: Array<{ id: number; title: string; views: number }>;
}

export interface ChatStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values({
        ...insertReport,
        accountNumber: insertReport.accountNumber || null,
        bank: insertReport.bank || null,
        evidenceUrls: insertReport.evidenceUrls || [],
        isAnonymous: insertReport.isAnonymous || false,
        reporterName: insertReport.reporterName || null,
        reporterPhone: insertReport.reporterPhone || null,
        receiptUrl: insertReport.receiptUrl || null,
        status: insertReport.status || "pending",
        priority: insertReport.priority || "medium",
        category: insertReport.category || "fraud",
        isPublic: insertReport.isPublic !== undefined ? insertReport.isPublic : true,
        updatedAt: new Date()
      })
      .returning();
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async searchReports(query: string, filters?: ReportFilters): Promise<Report[]> {
    let whereConditions = [];
    
    if (query) {
      const searchLower = query.toLowerCase().trim();
      whereConditions.push(
        or(
          sql`lower(${reports.accusedName}) LIKE ${'%' + searchLower + '%'}`,
          sql`${reports.phoneNumber} LIKE ${'%' + query + '%'}`,
          sql`${reports.accountNumber} LIKE ${'%' + query + '%'}`,
          sql`lower(${reports.description}) LIKE ${'%' + searchLower + '%'}`
        )
      );
    }
    
    if (filters?.status) {
      whereConditions.push(eq(reports.status, filters.status));
    }
    
    if (filters?.category) {
      whereConditions.push(eq(reports.category, filters.category));
    }
    
    if (filters?.priority) {
      whereConditions.push(eq(reports.priority, filters.priority));
    }
    
    if (filters?.isPublic !== undefined) {
      whereConditions.push(eq(reports.isPublic, filters.isPublic));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    return await db.select().from(reports)
      .where(whereClause)
      .orderBy(desc(reports.createdAt));
  }

  async getRecentReports(limit = 6): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.isPublic, true))
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }

  async getAllReports(limit = 50, offset = 0, filters?: ReportFilters): Promise<Report[]> {
    let whereConditions = [];
    
    if (filters?.status) {
      whereConditions.push(eq(reports.status, filters.status));
    }
    
    if (filters?.category) {
      whereConditions.push(eq(reports.category, filters.category));
    }
    
    if (filters?.priority) {
      whereConditions.push(eq(reports.priority, filters.priority));
    }
    
    if (filters?.isPublic !== undefined) {
      whereConditions.push(eq(reports.isPublic, filters.isPublic));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    return await db.select().from(reports)
      .where(whereClause)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getReportsByStatus(status: string, limit = 50): Promise<Report[]> {
    return await db.select().from(reports)
      .where(eq(reports.status, status))
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }

  async updateReport(id: number, data: UpdateReport): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async updateReportStatus(id: number, status: string, verifiedBy?: string): Promise<Report> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === "verified" && verifiedBy) {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = verifiedBy;
    }
    
    const [report] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...insertPost,
        coverImage: insertPost.coverImage || null,
        tags: insertPost.tags || [],
        readTime: insertPost.readTime || 5,
        category: insertPost.category || "general",
        status: insertPost.status || "published",
        featured: insertPost.featured || false,
        authorName: insertPost.authorName || "Admin",
        publishedAt: insertPost.status === "published" ? new Date() : null,
        updatedAt: new Date()
      })
      .returning();
    return post;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async getAllBlogPosts(search?: string, filters?: BlogFilters): Promise<BlogPost[]> {
    let whereConditions = [];
    
    if (search) {
      const searchLower = search.toLowerCase();
      whereConditions.push(
        or(
          sql`lower(${blogPosts.title}) LIKE ${'%' + searchLower + '%'}`,
          sql`lower(${blogPosts.excerpt}) LIKE ${'%' + searchLower + '%'}`,
          sql`lower(${blogPosts.content}) LIKE ${'%' + searchLower + '%'}`
        )
      );
    }
    
    if (filters?.category) {
      whereConditions.push(eq(blogPosts.category, filters.category));
    }
    
    if (filters?.status) {
      whereConditions.push(eq(blogPosts.status, filters.status));
    }
    
    if (filters?.featured !== undefined) {
      whereConditions.push(eq(blogPosts.featured, filters.featured));
    }
    
    if (filters?.authorId) {
      whereConditions.push(eq(blogPosts.authorId, filters.authorId));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    return await db.select().from(blogPosts)
      .where(whereClause)
      .orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostsByCategory(category: string, limit = 10): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.category, category),
        eq(blogPosts.status, "published")
      ))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit);
  }

  async getFeaturedBlogPosts(limit = 5): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(and(
        eq(blogPosts.featured, true),
        eq(blogPosts.status, "published")
      ))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit);
  }

  async updateBlogPostViews(id: number): Promise<void> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (post) {
      await db
        .update(blogPosts)
        .set({ views: (post.views || 0) + 1 })
        .where(eq(blogPosts.id, id));
    }
  }

  async updateBlogPost(id: number, data: UpdateBlogPost): Promise<BlogPost> {
    const updateData = { ...data, updatedAt: new Date() };
    
    if (data.status === "published" && !data.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    const [post] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values({
        ...insertAdmin,
        permissions: insertAdmin.permissions || [],
        isActive: insertAdmin.isActive !== undefined ? insertAdmin.isActive : true
      })
      .returning();
    return admin;
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async updateAdmin(id: number, data: UpdateAdmin): Promise<Admin> {
    const [admin] = await db
      .update(admins)
      .set(data)
      .where(eq(admins.id, id))
      .returning();
    return admin;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db
      .update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id));
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values({
        ...insertSession,
        status: insertSession.status || "active",
        priority: insertSession.priority || "normal",
        tags: insertSession.tags || [],
        metadata: insertSession.metadata || {},
        updatedAt: new Date()
      })
      .returning();
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateChatSession(sessionId: string, data: UpdateChatSession): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatSessions.sessionId, sessionId))
      .returning();
    return session;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...insertMessage,
        messageType: insertMessage.messageType || "text",
        metadata: insertMessage.metadata || {},
        isRead: insertMessage.isRead || false
      })
      .returning();
    return message;
  }

  async getChatMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.timestamp))
      .limit(limit);
  }

  async getAllChatSessions(limit = 100, filters?: ChatFilters): Promise<ChatSession[]> {
    let whereConditions = [];
    
    if (filters?.status) {
      whereConditions.push(eq(chatSessions.status, filters.status));
    }
    
    if (filters?.priority) {
      whereConditions.push(eq(chatSessions.priority, filters.priority));
    }
    
    if (filters?.assignedAdmin) {
      whereConditions.push(eq(chatSessions.assignedAdmin, filters.assignedAdmin));
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    return await db.select().from(chatSessions)
      .where(whereClause)
      .orderBy(desc(chatSessions.createdAt))
      .limit(limit);
  }

  async markChatMessagesAsRead(sessionId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(eq(chatMessages.sessionId, sessionId));
  }

  async createReportCategory(insertCategory: InsertReportCategory): Promise<ReportCategory> {
    const [category] = await db
      .insert(reportCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getReportCategories(): Promise<ReportCategory[]> {
    return await db.select().from(reportCategories)
      .where(eq(reportCategories.isActive, true))
      .orderBy(asc(reportCategories.name));
  }

  async createBlogCategory(insertCategory: InsertBlogCategory): Promise<BlogCategory> {
    const [category] = await db
      .insert(blogCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db.select().from(blogCategories)
      .where(eq(blogCategories.isActive, true))
      .orderBy(asc(blogCategories.name));
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    // For SQLite, we need to implement upsert manually
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      const [setting] = await db
        .update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return setting;
    } else {
      const [setting] = await db
        .insert(systemSettings)
        .values({ key, value, updatedAt: new Date() })
        .returning();
      return setting;
    }
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(asc(systemSettings.key));
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async getReportStats(): Promise<ReportStats> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(reports);
    const total = totalResult[0].count;
    
    const statusCounts = await db.select({
      status: reports.status,
      count: sql<number>`count(*)`
    }).from(reports).groupBy(reports.status);
    
    const categoryCounts = await db.select({
      category: reports.category,
      count: sql<number>`count(*)`
    }).from(reports).groupBy(reports.category);
    
    const priorityCounts = await db.select({
      priority: reports.priority,
      count: sql<number>`count(*)`
    }).from(reports).groupBy(reports.priority);
    
    return {
      total,
      pending: statusCounts.find(s => s.status === "pending")?.count || 0,
      verified: statusCounts.find(s => s.status === "verified")?.count || 0,
      rejected: statusCounts.find(s => s.status === "rejected")?.count || 0,
      investigating: statusCounts.find(s => s.status === "investigating")?.count || 0,
      byCategory: categoryCounts,
      byPriority: priorityCounts,
      recentTrend: [] // Would need more complex query for time series
    };
  }

  async getBlogStats(): Promise<BlogStats> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    const total = totalResult[0].count;
    
    const statusCounts = await db.select({
      status: blogPosts.status,
      count: sql<number>`count(*)`
    }).from(blogPosts).groupBy(blogPosts.status);
    
    const viewsResult = await db.select({
      totalViews: sql<number>`sum(${blogPosts.views})`
    }).from(blogPosts);
    
    const categoryCounts = await db.select({
      category: blogPosts.category,
      count: sql<number>`count(*)`
    }).from(blogPosts).groupBy(blogPosts.category);
    
    const mostViewed = await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      views: blogPosts.views
    }).from(blogPosts)
      .orderBy(desc(blogPosts.views))
      .limit(5);
    
    return {
      total,
      published: statusCounts.find(s => s.status === "published")?.count || 0,
      draft: statusCounts.find(s => s.status === "draft")?.count || 0,
      archived: statusCounts.find(s => s.status === "archived")?.count || 0,
      totalViews: viewsResult[0].totalViews || 0,
      byCategory: categoryCounts,
      mostViewed: mostViewed.map(p => ({ id: p.id, title: p.title, views: p.views || 0 }))
    };
  }

  async getChatStats(): Promise<ChatStats> {
    const totalSessionsResult = await db.select({ count: sql<number>`count(*)` }).from(chatSessions);
    const totalSessions = totalSessionsResult[0].count;
    
    const statusCounts = await db.select({
      status: chatSessions.status,
      count: sql<number>`count(*)`
    }).from(chatSessions).groupBy(chatSessions.status);
    
    const priorityCounts = await db.select({
      priority: chatSessions.priority,
      count: sql<number>`count(*)`
    }).from(chatSessions).groupBy(chatSessions.priority);
    
    const totalMessagesResult = await db.select({ count: sql<number>`count(*)` }).from(chatMessages);
    const totalMessages = totalMessagesResult[0].count;
    
    return {
      totalSessions,
      activeSessions: statusCounts.find(s => s.status === "active")?.count || 0,
      totalMessages,
      avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
      byStatus: statusCounts,
      byPriority: priorityCounts
    };
  }
}

export const storage = new DatabaseStorage();