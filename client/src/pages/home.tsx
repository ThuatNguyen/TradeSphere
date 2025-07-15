import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, Eye, Calendar, DollarSign, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Report } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recentReports } = useQuery({
    queryKey: ["/api/reports/recent"],
    queryFn: () => api.getRecentReports(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const setExample = (example: string) => {
    setSearchQuery(example);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Bảo vệ bản thân khỏi lừa đảo
            </h1>
            <p className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Kiểm tra thông tin lừa đảo, tố cáo kẻ xấu và chia sẻ kinh nghiệm để bảo vệ cộng đồng
            </p>
            
            {/* Search Form */}
            <div className="max-w-2xl mx-auto">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Tìm kiếm thông tin lừa đảo</h3>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập số điện thoại, số tài khoản hoặc link nghi ngờ..."
                      className="pr-20"
                    />
                    <Button 
                      type="submit" 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-slate-600">Ví dụ:</span>
                    <button 
                      type="button" 
                      onClick={() => setExample("0123456789")}
                      className="text-primary hover:underline"
                    >
                      0123456789
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setExample("1234567890123")}
                      className="text-primary hover:underline"
                    >
                      1234567890123
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setExample("bit.ly/scam-link")}
                      className="text-primary hover:underline"
                    >
                      bit.ly/scam-link
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Tố cáo gần đây</h2>
        
        {recentReports?.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-600">Chưa có tố cáo nào. Hãy là người đầu tiên báo cáo thông tin lừa đảo!</p>
            <Link href="/report">
              <Button className="mt-4">Tạo tố cáo đầu tiên</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentReports?.map((report: Report) => (
              <Link key={report.id} href={`/detail/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                          {report.accusedName}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {report.phoneNumber}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Lừa đảo
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-warning font-semibold">
                          {formatCurrency(report.amount)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(report.createdAt!)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
