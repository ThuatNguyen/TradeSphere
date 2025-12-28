import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock } from "lucide-react";
import { fetchAPI } from "@/lib/queryClient";

interface ZaloUser {
  user_id: string;
  display_name?: string;
  avatar?: string;
  user_id_by_app?: string;
  followers_count?: number;
  is_follower?: boolean;
  tags_and_notes_info?: any;
  shared_info?: any;
  created_at?: string;
}

export default function UsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/v1/zalo/users"],
    queryFn: () => {
      console.log('👥 Fetching Zalo users...');
      return fetchAPI("/api/v1/zalo/users").then(res => res.json());
    },
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Người dùng Zalo</h1>
          <p className="text-muted-foreground">
            Danh sách người dùng theo dõi Zalo Official Account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang theo dõi</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: ZaloUser) => u.is_follower).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">người dùng mới</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chưa có người dùng nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((user: ZaloUser) => (
              <Card key={user.user_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.display_name || "User"}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {user.display_name || "Người dùng"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.user_id}
                        </p>
                      </div>
                    </div>
                    <Badge variant={user.is_follower ? "default" : "secondary"}>
                      {user.is_follower ? "Đang theo dõi" : "Đã bỏ theo dõi"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">User ID by App:</span>{" "}
                      <span className="font-mono">{user.user_id_by_app || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tham gia:</span>{" "}
                      <span>{formatDate(user.created_at)}</span>
                    </div>
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
