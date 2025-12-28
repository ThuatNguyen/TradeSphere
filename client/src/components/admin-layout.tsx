import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  AlertTriangle,
  Send,
  LogOut,
  Menu,
  X,
  Home,
  Users,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

interface Admin {
  id: number;
  username: string;
  role: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData) {
      setLocation("/admin/login");
      return;
    }
    setAdmin(JSON.parse(adminData));
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    setLocation("/admin/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: AlertTriangle, label: "Quản lý tố cáo", path: "/admin/reports" },
    { icon: FileText, label: "Quản lý blog", path: "/admin/blogs" },
    { icon: MessageSquare, label: "Chat AI", path: "/admin/chat" },
    { icon: Send, label: "Broadcast Zalo", path: "/admin/broadcast" },
    { icon: Users, label: "Người dùng Zalo", path: "/admin/users" },
  ];

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-blue-600 border-r border-blue-700 transition-all duration-300 z-40",
          sidebarOpen ? "w-64" : "w-0 -translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-white">Anti-Scam</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-blue-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-blue-100">
              Xin chào, <span className="font-medium text-white">{admin.username}</span>
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => setLocation(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-700 text-white"
                          : "text-blue-50 hover:bg-blue-700 hover:text-white"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-700 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-blue-700"
              onClick={() => setLocation("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Đến Website
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-blue-100 hover:text-white hover:bg-blue-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "lg:ml-64" : "ml-0")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="text-sm text-gray-600">
              ChốngLừaĐảo - Admin Dashboard
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
