import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChatMessage } from "@/lib/types";

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là AI hỗ trợ phòng chống lừa đảo. Tôi có thể giúp bạn:\n\n• Nhận diện các thủ đoạn lừa đảo\n• Tư vấn cách phòng tránh\n• Kiểm tra thông tin đáng ngờ\n• Hướng dẫn báo cáo lừa đảo\n\nHãy chia sẻ thông tin bạn cần hỗ trợ!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Generate unique session ID
  useEffect(() => {
    const generateSessionId = () => {
      return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
    setSessionId(generateSessionId());
  }, []);

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.sendChatMessage(message, sessionId),
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + "-ai",
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-16 h-16 shadow-lg hover:scale-110 transition-all duration-300 ${isOpen ? 'hidden' : 'flex'}`}
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Hỗ trợ AI</h3>
                <p className="text-xs text-blue-100">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-blue-200 h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${message.isUser ? 'justify-end' : ''}`}
              >
                {!message.isUser && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                
                <div className={`rounded-lg p-3 max-w-xs shadow-sm ${
                  message.isUser 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white rounded-tl-none border border-slate-200'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {message.isUser && (
                  <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-xs shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex space-x-2 mb-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm"
                disabled={chatMutation.isPending}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 text-center">Câu hỏi nhanh:</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setInputMessage("Làm sao nhận biết lừa đảo OTP?")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                >
                  Lừa đảo OTP
                </button>
                <button 
                  onClick={() => setInputMessage("Cách phòng tránh lừa đảo đầu tư?")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                >
                  Lừa đảo đầu tư
                </button>
                <button 
                  onClick={() => setInputMessage("Tôi bị lừa đảo rồi, phải làm gì?")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                >
                  Đã bị lừa
                </button>
                <button 
                  onClick={() => setInputMessage("Kiểm tra số điện thoại lạ")}
                  className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                >
                  Kiểm tra SĐT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
