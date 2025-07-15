import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, Calendar, Clock, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { BlogPost } from "@shared/schema";

export default function BlogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ["/api/blogs", searchQuery],
    queryFn: () => api.getAllBlogs(searchQuery),
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const featuredPost = blogPosts?.[0];
  const otherPosts = blogPosts?.slice(1) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Blog Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Blog thủ đoạn lừa đảo
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Cập nhật những thủ đoạn lừa đảo mới nhất và cách phòng tránh hiệu quả
        </p>
        
        {/* Blog Search */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Đang tải bài viết...</p>
        </div>
      ) : blogPosts?.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">
            {searchQuery 
              ? `Không tìm thấy bài viết nào cho "${searchQuery}"`
              : "Chưa có bài viết nào."
            }
          </p>
        </Card>
      ) : (
        <>
          {/* Featured Article */}
          {featuredPost && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Bài viết nổi bật</h2>
              <Link href={`/blogs/${featuredPost.slug}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <img 
                        src={featuredPost.coverImage || "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
                        alt={featuredPost.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-1/2 p-8">
                      <div className="mb-4 flex flex-wrap gap-2">
                        <Badge variant="destructive" className="text-xs">
                          Hot
                        </Badge>
                        {featuredPost.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4">
                        {featuredPost.title}
                      </h3>
                      <p className="text-slate-600 mb-6 text-base">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-slate-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(featuredPost.createdAt!)}</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            <span>{featuredPost.views || 0} lượt xem</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {/* Blog Grid */}
          {otherPosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Tất cả bài viết</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPosts.map((post: BlogPost) => (
                  <Link key={post.id} href={`/blogs/${post.slug}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                      <div className="aspect-w-16 aspect-h-9">
                        <img 
                          src={post.coverImage || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"} 
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="mb-3 flex flex-wrap gap-1">
                          {post.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(post.createdAt!)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{post.readTime || 5} phút đọc</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
