import { Link, useLocation } from "wouter";
import { Shield, Search, AlertTriangle, Newspaper, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Tìm kiếm", href: "/", icon: Search },
    { name: "Tra cứu lừa đảo", href: "/scam-search", icon: Shield },
    { name: "Tố cáo", href: "/report", icon: AlertTriangle },
    { name: "Blog", href: "/blogs", icon: Newspaper },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary flex items-center">
                  <Shield className="mr-2 h-6 w-6" />
                  ChốngLừaĐảo
                </h1>
              </Link>
              
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? "text-primary border-b-2 border-primary"
                            : "text-secondary hover:text-primary"
                        }`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button className="bg-primary text-white hover:bg-blue-800">
                <User className="mr-2 h-4 w-4" />
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-primary"
                      : "text-secondary hover:text-primary hover:bg-slate-50"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">ChốngLừaĐảo</h3>
              <p className="text-slate-300 mb-4">
                Nền tảng bảo vệ cộng đồng khỏi các hành vi lừa đảo trực tuyến. 
                Chia sẻ thông tin, cảnh báo kẻ xấu và bảo vệ tài sản của bạn.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Liên kết</h4>
              <ul className="space-y-2 text-slate-300">
                <li><Link href="/" className="hover:text-white transition-colors">Tìm kiếm</Link></li>
                <li><Link href="/report" className="hover:text-white transition-colors">Tố cáo</Link></li>
                <li><Link href="/blogs" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Trung tâm hỗ trợ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 ChốngLừaĐảo. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
