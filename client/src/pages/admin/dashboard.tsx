import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  FileText, MessageSquare, AlertTriangle, Users, 
  LogOut, Edit, Trash2, Eye, Plus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Report, BlogPost, ChatSession, Admin } from "@shared/schema";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateBlogOpen, setIsCreateBlogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogFormData, setBlogFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    tags: "",
    readTime: 5,
  });

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      setLocation("/admin/login");
      return;
    }
    setAdmin(JSON.parse(adminData));
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    setLocation("/admin/login");
  };

  // Fetch data
  const { data: reports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: () => fetchAPI("/api/admin/reports").then(res => res.json()),
    enabled: !!admin,
  });

  const { data: blogs = [] } = useQuery({
    queryKey: ["/api/blogs"],
    queryFn: () => fetchAPI("/api/blogs").then(res => res.json()),
    enabled: !!admin,
  });

  const { data: chatSessions = [] } = useQuery({
    queryKey: ["/api/admin/chat/sessions"],
    queryFn: () => fetchAPI("/api/admin/chat/sessions").then(res => res.json()),
    enabled: !!admin,
  });

  // Mutations
  const deleteReportMutation = useMutation({
    mutationFn: (id: number) => 
      fetchAPI(`/api/admin/reports/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Đã xóa tố cáo thành công" });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: number) => 
      fetchAPI(`/api/admin/blogs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Đã xóa bài viết thành công" });
    },
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: any) => 
      fetchAPI("/api/blogs", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Đã tạo bài viết thành công" });
      setIsCreateBlogOpen(false);
      resetBlogForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi tạo bài viết", 
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive"
      });
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      fetchAPI(`/api/admin/blogs/${id}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "Đã cập nhật bài viết thành công" });
      setIsCreateBlogOpen(false);
      setEditingBlog(null);
      resetBlogForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Lỗi cập nhật bài viết", 
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive"
      });
    },
  });

  const resetBlogForm = () => {
    setBlogFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      tags: "",
      readTime: 5,
    });
    setEditingBlog(null);
  };

  const handleOpenCreateBlog = () => {
    resetBlogForm();
    setIsCreateBlogOpen(true);
  };

  const handleEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog);
    setBlogFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage || "",
      tags: blog.tags?.join(", ") || "",
      readTime: blog.readTime || 5,
    });
    setIsCreateBlogOpen(true);
  };

  const handleBlogFormChange = (field: string, value: string | number) => {
    setBlogFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitBlog = (e: React.FormEvent) => {
    e.preventDefault();
    
    const blogData = {
      title: blogFormData.title,
      slug: blogFormData.slug,
      excerpt: blogFormData.excerpt,
      content: blogFormData.content,
      coverImage: blogFormData.coverImage || null,
      tags: blogFormData.tags.split(',').map(t => t.trim()).filter(Boolean),
      readTime: Number(blogFormData.readTime),
    };

    if (editingBlog) {
      updateBlogMutation.mutate({ id: editingBlog.id, data: blogData });
    } else {
      createBlogMutation.mutate(blogData);
    }
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Chào mừng {admin.username} - Quản lý hệ thống ChốngLừaĐảo
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng tố cáo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bài viết blog</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blogs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatSessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng lượt xem</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {blogs.reduce((total: number, blog: BlogPost) => total + (blog.views || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">Quản lý tố cáo</TabsTrigger>
            <TabsTrigger value="blogs">Quản lý blog</TabsTrigger>
            <TabsTrigger value="chat">Quản lý chat</TabsTrigger>
          </TabsList>
          
          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách tố cáo</CardTitle>
                <CardDescription>
                  Quản lý tất cả tố cáo lừa đảo trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report: Report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{report.accusedName}</h3>
                          {report.isAnonymous && (
                            <Badge variant="secondary">Ẩn danh</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          SĐT: {report.phoneNumber}
                        </p>
                        {report.accountNumber && (
                          <p className="text-sm text-gray-600 mb-1">
                            STK: {report.accountNumber} - {report.bank}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Số tiền: {report.amount.toLocaleString('vi-VN')} VNĐ
                        </p>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/detail/${report.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteReportMutation.mutate(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Blogs Tab */}
          <TabsContent value="blogs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Quản lý bài viết</CardTitle>
                    <CardDescription>
                      Quản lý các bài viết giáo dục về phòng chống lừa đảo
                    </CardDescription>
                  </div>
                  <Button onClick={handleOpenCreateBlog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài viết mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!
                    </div>
                  ) : (
                    blogs.map((blog: BlogPost) => (
                      <div key={blog.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{blog.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {blog.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>👀 {blog.views || 0} lượt xem</span>
                            <span>⏱️ {blog.readTime} phút đọc</span>
                            {blog.tags && (
                              <div className="flex gap-1">
                                {blog.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBlog(blog)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/blogs/${blog.slug}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteBlogMutation.mutate(blog.id)}
                            disabled={deleteBlogMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chat Sessions</CardTitle>
                <CardDescription>
                  Theo dõi các cuộc trò chuyện với AI chatbot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatSessions.map((session: ChatSession) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">
                          Session: {session.sessionId}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <p>IP: {session.ipAddress || "N/A"}</p>
                          <p>User Agent: {session.userAgent?.slice(0, 60) || "N/A"}...</p>
                          <p>Thời gian: {new Date(session.createdAt!).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/chat/${session.sessionId}`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Blog Dialog */}
      <Dialog open={isCreateBlogOpen} onOpenChange={setIsCreateBlogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBlog ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin bài viết về phòng chống lừa đảo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitBlog} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={blogFormData.title}
                onChange={(e) => handleBlogFormChange("title", e.target.value)}
                placeholder="Nhập tiêu đề bài viết"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={blogFormData.slug}
                onChange={(e) => handleBlogFormChange("slug", e.target.value)}
                placeholder="vd: phong-chong-lua-dao"
                required
              />
              <p className="text-xs text-gray-500">
                Slug là đường dẫn URL của bài viết. Chỉ dùng chữ thường, số và dấu gạch ngang.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Mô tả ngắn *</Label>
              <Textarea
                id="excerpt"
                value={blogFormData.excerpt}
                onChange={(e) => handleBlogFormChange("excerpt", e.target.value)}
                placeholder="Nhập mô tả ngắn gọn về bài viết"
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Nội dung *</Label>
              <Textarea
                id="content"
                value={blogFormData.content}
                onChange={(e) => handleBlogFormChange("content", e.target.value)}
                placeholder="Nhập nội dung chi tiết của bài viết"
                rows={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">URL ảnh bìa</Label>
              <Input
                id="coverImage"
                value={blogFormData.coverImage}
                onChange={(e) => handleBlogFormChange("coverImage", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={blogFormData.tags}
                  onChange={(e) => handleBlogFormChange("tags", e.target.value)}
                  placeholder="lừa đảo, ngân hàng, mạo danh"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readTime">Thời gian đọc (phút)</Label>
                <Input
                  id="readTime"
                  type="number"
                  value={blogFormData.readTime}
                  onChange={(e) => handleBlogFormChange("readTime", parseInt(e.target.value) || 5)}
                  min="1"
                  max="60"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateBlogOpen(false);
                  resetBlogForm();
                }}
              >
                Hủy
              </Button>
              <Button 
                type="submit"
                disabled={createBlogMutation.isPending || updateBlogMutation.isPending}
              >
                {createBlogMutation.isPending || updateBlogMutation.isPending 
                  ? "Đang xử lý..." 
                  : editingBlog 
                    ? "Cập nhật" 
                    : "Tạo bài viết"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}