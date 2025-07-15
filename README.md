# ChốngLừaĐảo - Anti-Fraud Web Application

Nền tảng web bảo vệ cộng đồng khỏi các hành vi lừa đảo trực tuyến. Ứng dụng cho phép người dùng tìm kiếm thông tin lừa đảo, tố cáo kẻ xấu, đọc blog về các thủ đoạn lừa đảo và nhận hỗ trợ qua AI chatbot.

## ✨ Tính năng chính

### 🔍 1. Tìm kiếm thông tin lừa đảo
- Tìm kiếm bằng số điện thoại, số tài khoản ngân hàng hoặc link nghi ngờ
- Hiển thị kết quả dưới dạng bảng với thông tin chi tiết
- Xem chi tiết từng tố cáo khi click vào dòng kết quả
- Hiển thị các tố cáo gần đây trên trang chủ

### 📢 2. Chức năng tố cáo
- Form tố cáo với các trường: tên kẻ lừa đảo, SĐT, STK, ngân hàng, số tiền, mô tả
- Tùy chọn tố cáo ẩn danh hoặc công khai thông tin người tố cáo
- Upload ảnh biên lai/chứng từ (giao diện có sẵn)
- Lưu trữ dữ liệu qua API backend

### 📰 3. Blog chia sẻ thủ đoạn lừa đảo
- Hiển thị danh sách bài viết với ảnh cover, tiêu đề, tóm tắt
- Trang chi tiết bài viết với nội dung đầy đủ
- Tìm kiếm bài viết theo từ khóa
- Phân loại bài viết theo tags

### 💬 4. Chatbox hỗ trợ AI
- Chatbox nổi ở góc phải màn hình, có thể thu gọn/mở rộng
- AI chatbot với các phản hồi thông minh dựa trên từ khóa
- Liên kết đến Zalo và Facebook Messenger
- Giao diện chat hiện đại với tin nhắn realtime

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18** với TypeScript
- **Wouter** cho routing
- **TailwindCSS** cho styling  
- **Shadcn/ui** cho UI components
- **TanStack Query** cho data fetching
- **React Hook Form** với Zod validation

### Backend
- **Node.js** với Express.js
- **TypeScript** 
- **In-memory storage** với interface có thể mở rộng
- **Zod** cho validation
- **CORS** và các middleware bảo mật

### Styling & Design
- Thiết kế responsive, mobile-first
- Color scheme xanh dương chuyên nghiệp
- Font Inter cho typography hiện đại
- Icons từ Lucide React

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Chạy trên Replit
1. Fork project này trên Replit
2. Chạy workflow "Start application" 
3. Ứng dụng sẽ tự động build và start

### Chạy local
1. Clone repository:
```bash
git clone <repository-url>
cd chong-lua-dao
