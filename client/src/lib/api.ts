import { apiRequest } from "./queryClient";

export const api = {
  // Search
  search: async (query: string) => {
    const response = await apiRequest("GET", `/api/v1/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Scam Search
  searchScam: async (keyword: string) => {
    const response = await apiRequest("GET", `/api/v1/scams/search?keyword=${encodeURIComponent(keyword)}`);
    return response.json();
  },

  // Reports
  getRecentReports: async (limit = 6) => {
    const response = await apiRequest("GET", `/api/v1/reports/recent?limit=${limit}`);
    return response.json();
  },

  createReport: async (data: any) => {
    const response = await apiRequest("POST", "/api/v1/reports", data);
    return response.json();
  },

  getReport: async (id: number) => {
    const response = await apiRequest("GET", `/api/v1/reports/${id}`);
    return response.json();
  },

  // Blogs
  getAllBlogs: async (search?: string) => {
    const url = search ? `/api/v1/blogs?search=${encodeURIComponent(search)}` : "/api/v1/blogs";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  getBlogBySlug: async (slug: string) => {
    const response = await apiRequest("GET", `/api/v1/blogs/slug/${slug}`);
    return response.json();
  },

  getBlog: async (id: number) => {
    const response = await apiRequest("GET", `/api/v1/blogs/${id}`);
    return response.json();
  },

  // Chat
  sendChatMessage: async (message: string, sessionId?: string) => {
    const response = await apiRequest("POST", "/api/v1/chat", { message, sessionId });
    return response.json();
  },
};
