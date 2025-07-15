import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, DollarSign, ArrowLeft, User, Phone, CreditCard, Building, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

interface DetailProps {
  params: {
    id: string;
  };
}

export default function Detail({ params }: DetailProps) {
  const reportId = parseInt(params.id);
  
  const { data: report, isLoading } = useQuery({
    queryKey: ["/api/reports", reportId],
    queryFn: () => api.getReport(reportId),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            <div className="h-40 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Báo cáo không tồn tại</h1>
          <p className="text-slate-600 mb-6">Không tìm thấy báo cáo bạn đang tìm kiếm.</p>
          <Link href="/">
            <Button>Quay lại trang chủ</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
      </div>

      {/* Report Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Chi tiết tố cáo #{report.id}
          </h1>
          <Badge variant="destructive" className="text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Lừa đảo
          </Badge>
        </div>
        <p className="text-slate-600">
          Báo cáo được tạo vào {formatDate(report.createdAt!)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Accused Person Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Thông tin người bị tố cáo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Tên</label>
                <p className="text-lg font-semibold text-slate-900">{report.accusedName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-500">Số điện thoại</label>
                <p className="text-slate-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {report.phoneNumber}
                </p>
              </div>

              {report.accountNumber && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Số tài khoản</label>
                  <p className="text-slate-900 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {report.accountNumber}
                  </p>
                </div>
              )}

              {report.bank && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Ngân hàng</label>
                  <p className="text-slate-900 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    {report.bank}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Description */}
          <Card>
            <CardHeader>
              <CardTitle>Mô tả vụ việc</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </CardContent>
          </Card>

          {/* Reporter Info */}
          {!report.isAnonymous && (report.reporterName || report.reporterPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin người tố cáo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.reporterName && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Tên người tố cáo</label>
                    <p className="text-slate-900">{report.reporterName}</p>
                  </div>
                )}
                {report.reporterPhone && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Số điện thoại liên hệ</label>
                    <p className="text-slate-900">{report.reporterPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Số tiền bị chiếm đoạt</label>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(report.amount)}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-slate-500">Ngày tố cáo</label>
                <p className="text-slate-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(report.createdAt!)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">Trạng thái</label>
                <div className="flex items-center">
                  {report.isAnonymous ? (
                    <Badge variant="secondary">Tố cáo ẩn danh</Badge>
                  ) : (
                    <Badge variant="outline">Tố cáo công khai</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/report">
                <Button className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Tạo tố cáo mới
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full">
                Chia sẻ báo cáo
              </Button>
              
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Tìm kiếm khác
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Warning Box */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Lưu ý quan trọng</p>
                  <p>
                    Thông tin này được cung cấp bởi cộng đồng. Hãy luôn cảnh giác và xác minh 
                    thông tin từ nhiều nguồn trước khi đưa ra quyết định.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
