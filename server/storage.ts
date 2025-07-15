import { users, reports, blogPosts, type User, type InsertUser, type Report, type InsertReport, type BlogPost, type InsertBlogPost } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  searchReports(query: string): Promise<Report[]>;
  getRecentReports(limit?: number): Promise<Report[]>;
  
  // Blog operations
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(search?: string): Promise<BlogPost[]>;
  updateBlogPostViews(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private blogPosts: Map<number, BlogPost>;
  private currentUserId: number;
  private currentReportId: number;
  private currentBlogId: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.blogPosts = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
    this.currentBlogId = 1;
    
    // Initialize with some sample blog posts
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample reports
    const sampleReports: InsertReport[] = [
      {
        accusedName: "Nguyễn Văn A",
        phoneNumber: "0123456789",
        accountNumber: "1234567890123",
        bank: "vietcombank",
        amount: 5000000,
        description: "Lừa đảo qua Facebook bằng cách giả mạo bán hàng online. Đã chuyển tiền nhưng không nhận được hàng và bị chặn liên lạc.",
        isAnonymous: false,
        reporterName: "Trần Thị B",
        reporterPhone: "0987654321"
      },
      {
        accusedName: "Lê Minh C",
        phoneNumber: "0987123456",
        accountNumber: "9876543210987",
        bank: "techcombank",
        amount: 10000000,
        description: "Lừa đảo đầu tư tiền ảo với lời hứa lợi nhuận cao. Sau khi chuyển tiền không thể rút được và mất liên lạc.",
        isAnonymous: true,
        reporterName: null,
        reporterPhone: null
      },
      {
        accusedName: "Phạm Văn D",
        phoneNumber: "0369852147",
        accountNumber: null,
        bank: null,
        amount: 2000000,
        description: "Lừa đảo qua tin nhắn giả mạo ngân hàng yêu cầu cập nhật thông tin và lấy mã OTP.",
        isAnonymous: false,
        reporterName: "Hoàng Thị E",
        reporterPhone: "0912345678"
      }
    ];

    sampleReports.forEach(report => this.createReport(report));

    const sampleBlogs: InsertBlogPost[] = [
      {
        title: "10 thủ đoạn lừa đảo phổ biến nhất năm 2024",
        slug: "10-thu-doan-lua-dao-pho-bien-nhat-2024",
        excerpt: "Cập nhật những phương thức lừa đảo mới nhất mà các kẻ xấu đang sử dụng để chiếm đoạt tài sản của người dân. Từ việc giả mạo ngân hàng đến lừa đảo đầu tư...",
        content: "Nội dung chi tiết về các thủ đoạn lừa đảo phổ biến năm 2024...",
        coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3",
        tags: ["lừa đảo online", "phòng chống", "cảnh báo"],
        readTime: 8,
      },
      {
        title: "Cách nhận biết tin nhắn lừa đảo từ ngân hàng",
        slug: "cach-nhan-biet-tin-nhan-lua-dao-tu-ngan-hang",
        excerpt: "Hướng dẫn chi tiết cách phân biệt tin nhắn thật và giả từ ngân hàng để tránh bị lừa đảo...",
        content: "Hướng dẫn chi tiết về cách nhận biết tin nhắn lừa đảo...",
        coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
        tags: ["ngân hàng", "tin nhắn", "phòng chống"],
        readTime: 5,
      },
      {
        title: "Lừa đảo qua mạng xã hội: Cách thức và phòng tránh",
        slug: "lua-dao-qua-mang-xa-hoi-cach-thuc-va-phong-tranh",
        excerpt: "Phân tích các hình thức lừa đảo phổ biến trên Facebook, Zalo và cách bảo vệ bản thân...",
        content: "Chi tiết về lừa đảo qua mạng xã hội...",
        coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3",
        tags: ["mạng xã hội", "facebook", "zalo"],
        readTime: 7,
      }
    ];

    sampleBlogs.forEach(blog => this.createBlogPost(blog));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = { 
      ...insertReport,
      id, 
      createdAt: new Date(),
      accountNumber: insertReport.accountNumber || null,
      bank: insertReport.bank || null,
      isAnonymous: insertReport.isAnonymous || false,
      reporterName: insertReport.reporterName || null,
      reporterPhone: insertReport.reporterPhone || null,
      receiptUrl: null
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async searchReports(query: string): Promise<Report[]> {
    const allReports = Array.from(this.reports.values());
    if (!query) return allReports.slice(0, 10);
    
    const searchLower = query.toLowerCase();
    return allReports.filter(report => 
      report.phoneNumber.includes(query) ||
      report.accountNumber?.includes(query) ||
      report.accusedName.toLowerCase().includes(searchLower) ||
      report.description.toLowerCase().includes(searchLower)
    );
  }

  async getRecentReports(limit = 6): Promise<Report[]> {
    const allReports = Array.from(this.reports.values());
    return allReports
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogId++;
    const post: BlogPost = { 
      ...insertPost, 
      id, 
      views: 0,
      createdAt: new Date(),
      coverImage: insertPost.coverImage || null,
      tags: insertPost.tags || null,
      readTime: insertPost.readTime || 5
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async getAllBlogPosts(search?: string): Promise<BlogPost[]> {
    const allPosts = Array.from(this.blogPosts.values());
    if (!search) {
      return allPosts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    const searchLower = search.toLowerCase();
    return allPosts
      .filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateBlogPostViews(id: number): Promise<void> {
    const post = this.blogPosts.get(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.blogPosts.set(id, post);
    }
  }
}

export const storage = new MemStorage();
