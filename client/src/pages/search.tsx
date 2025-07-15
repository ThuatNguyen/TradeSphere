import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { Report } from "@shared/schema";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Get query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
      setHasSearched(true);
    }
  }, []);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: () => api.search(searchQuery),
    enabled: hasSearched && searchQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
      // Update URL without navigation
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery)}`);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Tìm kiếm thông tin lừa đảo
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Nhập số điện thoại, số tài khoản ngân hàng hoặc link nghi ngờ để kiểm tra thông tin lừa đảo
        </p>
        
        {/* Search Form */}
        <Card className="max-w-2xl mx-auto p-6">
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
                disabled={isLoading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Kết quả tìm kiếm</h2>
            {searchResults && (
              <span className="text-sm text-slate-600">
                Tìm thấy {searchResults.length} kết quả cho "{searchQuery}"
              </span>
            )}
          </div>
          
          {isLoading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-slate-600">Đang tìm kiếm...</p>
            </Card>
          ) : searchResults?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-600 mb-4">
                Không tìm thấy thông tin lừa đảo nào cho "{searchQuery}"
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Điều này có thể là tin tốt! Tuy nhiên, hãy luôn cảnh giác với các giao dịch trực tuyến.
              </p>
              <Link href="/report">
                <Button>Báo cáo nếu bạn nghi ngờ</Button>
              </Link>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên người bị tố cáo</TableHead>
                      <TableHead>Số tài khoản</TableHead>
                      <TableHead>Ngân hàng</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngày tố cáo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults?.map((result: Report) => (
                      <TableRow 
                        key={result.id} 
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => window.location.href = `/detail/${result.id}`}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {result.accusedName}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {result.accountNumber || "-"}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {result.bank || "-"}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {result.phoneNumber}
                        </TableCell>
                        <TableCell>
                          <span className="text-warning font-semibold">
                            {formatCurrency(result.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {formatDate(result.createdAt!)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
