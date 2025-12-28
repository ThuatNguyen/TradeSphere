import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { fetchAPI } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface ChatSession {
  id: number;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [, setLocation] = useLocation();

  const { data: chatSessions = [], isLoading } = useQuery({
    queryKey: ["/api/admin/chat/sessions"],
    queryFn: () => {
      console.log('💬 Fetching AI chat sessions...');
      return fetchAPI("/api/admin/chat/sessions").then(res => res.json());
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Chat AI</h1>
          <p className="text-muted-foreground">
            Xem các cuộc trò chuyện của người dùng với chatbot AI trên website
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </CardContent>
          </Card>
        ) : chatSessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chưa có tin nhắn nào</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Chat Sessions</CardTitle>
              <CardDescription>
                Theo dõi các cuộc trò chuyện với AI chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chatSessions.map((session: ChatSession) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">
                        Session: {session.sessionId}
                      </h3>
                      <div className="text-sm text-gray-600">
                        <p>IP: {session.ipAddress || "N/A"}</p>
                        <p>User Agent: {session.userAgent?.slice(0, 60) || "N/A"}...</p>
                        <p>Thời gian: {new Date(session.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/admin/chat/${session.sessionId}`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
