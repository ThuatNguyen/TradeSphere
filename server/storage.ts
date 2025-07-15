import { 
  users, reports, blogPosts, admins, chatSessions, chatMessages,
  type User, type InsertUser, type Report, type InsertReport, 
  type BlogPost, type InsertBlogPost, type UpdateBlogPost,
  type Admin, type InsertAdmin, type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  searchReports(query: string): Promise<Report[]>;
  getRecentReports(limit?: number): Promise<Report[]>;
  getAllReports(limit?: number, offset?: number): Promise<Report[]>;
  updateReport(id: number, data: Partial<Report>): Promise<Report>;
  deleteReport(id: number): Promise<void>;
  
  // Blog operations
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(search?: string): Promise<BlogPost[]>;
  updateBlogPostViews(id: number): Promise<void>;
  updateBlogPost(id: number, data: UpdateBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  
  // Admin operations
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  getAllChatSessions(limit?: number): Promise<ChatSession[]>;
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
        isAnonymous: insertReport.isAnonymous || false,
        reporterName: insertReport.reporterName || null,
        reporterPhone: insertReport.reporterPhone || null,
        receiptUrl: null
      })
      .returning();
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async searchReports(query: string): Promise<Report[]> {
    const searchLower = query.toLowerCase().trim();
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    
    return allReports.filter(report => 
      report.accusedName.toLowerCase().includes(searchLower) ||
      report.phoneNumber.includes(query) ||
      (report.accountNumber && report.accountNumber.includes(query))
    );
  }

  async getRecentReports(limit = 6): Promise<Report[]> {
    return await db.select().from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit);
  }

  async getAllReports(limit = 50, offset = 0): Promise<Report[]> {
    return await db.select().from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateReport(id: number, data: Partial<Report>): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set(data)
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...insertPost,
        coverImage: insertPost.coverImage || null,
        tags: insertPost.tags || null,
        readTime: insertPost.readTime || 5
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

  async getAllBlogPosts(search?: string): Promise<BlogPost[]> {
    const allPosts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    
    if (!search) {
      return allPosts;
    }
    
    const searchLower = search.toLowerCase();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(searchLower) ||
      post.excerpt.toLowerCase().includes(searchLower) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
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
    const [post] = await db
      .update(blogPosts)
      .set(data)
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
      .values(insertAdmin)
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

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId));
    return session || undefined;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.timestamp))
      .limit(limit);
  }

  async getAllChatSessions(limit = 100): Promise<ChatSession[]> {
    return await db.select().from(chatSessions)
      .orderBy(desc(chatSessions.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();