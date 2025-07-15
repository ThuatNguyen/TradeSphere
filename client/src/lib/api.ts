import { apiRequest } from "./queryClient";

export const api = {
  // Search
  search: async (query: string) => {
    const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Reports
  getRecentReports: async (limit = 6) => {
    const response = await apiRequest("GET", `/api/reports/recent?limit=${limit}`);
    return response.json();
  },

  createReport: async (data: any) => {
    const response = await apiRequest("POST", "/api/reports", data);
    return response.json();
  },

  getReport: async (id: number) => {
    const response = await apiRequest("GET", `/api/reports/${id}`);
    return response.json();
  },

  // Blogs
  getAllBlogs: async (search?: string) => {
    const url = search ? `/api/blogs?search=${encodeURIComponent(search)}` : "/api/blogs";
    const response = await apiRequest("GET", url);
    return response.json();
  },

  getBlogBySlug: async (slug: string) => {
    const response = await apiRequest("GET", `/api/blogs/slug/${slug}`);
    return response.json();
  },

  getBlog: async (id: number) => {
    const response = await apiRequest("GET", `/api/blogs/${id}`);
    return response.json();
  },

  // Chat
  sendChatMessage: async (message: string) => {
    const response = await apiRequest("POST", "/api/chat", { message });
    return response.json();
  },
};
