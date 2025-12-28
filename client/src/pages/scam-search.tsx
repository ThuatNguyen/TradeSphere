import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertTriangle, CheckCircle, Loader2, ExternalLink } from "lucide-react";

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

export default function ScamSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Tra cứu lừa đảo</h1>
          <p className="text-muted-foreground text-lg">
            Kiểm tra số điện thoại, số tài khoản hoặc tên người lừa đảo
          </p>
        </div>

        {/* Search Box */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Nhập thông tin cần tra cứu</CardTitle>
            <CardDescription>
              Số điện thoại, số tài khoản ngân hàng, hoặc tên người đáng ngờ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ví dụ: 0123456789 hoặc Nguyễn Văn A"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading || !keyword.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Tìm kiếm
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Tìm kiếm trên 3 nguồn: admin.vn, checkscam.vn, chongluadao.vn
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className={results.total_results > 0 ? "border-red-500" : "border-green-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.total_results > 0 ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Phát hiện cảnh báo
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Không tìm thấy cảnh báo
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Từ khóa: <strong>{results.keyword}</strong>
                  {results.cached && (
                    <Badge variant="secondary" className="ml-2">
                      Cached
                    </Badge>
                  )}
                  {results.response_time_ms && (
                    <span className="ml-2 text-xs">
                      ({results.response_time_ms}ms)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.total_results > 0 ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Tìm thấy <strong>{results.total_results}</strong> báo cáo lừa đảo. 
                      Hãy cẩn thận khi giao dịch!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Không tìm thấy báo cáo lừa đảo trong hệ thống. 
                      Tuy nhiên, hãy luôn thận trọng khi giao dịch tiền bạc.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Source Results */}
            {results.total_results > 0 && (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">
                    Tất cả ({results.total_results})
                  </TabsTrigger>
                  {results.sources.map((source) => {
                    const count = typeof source.total_scams === 'string' 
                      ? parseInt(source.total_scams) || 0 
                      : source.total_scams;
                    return (
                      <TabsTrigger key={source.source} value={source.source}>
                        {source.source} ({count})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="space-y-4">
                    {results.sources.map((source) => (
                      <SourceResults key={source.source} source={source} />
                    ))}
                  </div>
                </TabsContent>

                {results.sources.map((source) => (
                  <TabsContent key={source.source} value={source.source} className="mt-4">
                    <SourceResults source={source} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceResults({ source }: { source: SourceResult }) {
  if (!source.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Lỗi khi tìm kiếm trên {source.source}: {source.error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!source.data || source.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{source.source}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Không tìm thấy kết quả</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{source.source}</span>
          <Badge variant="destructive">
            {source.total_scams} báo cáo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {source.data.map((item, index) => (
            <Card key={index} className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="grid gap-2">
                  {item.name && (
                    <div>
                      <span className="font-semibold">Tên: </span>
                      {item.name}
                    </div>
                  )}
                  {item.phone && (
                    <div>
                      <span className="font-semibold">SĐT: </span>
                      {item.phone}
                    </div>
                  )}
                  {item.account_number && (
                    <div>
                      <span className="font-semibold">STK: </span>
                      {item.account_number}
                    </div>
                  )}
                  {item.bank && (
                    <div>
                      <span className="font-semibold">Ngân hàng: </span>
                      {item.bank}
                    </div>
                  )}
                  {item.amount && (
                    <div>
                      <span className="font-semibold">Số tiền: </span>
                      <Badge variant="destructive">{item.amount} VNĐ</Badge>
                    </div>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {item.date && <span>📅 {item.date}</span>}
                    {item.views && <span>👁️ {item.views} lượt xem</span>}
                  </div>
                  {item.detail_link && (
                    <a
                      href={item.detail_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                    >
                      Xem chi tiết
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
