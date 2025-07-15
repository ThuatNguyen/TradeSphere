import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Clock, Eye, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface BlogDetailProps {
  params: {
    slug: string;
  };
}

export default function BlogDetail({ params }: BlogDetailProps) {
  const { data: blogPost, isLoading } = useQuery({
    queryKey: ["/api/blogs/slug", params.slug],
    queryFn: () => api.getBlogBySlug(params.slug),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-slate-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Bài viết không tồn tại</h1>
          <p className="text-slate-600 mb-6">Không tìm thấy bài viết bạn đang tìm kiếm.</p>
          <Link href="/blogs">
            <Button>Quay lại danh sách bài viết</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/blogs">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách bài viết
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <article>
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {blogPost.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            {blogPost.title}
          </h1>
          
          <div className="flex items-center text-sm text-slate-600 space-x-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(blogPost.createdAt!)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{blogPost.readTime || 5} phút đọc</span>
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              <span>{blogPost.views || 0} lượt xem</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {blogPost.coverImage && (
          <div className="mb-8">
            <img 
              src={blogPost.coverImage} 
              alt={blogPost.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-slate max-w-none">
          <div className="text-lg text-slate-600 mb-8 p-6 bg-slate-50 rounded-lg border-l-4 border-primary">
            {blogPost.excerpt}
          </div>
          
          {/* Main Content */}
          <div className="text-slate-700 leading-relaxed space-y-6">
            {blogPost.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-base leading-7">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Bài viết hữu ích? Chia sẻ để bảo vệ người thân và bạn bè khỏi lừa đảo.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Chia sẻ
              </Button>
              <Link href="/report">
                <Button size="sm">
                  Báo cáo lừa đảo
                </Button>
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
