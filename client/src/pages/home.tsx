import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, Calendar, DollarSign, AlertTriangle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Report } from "@shared/schema";

interface ScamResult {
  name?: string;
  phone?: string;
  account_number?: string;
  bank?: string;
  amount?: string;
  views?: string;
  date?: string;
  detail_link?: string;
}

interface SourceResult {
  success: boolean;
  source: string;
  keyword: string;
  total_scams: string | number;
  data: ScamResult[];
  error?: string;
}

interface SearchResponse {
  success: boolean;
  keyword: string;
  total_results: number;
  sources: SourceResult[];
  cached?: boolean;
  response_time_ms?: number;
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: recentReports } = useQuery({
    queryKey: ["/api/reports/recent"],
    queryFn: () => api.getRecentReports(),
  });

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/v1/scams/search?keyword=${encodeURIComponent(keyword)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tìm kiếm");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
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
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Bảo vệ bản thân khỏi lừa đảo
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Kiểm tra thông tin lừa đảo, tố cáo kẻ xấu và chia sẻ kinh nghiệm để bảo vệ cộng đồng
            </p>
          </div>

          {/* Search Box */}
          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tìm kiếm thông tin lừa đảo</h2>
                <p className="text-gray-600">
                  Nhập số điện thoại, số tài khoản hoặc link nghi ngờ để tra cứu
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nhập số điện thoại, số tài khoản hoặc link nghi ngờ..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 text-lg py-6"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !keyword.trim()}
                    size="lg"
                    className="px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Tìm kiếm
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  Ví dụ:{" "}
                  <button
                    onClick={() => setKeyword("0123456789")}
                    className="text-blue-600 hover:underline"
                  >
                    0123456789
                  </button>
                  {" | "}
                  <button
                    onClick={() => setKeyword("1234567890123")}
                    className="text-blue-600 hover:underline"
                  >
                    1234567890123
                  </button>
                  {" | "}
                  <button
                    onClick={() => setKeyword("bit.ly/scam-link")}
                    className="text-blue-600 hover:underline"
                  >
                    bit.ly/scam-link
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search Results */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {results && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.total_results > 0 ? (
                  <>
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    Tìm thấy {results.total_results} kết quả cảnh báo
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Không tìm thấy cảnh báo nào
                  </>
                )}
              </CardTitle>
              <CardDescription>
                Từ khóa: <strong>{results.keyword}</strong>
                {results.cached && " (Kết quả từ cache)"}
                {results.response_time_ms && ` - Thời gian: ${results.response_time_ms}ms`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    Tất cả ({results.total_results})
                  </TabsTrigger>
                  {results.sources.map((source) => (
                    <TabsTrigger key={source.source} value={source.source}>
                      {source.source} ({source.total_scams})
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {results.sources.map((source) => (
                    source.success && source.data.length > 0 && (
                      <div key={source.source}>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          {source.source}
                          <Badge variant="destructive">{source.total_scams} cảnh báo</Badge>
                        </h3>
                        <div className="grid gap-3">
                          {source.data.map((item, idx) => (
                            <Card key={idx} className="border-l-4 border-l-red-500">
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {item.name && (
                                    <div>
                                      <strong>Tên:</strong> {item.name}
                                    </div>
                                  )}
                                  {item.phone && (
                                    <div>
                                      <strong>SĐT:</strong> {item.phone}
                                    </div>
                                  )}
                                  {item.account_number && (
                                    <div>
                                      <strong>STK:</strong> {item.account_number}
                                    </div>
                                  )}
                                  {item.bank && (
                                    <div>
                                      <strong>Ngân hàng:</strong> {item.bank}
                                    </div>
                                  )}
                                  {item.amount && (
                                    <div>
                                      <strong>Số tiền:</strong> {item.amount}
                                    </div>
                                  )}
                                  {item.views && (
                                    <div>
                                      <strong>Lượt xem:</strong> {item.views}
                                    </div>
                                  )}
                                  {item.date && (
                                    <div>
                                      <strong>Ngày:</strong> {item.date}
                                    </div>
                                  )}
                                  {item.detail_link && (
                                    <div>
                                      <a
                                        href={item.detail_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        Xem chi tiết <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </TabsContent>

                {results.sources.map((source) => (
                  <TabsContent key={source.source} value={source.source} className="space-y-4 mt-4">
                    {source.success ? (
                      source.data.length > 0 ? (
                        <div className="grid gap-3">
                          {source.data.map((item, idx) => (
                            <Card key={idx} className="border-l-4 border-l-red-500">
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  {item.name && (
                                    <div>
                                      <strong>Tên:</strong> {item.name}
                                    </div>
                                  )}
                                  {item.phone && (
                                    <div>
                                      <strong>SĐT:</strong> {item.phone}
                                    </div>
                                  )}
                                  {item.account_number && (
                                    <div>
                                      <strong>STK:</strong> {item.account_number}
                                    </div>
                                  )}
                                  {item.bank && (
                                    <div>
                                      <strong>Ngân hàng:</strong> {item.bank}
                                    </div>
                                  )}
                                  {item.amount && (
                                    <div>
                                      <strong>Số tiền:</strong> {item.amount}
                                    </div>
                                  )}
                                  {item.views && (
                                    <div>
                                      <strong>Lượt xem:</strong> {item.views}
                                    </div>
                                  )}
                                  {item.date && (
                                    <div>
                                      <strong>Ngày:</strong> {item.date}
                                    </div>
                                  )}
                                  {item.detail_link && (
                                    <div>
                                      <a
                                        href={item.detail_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        Xem chi tiết <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Alert>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription>
                            Nguồn {source.source} không tìm thấy cảnh báo nào cho từ khóa này.
                          </AlertDescription>
                        </Alert>
                      )
                    ) : (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Lỗi khi tìm kiếm từ {source.source}: {source.error || "Unknown error"}
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

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
