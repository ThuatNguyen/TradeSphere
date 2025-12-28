import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

interface ChatDetailProps {
  params: {
    sessionId: string;
  };
}

export default function ChatDetail({ params }: ChatDetailProps) {
  const [, setLocation] = useLocation();
  const { sessionId } = params;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/admin/chat/sessions", sessionId, "messages"],
    queryFn: () => 
      fetchAPI(`/api/admin/chat/sessions/${sessionId}/messages`).then(res => res.json()),
    enabled: !!sessionId,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setLocation("/admin/chat")}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chat Session</h1>
            <p className="text-sm text-muted-foreground">
              Session ID: {sessionId}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử cuộc trò chuyện</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có tin nhắn nào trong session này
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.isUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isUser 
                        ? "bg-blue-100 text-blue-600" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {message.isUser ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${
                      message.isUser ? "flex flex-col items-end" : ""
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={message.isUser ? "default" : "secondary"}>
                          {message.isUser ? "Người dùng" : "AI Bot"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp!).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        message.isUser
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}