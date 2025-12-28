import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Plus, BarChart, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { fetchAPI } from "@/lib/queryClient";

interface BroadcastCampaign {
  id: number;
  title: string;
  content: string;
  status: string;
  target: string;
  total_users: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface BroadcastStats {
  campaign_id: number;
  status: string;
  total_users: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  started_at?: string;
  completed_at?: string;
  failed_users: Array<{ user_id: string; error: string }>;
}

export default function BroadcastPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("create");
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery<BroadcastCampaign[]>({
    queryKey: ["broadcast-campaigns"],
    queryFn: async () => {
      const res = await fetchAPI("/api/v1/zalo/broadcast/campaigns");
      return res.json();
    },
  });

  // Fetch campaign stats
  const { data: stats } = useQuery<BroadcastStats>({
    queryKey: ["broadcast-stats", selectedCampaign],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const res = await fetchAPI(`/api/v1/zalo/broadcast/${selectedCampaign}/stats`);
      return res.json();
    },
    enabled: !!selectedCampaign,
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (data: { title: string; content: string; target: string }) => {
      console.log("🚀 Creating campaign:", data);
      const res = await fetchAPI("/api/v1/zalo/broadcast/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      console.log("✅ Campaign created:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ onSuccess called:", data);
      alert("✅ Tạo campaign thành công!");
      queryClient.invalidateQueries({ queryKey: ["broadcast-campaigns"] });
      setTitle("");
      setContent("");
      setActiveTab("list");
    },
    onError: (error: any) => {
      console.error("❌ Error creating campaign:", error);
      const errorMsg = error.message || "Không thể tạo campaign";
      alert("❌ Lỗi: " + errorMsg);
    },
  });

  // Send campaign mutation
  const sendCampaign = useMutation({
    mutationFn: async (campaignId: number) => {
      const res = await fetchAPI(`/api/v1/zalo/broadcast/${campaignId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_now: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-campaigns"] });
    },
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: number) => {
      await fetchAPI(`/api/v1/zalo/broadcast/${campaignId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-campaigns"] });
    },
  });

  const handleCreateCampaign = () => {
    console.log("🔘 Button clicked - Creating campaign");
    console.log("Title:", title);
    console.log("Content:", content);
    console.log("Target:", target);
    
    if (!title || !content) {
      console.warn("⚠️ Missing required fields");
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    console.log("✅ Validation passed, calling mutation...");
    createCampaign.mutate({ title, content, target });
  };

  const handleSendCampaign = (campaignId: number) => {
    if (confirm("Bạn có chắc muốn gửi broadcast này?")) {
      sendCampaign.mutate(campaignId);
    }
  };

  const handleDeleteCampaign = (campaignId: number) => {
    if (confirm("Bạn có chắc muốn xóa campaign này?")) {
      deleteCampaign.mutate(campaignId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      draft: { label: "Nháp", variant: "secondary" },
      scheduled: { label: "Đã lên lịch", variant: "default" },
      sending: { label: "Đang gửi", variant: "default" },
      completed: { label: "Hoàn thành", variant: "default" },
      failed: { label: "Thất bại", variant: "destructive" },
    };

    const { label, variant } = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý Broadcast Zalo OA</h1>
          <p className="text-muted-foreground">
            Gửi thông báo, cảnh báo lừa đảo cho tất cả người dùng theo dõi OA
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Tạo mới
          </TabsTrigger>
          <TabsTrigger value="list">
            <Send className="w-4 h-4 mr-2" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart className="w-4 h-4 mr-2" />
            Thống kê
          </TabsTrigger>
        </TabsList>

        {/* Create Campaign Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Tạo Broadcast Campaign</CardTitle>
              <CardDescription>
                Tạo thông báo mới để gửi cho người dùng Zalo OA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  placeholder="VD: Cảnh báo lừa đảo qua Zalo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  placeholder="🚨 CẢNH BÁO LỪA ĐẢO&#10;&#10;Gần đây xuất hiện nhiều trường hợp lừa đảo..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length}/2000 ký tự
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Đối tượng gửi</Label>
                <select
                  id="target"
                  className="w-full p-2 border rounded"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="all">Tất cả người dùng</option>
                  <option value="active">Người dùng đang hoạt động</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCampaign}
                  disabled={createCampaign.isPending}
                  className="flex-1"
                >
                  {createCampaign.isPending ? "Đang tạo..." : "Tạo Campaign"}
                </Button>
              </div>

              {createCampaign.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
                  ✅ Tạo campaign thành công!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign List Tab */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Campaigns</CardTitle>
              <CardDescription>
                Quản lý và gửi các broadcast campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{campaign.title}</h3>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {campaign.content}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tổng số</p>
                            <p className="font-semibold">{campaign.total_users}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Đã gửi</p>
                            <p className="font-semibold">{campaign.sent_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Thành công</p>
                            <p className="font-semibold text-green-600">
                              {campaign.success_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Thất bại</p>
                            <p className="font-semibold text-red-600">
                              {campaign.failed_count}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {campaign.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                              disabled={sendCampaign.isPending}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Gửi ngay
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCampaign(campaign.id);
                              setActiveTab("stats");
                            }}
                          >
                            <BarChart className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>

                          {(campaign.status === "draft" || campaign.status === "failed") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              disabled={deleteCampaign.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có campaign nào. Hãy tạo campaign mới!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê chi tiết</CardTitle>
              <CardDescription>
                Xem kết quả gửi broadcast chi tiết
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCampaign ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chọn một campaign từ danh sách để xem thống kê
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total_users}</div>
                        <p className="text-sm text-muted-foreground">Tổng số người dùng</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.sent_count}</div>
                        <p className="text-sm text-muted-foreground">Đã gửi</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {stats.success_count}
                        </div>
                        <p className="text-sm text-muted-foreground">Thành công</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                          {stats.failed_count}
                        </div>
                        <p className="text-sm text-muted-foreground">Thất bại</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tỷ lệ thành công</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-green-600 h-4 rounded-full"
                            style={{ width: `${stats.success_rate}%` }}
                          />
                        </div>
                        <div className="text-2xl font-bold">{stats.success_rate}%</div>
                      </div>
                    </CardContent>
                  </Card>

                  {stats.failed_users.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Người dùng gửi thất bại ({stats.failed_users.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {stats.failed_users.map((user, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span className="text-sm font-mono">{user.user_id}</span>
                              <span className="text-sm text-red-600">{user.error}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {stats.started_at && (
                    <div className="text-sm text-muted-foreground">
                      <p>Bắt đầu: {new Date(stats.started_at).toLocaleString("vi-VN")}</p>
                      {stats.completed_at && (
                        <p>
                          Hoàn thành: {new Date(stats.completed_at).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">Đang tải thống kê...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}
