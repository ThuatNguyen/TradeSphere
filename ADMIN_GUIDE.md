# Hướng dẫn Quản trị Admin

## 🔐 Đăng nhập Admin

### URL để vào trang admin:
```
http://localhost:5000/admin/login
```

### Tài khoản mặc định:
- **Username:** `admin`
- **Password:** `admin123`

---

## 📝 Chức năng quản lý bài viết

Sau khi đăng nhập thành công, bạn sẽ được chuyển đến Dashboard tại:
```
http://localhost:5000/admin/dashboard
```

### Dashboard có 3 tab chính:

#### 1. **Quản lý tố cáo** 
- Xem danh sách tất cả tố cáo lừa đảo
- Xem chi tiết tố cáo
- Xóa tố cáo

#### 2. **Quản lý blog** ⭐
- **Tạo bài viết mới:** Nhấn nút "Tạo bài viết mới" (icon Plus)
- **Chỉnh sửa bài viết:** Nhấn nút Edit (icon bút)
- **Xem bài viết:** Nhấn nút Eye
- **Xóa bài viết:** Nhấn nút Trash

#### 3. **Quản lý chat**
- Xem danh sách chat sessions
- Xem chi tiết cuộc trò chuyện

---

## ✍️ Tạo bài viết mới

Khi nhấn "Tạo bài viết mới", một dialog sẽ hiện ra với các trường:

### Các trường bắt buộc (*):
1. **Tiêu đề*** - Tên bài viết
2. **Slug (URL)*** - Đường dẫn URL (vd: `phong-chong-lua-dao`)
   - Chỉ dùng chữ thường, số và dấu gạch ngang (-)
3. **Mô tả ngắn*** - Tóm tắt ngắn gọn về bài viết
4. **Nội dung*** - Nội dung chi tiết của bài viết

### Các trường tùy chọn:
5. **URL ảnh bìa** - Link ảnh đại diện cho bài viết
6. **Tags** - Phân cách bằng dấu phẩy (vd: `lừa đảo, ngân hàng, mạo danh`)
7. **Thời gian đọc** - Số phút để đọc hết bài (mặc định: 5 phút)

### Lưu ý:
- Slug phải là duy nhất (không trùng với bài viết khác)
- Nội dung hỗ trợ nhiều đoạn văn (mỗi đoạn cách nhau bằng Enter 2 lần)
- Có thể thêm nhiều tags để dễ tìm kiếm

---

## 🔄 Luồng hoạt động

```
1. Truy cập http://localhost:5000/admin/login
   ↓
2. Đăng nhập với admin/admin123
   ↓
3. Chuyển đến Dashboard
   ↓
4. Chọn tab "Quản lý blog"
   ↓
5. Nhấn "Tạo bài viết mới"
   ↓
6. Điền form và Submit
   ↓
7. Bài viết được tạo và hiển thị trong danh sách
```

---

## 🔒 Bảo mật

- Khi chưa đăng nhập, truy cập `/admin/dashboard` sẽ tự động redirect về `/admin/login`
- Thông tin đăng nhập được lưu trong localStorage
- Có nút "Đăng xuất" ở góc trên bên phải Dashboard
- Trang admin **không có** menu navbar và chatbox của trang public

---

## 🐛 Khắc phục sự cố

### Nếu vào dashboard mà thấy trang chủ:
- Đã được sửa! Routing đã được tách riêng giữa admin routes và public routes
- Admin routes không dùng Layout component và Chatbox

### Nếu không có dữ liệu admin:
```bash
# Restart server để chạy lại database initialization
npm run dev
```

### Kiểm tra database có admin account:
```bash
# Trong database client
SELECT * FROM admins;
```

---

## 📊 Thống kê Dashboard

Dashboard hiển thị:
- 📊 Tổng số tố cáo
- 📝 Tổng số bài viết blog
- 💬 Tổng số chat sessions
- 👁️ Tổng lượt xem blog

---

## 🎯 Tips

1. **Slug tốt:** Dùng tiếng Việt không dấu, ngắn gọn, có từ khóa
   - ✅ `lua-dao-qua-facebook`
   - ❌ `bài-viết-số-1`

2. **Excerpt hấp dẫn:** Viết mô tả ngắn gọn nhưng đủ hấp dẫn để thu hút người đọc

3. **Tags phù hợp:** Chọn tags liên quan để người dùng dễ tìm kiếm
   - `lừa đảo online`, `ngân hàng`, `mạng xã hội`, `phòng chống`

4. **Ảnh bìa:** Nên dùng ảnh có liên quan đến nội dung, kích thước phù hợp

---

## 📱 API Endpoints được sử dụng

- `POST /api/admin/login` - Đăng nhập admin
- `GET /api/blogs` - Lấy danh sách blog
- `POST /api/blogs` - Tạo blog mới
- `PUT /api/admin/blogs/:id` - Cập nhật blog
- `DELETE /api/admin/blogs/:id` - Xóa blog
- `GET /api/admin/reports` - Lấy danh sách tố cáo
- `DELETE /api/admin/reports/:id` - Xóa tố cáo
- `GET /api/admin/chat/sessions` - Lấy danh sách chat sessions
