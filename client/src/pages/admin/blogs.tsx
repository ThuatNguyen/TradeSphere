import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchAPI } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@shared/schema";

export default function BlogsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    tags: "",
    readTime: 5,
  });

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["/api/v1/blogs"],
    queryFn: () => {
      console.log('📚 Fetching blogs...');
      return fetchAPI("/api/v1/blogs").then(res => res.json());
    },
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: any) =>
      fetchAPI("/api/v1/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/blogs"] });
      toast({ title: "Đã tạo bài viết thành công" });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetchAPI(`/api/v1/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/blogs"] });
      toast({ title: "Đã cập nhật bài viết thành công" });
      setIsCreateOpen(false);
      setEditingBlog(null);
      resetForm();
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: number) =>
      fetchAPI(`/api/v1/blogs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/blogs"] });
      toast({ title: "Đã xóa bài viết thành công" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      tags: "",
      readTime: 5,
    });
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      coverImage: blog.coverImage || "",
      tags: blog.tags?.join(", ") || "",
      readTime: blog.readTime || 5,
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const blogData = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    if (editingBlog) {
      updateBlogMutation.mutate({ id: editingBlog.id, data: blogData });
    } else {
      createBlogMutation.mutate(blogData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý blog</h1>
            <p className="text-muted-foreground">
              Tạo và quản lý các bài viết về phòng chống lừa đảo
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo bài viết mới
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </CardContent>
          </Card>
        ) : blogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Chưa có bài viết nào</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo bài viết đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {blogs.map((blog: BlogPost) => (
              <Card key={blog.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{blog.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {blog.excerpt}
                      </p>
                    </div>
                    <Badge variant={blog.published ? "default" : "secondary"}>
                      {blog.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>📅 {formatDate(blog.createdAt!)}</span>
                    <span>👁️ {blog.views || 0} lượt xem</span>
                    <span>⏱️ {blog.readTime} phút đọc</span>
                  </div>

                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/blogs/${blog.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(blog)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBlogMutation.mutate(blog.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBlog ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin bài viết về phòng chống lừa đảo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tiêu đề bài viết"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="slug-bai-viet"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Mô tả ngắn</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Mô tả ngắn về bài viết"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Nội dung bài viết (Markdown)"
                  rows={10}
                />
              </div>

              <div>
                <Label htmlFor="coverImage">Ảnh bìa (URL)</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (ngăn cách bằng dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="lừa đảo, bảo mật, cảnh báo"
                />
              </div>

              <div>
                <Label htmlFor="readTime">Thời gian đọc (phút)</Label>
                <Input
                  id="readTime"
                  type="number"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingBlog(null);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createBlogMutation.isPending || updateBlogMutation.isPending}
              >
                {createBlogMutation.isPending || updateBlogMutation.isPending
                  ? "Đang xử lý..."
                  : editingBlog
                    ? "Cập nhật"
                    : "Tạo bài viết"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
