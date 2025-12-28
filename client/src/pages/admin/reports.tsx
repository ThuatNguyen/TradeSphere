import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, AlertTriangle } from "lucide-react";
import { fetchAPI } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Report } from "@shared/schema";

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: () => {
      console.log('⚠️ Fetching reports...');
      return fetchAPI("/api/admin/reports").then(res => res.json());
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: number) => 
      fetchAPI(`/api/admin/reports/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Đã xóa tố cáo thành công" });
    },
  });

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
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý tố cáo</h1>
          <p className="text-muted-foreground">
            Xem và quản lý các báo cáo lừa đảo từ người dùng
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chưa có tố cáo nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report: Report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.accusedName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.phoneNumber}
                      </p>
                    </div>
                    <Badge variant="destructive">Lừa đảo</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{report.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Số tiền:</span>{" "}
                      <span className="font-semibold text-red-600">
                        {formatCurrency(report.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ngày tố cáo:</span>{" "}
                      <span>{formatDate(report.createdAt!)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Người tố cáo:</span>{" "}
                      <span>{report.reporterName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span>{report.reporterEmail}</span>
                    </div>
                  </div>

                  {report.evidenceUrl && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Bằng chứng:</p>
                      <a 
                        href={report.evidenceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {report.evidenceUrl}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/detail/${report.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteReportMutation.mutate(report.id)}
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
      </div>
    </AdminLayout>
  );
}
