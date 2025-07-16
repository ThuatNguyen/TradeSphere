import { db } from "./db";
import { reports, blogPosts, admins, reportCategories, blogCategories, systemSettings } from "@shared/schema";

export async function initializeDatabase() {
  try {
    // Check if data already exists
    const existingReports = await db.select().from(reports).limit(1);
    const existingBlogs = await db.select().from(blogPosts).limit(1);
    const existingAdmins = await db.select().from(admins).limit(1);
    const existingReportCategories = await db.select().from(reportCategories).limit(1);
    const existingBlogCategories = await db.select().from(blogCategories).limit(1);
    const existingSettings = await db.select().from(systemSettings).limit(1);

    // Initialize report categories
    if (existingReportCategories.length === 0) {
      await db.insert(reportCategories).values([
        {
          name: "Lừa đảo online",
          description: "Các hành vi lừa đảo qua internet, mạng xã hội",
          color: "#ef4444",
          isActive: true
        },
        {
          name: "Lừa đảo tài chính",
          description: "Lừa đảo liên quan đến ngân hàng, đầu tư, tiền tệ",
          color: "#f59e0b",
          isActive: true
        },
        {
          name: "Lừa đảo qua điện thoại",
          description: "Gọi điện giả mạo, lừa đảo qua cuộc gọi",
          color: "#06b6d4",
          isActive: true
        },
        {
          name: "Lừa đảo tin nhắn",
          description: "Tin nhắn giả mạo, phishing qua SMS",
          color: "#8b5cf6",
          isActive: true
        },
        {
          name: "Lừa đảo thương mại điện tử",
          description: "Bán hàng online giả, không giao hàng",
          color: "#10b981",
          isActive: true
        },
        {
          name: "Lừa đảo tình cảm",
          description: "Lừa đảo qua mối quan hệ tình cảm",
          color: "#f97316",
          isActive: true
        }
      ]);
      console.log("✓ Report categories added to database");
    }

    // Initialize blog categories
    if (existingBlogCategories.length === 0) {
      await db.insert(blogCategories).values([
        {
          name: "Cảnh báo lừa đảo",
          description: "Các bài viết cảnh báo về thủ đoạn lừa đảo mới",
          slug: "canh-bao-lua-dao",
          color: "#ef4444",
          isActive: true
        },
        {
          name: "Hướng dẫn phòng chống",
          description: "Hướng dẫn cách nhận biết và phòng chống lừa đảo",
          slug: "huong-dan-phong-chong",
          color: "#10b981",
          isActive: true
        },
        {
          name: "Tin tức",
          description: "Tin tức về tình hình lừa đảo",
          slug: "tin-tuc",
          color: "#3b82f6",
          isActive: true
        },
        {
          name: "Kiến thức bảo mật",
          description: "Kiến thức về bảo mật thông tin cá nhân",
          slug: "kien-thuc-bao-mat",
          color: "#8b5cf6",
          isActive: true
        },
        {
          name: "Pháp luật",
          description: "Các quy định pháp luật liên quan đến lừa đảo",
          slug: "phap-luat",
          color: "#f59e0b",
          isActive: true
        }
      ]);
      console.log("✓ Blog categories added to database");
    }

    // Initialize system settings
    if (existingSettings.length === 0) {
      await db.insert(systemSettings).values([
        {
          key: "site_title",
          value: "Hệ thống phòng chống lừa đảo",
          description: "Tiêu đề website"
        },
        {
          key: "site_description",
          value: "Hệ thống thông tin và cảnh báo về các hành vi lừa đảo trực tuyến",
          description: "Mô tả website"
        },
        {
          key: "contact_email",
          value: "admin@phongchongluadao.vn",
          description: "Email liên hệ chính"
        },
        {
          key: "contact_phone",
          value: "1900 1234",
          description: "Số điện thoại hỗ trợ"
        },
        {
          key: "max_reports_per_day",
          value: "10",
          description: "Số lượng tố cáo tối đa mỗi ngày từ 1 IP"
        },
        {
          key: "auto_approve_reports",
          value: "false",
          description: "Tự động duyệt tố cáo"
        },
        {
          key: "chat_enabled",
          value: "true",
          description: "Bật/tắt tính năng chat"
        },
        {
          key: "maintenance_mode",
          value: "false",
          description: "Chế độ bảo trì"
        }
      ]);
      console.log("✓ System settings added to database");
    }
    
    if (existingReports.length === 0) {
      // Add enhanced sample reports
      await db.insert(reports).values([
        {
          accusedName: "Nguyễn Văn A",
          phoneNumber: "0123456789",
          accountNumber: "1234567890123",
          bank: "vietcombank",
          amount: 5000000,
          description: "Lừa đảo qua Facebook bằng cách giả mạo bán hàng online. Đã chuyển tiền nhưng không nhận được hàng và bị chặn liên lạc. Người này có nhiều tài khoản Facebook khác nhau và thường xuyên thay đổi tên.",
          isAnonymous: false,
          reporterName: "Trần Thị B",
          reporterPhone: "0987654321",
          receiptUrl: null,
          evidenceUrls: [],
          status: "verified",
          priority: "high",
          category: "Lừa đảo online",
          isPublic: true,
          verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          verifiedBy: "admin",
          adminNotes: "Đã xác minh qua nhiều nguồn. Cảnh báo mức độ cao."
        },
        {
          accusedName: "Lê Minh C",
          phoneNumber: "0987123456",
          accountNumber: "9876543210987",
          bank: "techcombank",
          amount: 10000000,
          description: "Lừa đảo đầu tư tiền ảo với lời hứa lợi nhuận cao 30%/tháng. Sau khi chuyển tiền không thể rút được và mất liên lạc. Có website giả mạo và nhóm Telegram với nhiều thành viên fake.",
          isAnonymous: true,
          reporterName: null,
          reporterPhone: null,
          receiptUrl: null,
          evidenceUrls: [],
          status: "investigating",
          priority: "urgent",
          category: "Lừa đảo tài chính",
          isPublic: true,
          adminNotes: "Đang phối hợp với cơ quan chức năng điều tra."
        },
        {
          accusedName: "Phạm Văn D",
          phoneNumber: "0369852147",
          accountNumber: null,
          bank: null,
          amount: 2000000,
          description: "Lừa đảo qua tin nhắn giả mạo ngân hàng yêu cầu cập nhật thông tin và lấy mã OTP. Tin nhắn có nội dung: 'Tài khoản của bạn sẽ bị khóa, vui lòng truy cập link để cập nhật'.",
          isAnonymous: false,
          reporterName: "Hoàng Thị E",
          reporterPhone: "0912345678",
          receiptUrl: null,
          evidenceUrls: [],
          status: "verified",
          priority: "medium",
          category: "Lừa đảo tin nhắn",
          isPublic: true,
          verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          verifiedBy: "admin",
          adminNotes: "Thủ đoạn phổ biến, đã cảnh báo rộng rãi."
        },
        {
          accusedName: "Nguyễn Thị F",
          phoneNumber: "0765432109",
          accountNumber: "5555666677778888",
          bank: "agribank",
          amount: 1500000,
          description: "Lừa đảo tình cảm qua app hẹn hò. Tạo mối quan hệ tin tưởng rồi yêu cầu vay tiền khẩn cấp với lý do gia đình bị tai nạn. Sau khi nhận tiền thì mất tích.",
          isAnonymous: false,
          reporterName: "Vũ Văn G",
          reporterPhone: "0898765432",
          receiptUrl: null,
          evidenceUrls: [],
          status: "pending",
          priority: "medium",
          category: "Lừa đảo tình cảm",
          isPublic: true,
          adminNotes: null
        },
        {
          accusedName: "Trần Văn H",
          phoneNumber: "0334567890",
          accountNumber: "1111222233334444",
          bank: "vietinbank",
          amount: 800000,
          description: "Lừa đảo bán hàng online trên Shopee. Tạo shop giả với nhiều đánh giá tốt, bán điện thoại giá rẻ. Sau khi nhận tiền thì giao hàng fake và không hỗ trợ đổi trả.",
          isAnonymous: true,
          reporterName: null,
          reporterPhone: null,
          receiptUrl: null,
          evidenceUrls: [],
          status: "rejected",
          priority: "low",
          category: "Lừa đảo thương mại điện tử",
          isPublic: false,
          adminNotes: "Thiếu bằng chứng, không thể xác minh."
        }
      ]);
      console.log("✓ Enhanced sample reports added to database");
    }

    if (existingBlogs.length === 0) {
      // Add enhanced sample blog posts
      await db.insert(blogPosts).values([
        {
          title: "10 thủ đoạn lừa đảo phổ biến nhất năm 2024",
          slug: "10-thu-doan-lua-dao-pho-bien-nhat-2024",
          excerpt: "Cập nhật những phương thức lừa đảo mới nhất mà các kẻ xấu đang sử dụng để chiếm đoạt tài sản của người dân. Từ việc giả mạo ngân hàng đến lừa đảo đầu tư tiền ảo.",
          content: "Trong năm 2024, các thủ đoạn lừa đảo ngày càng tinh vi và đa dạng. Dưới đây là 10 thủ đoạn phổ biến nhất mà bạn cần biết:\n\n## 1. Giả mạo tin nhắn ngân hàng\n\nĐây là thủ đoạn phổ biến nhất hiện nay. Các đối tượng gửi tin nhắn giả mạo từ ngân hàng, yêu cầu cập nhật thông tin hoặc cung cấp mã OTP.\n\n**Cách nhận biết:**\n- Số điện thoại gửi tin lạ\n- Yêu cầu cung cấp thông tin nhạy cảm\n- Link đường dẫn không chính thức\n\n## 2. Lừa đảo qua mạng xã hội\n\nGiả mạo tài khoản bạn bè, người thân để vay tiền hoặc yêu cầu chuyển tiền khẩn cấp.\n\n## 3. Đầu tư tiền ảo có lợi nhuận cao\n\nHứa hẹn lợi nhuận cao từ đầu tư Bitcoin, Forex với các gói đầu tư hấp dẫn.\n\n## 4. Giả mạo nhân viên công an\n\nGọi điện thoại thông báo liên quan đến vụ án, yêu cầu chuyển tiền để 'bảo vệ' tài khoản.\n\n## 5. Lừa đảo qua ứng dụng hẹn hò\n\nTạo mối quan hệ tình cảm giả tạo, sau đó yêu cầu vay tiền với các lý do khác nhau.\n\n## 6. Bán hàng online không giao hàng\n\nTạo shop online giả, bán hàng giá rẻ nhưng không giao hàng sau khi nhận tiền.\n\n## 7. Lừa đảo vay tiền online\n\nYêu cầu phí trước khi giải ngân, sau đó biến mất.\n\n## 8. Giả mạo nhân viên bảo hiểm\n\nGọi điện thoại về chính sách bảo hiểm mới, yêu cầu cập nhật thông tin.\n\n## 9. Lừa đảo qua game online\n\nBán item, tài khoản game giả hoặc hack tài khoản để chiếm đoạt tài sản.\n\n## 10. Chiếm đoạt tài khoản Facebook\n\nHack tài khoản Facebook để lừa đảo danh sách bạn bè.\n\n## Cách phòng tránh\n\n- Luôn xác minh thông tin từ nhiều nguồn\n- Không cung cấp thông tin cá nhân qua điện thoại\n- Không chuyển tiền cho người lạ\n- Sử dụng các phương thức thanh toán có bảo vệ\n- Báo cáo ngay khi phát hiện dấu hiệu lừa đảo\n\nHãy luôn cảnh giác và chia sẻ thông tin này với người thân để cùng nhau phòng chống lừa đảo.",
          coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3",
          tags: ["lừa đảo online", "phòng chống", "cảnh báo", "2024"],
          category: "Cảnh báo lừa đảo",
          readTime: 12,
          views: 1247,
          status: "published",
          featured: true,
          authorName: "Biên tập viên",
          seoTitle: "10 thủ đoạn lừa đảo phổ biến nhất năm 2024 - Cách nhận biết và phòng tránh",
          seoDescription: "Tổng hợp các thủ đoạn lừa đảo phổ biến nhất năm 2024 với hướng dẫn chi tiết cách nhận biết và phòng tránh. Bảo vệ tài sản của bạn khỏi các kẻ lừa đảo.",
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          title: "Cách nhận biết tin nhắn lừa đảo từ ngân hàng",
          slug: "cach-nhan-biet-tin-nhan-lua-dao-tu-ngan-hang",
          excerpt: "Hướng dẫn chi tiết cách phân biệt tin nhắn thật và giả từ ngân hàng để tránh bị lừa đảo. Các dấu hiệu nhận biết và cách xử lý khi nhận tin nhắn đáng ngờ.",
          content: "Tin nhắn lừa đảo giả mạo ngân hàng đang là thủ đoạn phổ biến nhất hiện nay. Dưới đây là hướng dẫn chi tiết để nhận biết và phòng tránh:\n\n## Ngân hàng KHÔNG BAO GIỜ làm gì?\n\n- **Không yêu cầu mã OTP qua tin nhắn hoặc điện thoại**\n- **Không gửi link để cập nhật thông tin**\n- **Không yêu cầu cung cấp thông tin tài khoản**\n- **Không thông báo khóa tài khoản đột ngột**\n- **Không yêu cầu xác nhận thông tin thẻ**\n\n## Dấu hiệu nhận biết tin nhắn lừa đảo\n\n### 1. Số điện thoại gửi tin\n- **Tin nhắn thật:** Từ số đầu ngắn của ngân hàng (VD: 8149, 8177)\n- **Tin nhắn giả:** Từ số điện thoại 10-11 chữ số thông thường\n\n### 2. Nội dung tin nhắn\n- **Tin nhắn thật:** Thông tin chính xác, không yêu cầu hành động gấp\n- **Tin nhắn giả:** Tạo áp lực, yêu cầu hành động ngay lập tức\n\n### 3. Đường link\n- **Link thật:** Đường dẫn chính thức của ngân hàng\n- **Link giả:** Đường dẫn lạ, rút gọn, hoặc tương tự nhưng không chính thức\n\n### 4. Lỗi ngữ pháp\n- **Tin nhắn thật:** Nội dung chuẩn, không lỗi chính tả\n- **Tin nhắn giả:** Thường có lỗi ngữ pháp, chính tả\n\n## Ví dụ tin nhắn lừa đảo thường gặp\n\n### Ví dụ 1:\n```\nTK cua ban se bi khoa trong 24h. Vui long truy cap link sau de xac nhan: [link giả]\n```\n\n### Ví dụ 2:\n```\nBan da trung thuong 100 trieu dong. Lien he 0xxx.xxx.xxx de nhan thuong\n```\n\n### Ví dụ 3:\n```\nNgan hang cap nhat chinh sach bao mat. Vui long cap nhat thong tin tai: [link giả]\n```\n\n## Cách xử lý khi nhận tin nhắn đáng ngờ\n\n### Bước 1: Giữ bình tĩnh\n- Không vội vàng thực hiện theo yêu cầu\n- Đọc kỹ nội dung tin nhắn\n\n### Bước 2: Kiểm tra thông tin\n- Gọi điện đến hotline chính thức của ngân hàng\n- Truy cập trực tiếp website/app ngân hàng\n\n### Bước 3: Báo cáo\n- Chuyển tiếp tin nhắn spam đến 5656\n- Báo cáo với ngân hàng\n- Tạo tố cáo trên website này\n\n### Bước 4: Cảnh báo\n- Chia sẻ với người thân\n- Đăng cảnh báo trên mạng xã hội\n\n## Số hotline các ngân hàng lớn\n\n- **Vietcombank:** 1900 54 54 13\n- **Techcombank:** 1900 58 88 85\n- **BIDV:** 1900 9247\n- **VietinBank:** 1900 55 88 68\n- **Agribank:** 1900 55 88 18\n- **Sacombank:** 1900 55 88 44\n\n## Lời khuyên cuối cùng\n\n- **Luôn nhớ:** Ngân hàng KHÔNG BAO GIỜ yêu cầu OTP qua tin nhắn\n- **Khi nghi ngờ:** Liên hệ trực tiếp ngân hàng\n- **Bảo vệ thông tin:** Không chia sẻ thông tin cá nhân với ai\n- **Cập nhật kiến thức:** Theo dõi cảnh báo từ ngân hàng và cơ quan chức năng\n\nHãy luôn cảnh giác và bảo vệ tài sản của bạn!",
          coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
          tags: ["ngân hàng", "tin nhắn", "phòng chống", "OTP"],
          category: "Hướng dẫn phòng chống",
          readTime: 8,
          views: 892,
          status: "published",
          featured: true,
          authorName: "Chuyên gia bảo mật",
          seoTitle: "Cách nhận biết tin nhắn lừa đảo từ ngân hàng - Hướng dẫn chi tiết",
          seoDescription: "Hướng dẫn chi tiết cách nhận biết tin nhắn lừa đảo giả mạo ngân hàng. Bảo vệ tài khoản ngân hàng của bạn khỏi các thủ đoạn lừa đảo qua tin nhắn.",
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        {
          title: "Lừa đảo đầu tư tiền ảo: Nhận biết và phòng tránh",
          slug: "lua-dao-dau-tu-tien-ao-nhan-biet-va-phong-tranh",
          excerpt: "Phân tích các hình thức lừa đảo đầu tư tiền ảo phổ biến hiện nay. Hướng dẫn cách nhận biết dự án đầu tư giả và bảo vệ tài sản.",
          content: "Lừa đảo đầu tư tiền ảo đang trở thành xu hướng lừa đảo phổ biến với thiệt hại lớn. Dưới đây là hướng dẫn chi tiết để nhận biết và phòng tránh:\n\n## Các hình thức lừa đảo đầu tư tiền ảo\n\n### 1. Hứa hẹn lợi nhuận cao\n- Cam kết lãi suất 20-50%/tháng\n- Không rủi ro, đảm bảo lợi nhuận\n- Càng đầu tư nhiều, lãi suất càng cao\n\n### 2. Dự án ICO/Token giả\n- Tạo website đẹp, chuyên nghiệp\n- Thông tin team phát triển giả\n- Whitepaper sao chép từ dự án khác\n\n### 3. Sàn giao dịch giả\n- Giao diện giống sàn thật\n- Cho phép nạp tiền nhưng không rút được\n- Giá token/coin không thực tế\n\n### 4. Đa cấp tiền ảo\n- Hoa hồng giới thiệu cao\n- Cấu trúc kim tự tháp\n- Yêu cầu tuyển dụng thành viên mới\n\n## Dấu hiệu nhận biết dự án lừa đảo\n\n### Về lời hứa\n- **🚩 Lợi nhuận quá cao:** Hứa hẹn lãi suất không thực tế\n- **🚩 Không rủi ro:** Cam kết không thua lỗ\n- **🚩 Áp lực thời gian:** Ưu đãi có thời hạn ngắn\n\n### Về thông tin dự án\n- **🚩 Thiếu thông tin:** Không có địa chỉ cụ thể\n- **🚩 Team ảo:** Thông tin thành viên không xác thực được\n- **🚩 Giấy phép:** Không có giấy phép hoạt động\n\n### Về website/app\n- **🚩 Domain mới:** Website vừa tạo\n- **🚩 Thiết kế kém:** Giao diện nghiệp dư\n- **🚩 Lỗi kỹ thuật:** Nhiều lỗi, không ổn định\n\n## Cách kiểm tra độ tin cậy\n\n### 1. Kiểm tra giấy phép\n- Tìm hiểu giấy phép hoạt động\n- Xác minh với cơ quan quản lý\n- Kiểm tra blacklist của SBV\n\n### 2. Nghiên cứu team\n- Tìm hiểu background thành viên\n- Kiểm tra LinkedIn, mạng xã hội\n- Xác minh kinh nghiệm làm việc\n\n### 3. Đánh giá dự án\n- Đọc kỹ whitepaper\n- Phân tích khả năng thực tế\n- Tham khảo ý kiến chuyên gia\n\n### 4. Kiểm tra cộng đồng\n- Tham gia nhóm Telegram/Discord\n- Quan sát hoạt động thành viên\n- Tìm hiểu phản hồi từ cộng đồng\n\n## Các sàn giao dịch uy tín\n\n### Sàn quốc tế\n- **Binance:** Sàn lớn nhất thế giới\n- **Coinbase:** Được cấp phép tại Mỹ\n- **Kraken:** Uy tín, bảo mật cao\n\n### Sàn Việt Nam\n- **Remitano:** Có giấy phép tại Việt Nam\n- **VNDC:** Stablecoin Việt Nam\n- **Coinhako:** Có văn phòng tại Việt Nam\n\n## Cách đầu tư an toàn\n\n### 1. Học hỏi kiến thức\n- Tìm hiểu về blockchain, cryptocurrency\n- Học cách phân tích dự án\n- Theo dõi tin tức thị trường\n\n### 2. Đa dạng hóa\n- Không bỏ hết trứng vào 1 giỏ\n- Đầu tư vào nhiều loại coin khác nhau\n- Cân bằng giữa rủi ro và lợi nhuận\n\n### 3. Quản lý rủi ro\n- Chỉ đầu tư số tiền có thể mất\n- Đặt stop-loss để cắt lỗ\n- Không vay tiền để đầu tư\n\n### 4. Sử dụng ví an toàn\n- Ví cứng (hardware wallet)\n- Ví phần mềm uy tín\n- Backup private key an toàn\n\n## Khi bị lừa đảo\n\n### Hành động ngay lập tức\n1. **Dừng giao dịch:** Không chuyển thêm tiền\n2. **Lưu bằng chứng:** Screenshot, email, tin nhắn\n3. **Báo cáo ngân hàng:** Yêu cầu phong tỏa tài khoản\n4. **Báo công an:** Làm đơn tố cáo\n\n### Hỗ trợ pháp lý\n- **Điện thoại:** 113 (Công an)\n- **Email:** Cục An toàn thông tin\n- **Website:** Báo cáo trên cổng thông tin chính phủ\n\n## Lời khuyên cuối cùng\n\n- **Không tin lời hứa suông:** Lợi nhuận cao luôn đi kèm rủi ro cao\n- **Kiểm tra kỹ lưỡng:** Đầu tư thời gian nghiên cứu\n- **Tham khảo ý kiến:** Hỏi chuyên gia, người có kinh nghiệm\n- **Bắt đầu nhỏ:** Thử nghiệm với số tiền nhỏ trước\n\nHãy nhớ: 'Nếu nghe quá tốt để tin được, thì có thể đó là lừa đảo!'",
          coverImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3",
          tags: ["tiền ảo", "đầu tư", "bitcoin", "cryptocurrency"],
          category: "Cảnh báo lừa đảo",
          readTime: 15,
          views: 1543,
          status: "published",
          featured: true,
          authorName: "Chuyên gia tài chính",
          seoTitle: "Lừa đảo đầu tư tiền ảo 2024 - Nhận biết và phòng tránh",
          seoDescription: "Hướng dẫn nhận biết các hình thức lừa đảo đầu tư tiền ảo, Bitcoin, cryptocurrency. Cách phòng tránh và đầu tư an toàn vào thị trường tiền ảo.",
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          title: "Tổng hợp các thủ đoạn lừa đảo qua mạng xã hội",
          slug: "tong-hop-cac-thu-doan-lua-dao-qua-mang-xa-hoi",
          excerpt: "Phân tích chi tiết các hình thức lừa đảo phổ biến trên Facebook, Zalo, Instagram và các mạng xã hội khác. Cách nhận biết và phòng tránh hiệu quả.",
          content: "Mạng xã hội đang trở thành 'sân chơi' chính của các kẻ lừa đảo. Dưới đây là tổng hợp các thủ đoạn và cách phòng tránh:\n\n## Các hình thức lừa đảo phổ biến\n\n### 1. Giả mạo tài khoản người quen\n\n**Thủ đoạn:**\n- Hack hoặc clone tài khoản Facebook\n- Nhắn tin vay tiền khẩn cấp\n- Sử dụng thông tin cá nhân để tạo lòng tin\n\n**Cách nhận biết:**\n- Tài khoản vừa tạo hoặc ít hoạt động\n- Yêu cầu tiền đột ngột, khẩn cấp\n- Từ chối gọi điện thoại hoặc video call\n\n### 2. Bán hàng online giả\n\n**Thủ đoạn:**\n- Tạo fanpage/shop giả\n- Bán hàng giá rẻ bất thường\n- Yêu cầu thanh toán trước\n\n**Cách nhận biết:**\n- Giá rẻ hơn thị trường quá nhiều\n- Thông tin shop không rõ ràng\n- Chỉ nhận thanh toán chuyển khoản\n\n### 3. Lừa đảo tình cảm\n\n**Thủ đoạn:**\n- Tạo tài khoản fake với ảnh đẹp\n- Tìm hiểu thông tin cá nhân nạn nhân\n- Tạo mối quan hệ tình cảm giả\n- Yêu cầu tiền với lý do khác nhau\n\n**Cách nhận biết:**\n- Tài khoản có ít bạn bè, hoạt động\n- Nhanh chóng thể hiện tình cảm\n- Tránh gặp mặt, video call\n- Thường xuyên yêu cầu tiền\n\n### 4. Lừa đảo việc làm\n\n**Thủ đoạn:**\n- Đăng tin tuyển dụng hấp dẫn\n- Yêu cầu phí đăng ký, bảo hiểm\n- Hứa hẹn lương cao, việc nhẹ\n\n**Cách nhận biết:**\n- Yêu cầu phí trước khi làm việc\n- Thông tin công ty không rõ ràng\n- Lương quá cao so với công việc\n\n## Thủ đoạn trên từng nền tảng\n\n### Facebook\n- **Giả mạo bạn bè:** Clone tài khoản để lừa đảo\n- **Bán hàng livestream:** Bán hàng giả qua video trực tiếp\n- **Quảng cáo lừa đảo:** Ads về đầu tư, giảm cân\n\n### Zalo\n- **Tin nhắn spam:** Gửi tin nhắn quảng cáo lừa đảo\n- **Giả mạo OTP:** Lừa lấy mã xác thực\n- **Group lừa đảo:** Tạo nhóm đầu tư, MLM\n\n### Instagram\n- **Fake influencer:** Giả mạo người nổi tiếng\n- **Bán hàng fake:** Quần áo, mỹ phẩm giả\n- **Phishing:** Lừa lấy thông tin đăng nhập\n\n### TikTok\n- **Livestream lừa đảo:** Bán hàng giả qua video\n- **Tài khoản fake:** Giả mạo celebrity\n- **Link độc hại:** Dẫn đến trang web lừa đảo\n\n## Cách phòng tránh hiệu quả\n\n### 1. Xác minh thông tin\n- **Video call:** Luôn yêu cầu video call trước khi giao dịch\n- **Gọi điện:** Xác minh qua điện thoại\n- **Gặp mặt:** Giao dịch trực tiếp nếu có thể\n\n### 2. Kiểm tra tài khoản\n- **Thời gian tạo:** Tài khoản cũ thường tin cậy hơn\n- **Bạn bè chung:** Có bạn bè chung hay không\n- **Hoạt động:** Tài khoản có hoạt động thường xuyên\n\n### 3. Cẩn thận với thông tin cá nhân\n- **Không chia sẻ:** Thông tin ngân hàng, OTP\n- **Cài đặt riêng tư:** Hạn chế thông tin công khai\n- **Mật khẩu mạnh:** Sử dụng mật khẩu phức tạp\n\n### 4. Báo cáo và chặn\n- **Báo cáo:** Báo cáo tài khoản lừa đảo\n- **Chặn:** Chặn tài khoản đáng ngờ\n- **Cảnh báo:** Thông báo cho bạn bè\n\n## Cách xử lý khi bị lừa đảo\n\n### Hành động ngay lập tức\n1. **Dừng giao dịch:** Không chuyển thêm tiền\n2. **Chụp màn hình:** Lưu lại bằng chứng\n3. **Báo cáo:** Báo cáo với nền tảng mạng xã hội\n4. **Liên hệ ngân hàng:** Yêu cầu hỗ trợ\n\n### Báo cáo cơ quan chức năng\n- **Công an:** Làm đơn tố cáo\n- **Ngân hàng:** Báo cáo giao dịch bất thường\n- **Website:** Tạo tố cáo trên hệ thống\n\n## Cách báo cáo trên từng nền tảng\n\n### Facebook\n1. Vào tài khoản/bài viết lừa đảo\n2. Nhấn 3 chấm > Báo cáo\n3. Chọn \"Spam hoặc lừa đảo\"\n4. Làm theo hướng dẫn\n\n### Zalo\n1. Vào cuộc trò chuyện\n2. Nhấn vào tên người dùng\n3. Chọn \"Báo cáo\"\n4. Chọn lý do báo cáo\n\n### Instagram\n1. Vào profile/bài viết\n2. Nhấn 3 chấm > Báo cáo\n3. Chọn \"Đây là spam\"\n4. Hoàn thành báo cáo\n\n## Lời khuyên cho từng nhóm đối tượng\n\n### Người cao tuổi\n- Tham khảo con cháu trước khi giao dịch\n- Không tin vào lời hứa quá tốt\n- Học cách sử dụng mạng xã hội an toàn\n\n### Học sinh, sinh viên\n- Cẩn thận với việc làm thêm online\n- Không chia sẻ thông tin cá nhân\n- Báo cáo với thầy cô, gia đình khi gặp vấn đề\n\n### Người trung tuổi\n- Xác minh thông tin đầu tư kỹ lưỡng\n- Không vay tiền để đầu tư\n- Tìm hiểu kỹ về công ty, sản phẩm\n\n## Kết luận\n\nMạng xã hội mang lại nhiều tiện ích nhưng cũng tiềm ẩn rủi ro. Hãy luôn:\n- **Cảnh giác:** Không tin tưởng hoàn toàn\n- **Xác minh:** Kiểm tra thông tin kỹ lưỡng\n- **Báo cáo:** Thông báo khi phát hiện lừa đảo\n- **Chia sẻ:** Cảnh báo người thân, bạn bè\n\nBảo vệ bản thân và cộng đồng khỏi các hoạt động lừa đảo!",
          coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3",
          tags: ["mạng xã hội", "facebook", "zalo", "instagram"],
          category: "Hướng dẫn phòng chống",
          readTime: 18,
          views: 2156,
          status: "published",
          featured: false,
          authorName: "Chuyên gia an ninh mạng",
          seoTitle: "Lừa đảo qua mạng xã hội - Thủ đoạn và cách phòng tránh 2024",
          seoDescription: "Tổng hợp các thủ đoạn lừa đảo qua Facebook, Zalo, Instagram. Hướng dẫn cách nhận biết, phòng tránh và báo cáo hiệu quả.",
          publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
        },
        {
          title: "Cách bảo vệ tài khoản ngân hàng online an toàn",
          slug: "cach-bao-ve-tai-khoan-ngan-hang-online-an-toan",
          excerpt: "Hướng dẫn chi tiết cách bảo vệ tài khoản ngân hàng online khỏi các thủ đoạn lừa đảo. Các biện pháp bảo mật cần thiết và cách xử lý khi gặp sự cố.",
          content: "Tài khoản ngân hàng online là mục tiêu chính của các kẻ lừa đảo. Dưới đây là hướng dẫn toàn diện để bảo vệ tài khoản của bạn:\n\n## Các nguy cơ thường gặp\n\n### 1. Phishing (Lừa đảo thông tin)\n- **Thủ đoạn:** Giả mạo website, email ngân hàng\n- **Mục đích:** Lấy thông tin đăng nhập\n- **Hậu quả:** Mất quyền kiểm soát tài khoản\n\n### 2. Keylogger (Ghi lại phím bấm)\n- **Thủ đoạn:** Cài đặt phần mềm độc hại\n- **Mục đích:** Ghi lại mật khẩu, OTP\n- **Hậu quả:** Đánh cắp thông tin đăng nhập\n\n### 3. SIM Swapping (Đổi SIM)\n- **Thủ đoạn:** Làm SIM mới với số cũ\n- **Mục đích:** Nhận OTP của nạn nhân\n- **Hậu quả:** Bypass xác thực 2 lớp\n\n### 4. Social Engineering (Kỹ thuật xã hội)\n- **Thủ đoạn:** Dùng tâm lý để lừa thông tin\n- **Mục đích:** Lấy thông tin cá nhân\n- **Hậu quả:** Dễ dàng hack tài khoản\n\n## Biện pháp bảo vệ cơ bản\n\n### 1. Mật khẩu mạnh\n```\nYêu cầu mật khẩu tốt:\n- Ít nhất 12 ký tự\n- Kết hợp chữ hoa, thường, số, ký tự đặc biệt\n- Không sử dụng thông tin cá nhân\n- Khác nhau cho mỗi tài khoản\n```\n\n**Ví dụ mật khẩu tốt:**\n- `MyBank@2024#Secure`\n- `Viet123!Bank$Safe`\n\n### 2. Xác thực 2 lớp (2FA)\n- **Bật SMS OTP:** Nhận mã xác thực qua tin nhắn\n- **Sử dụng app:** Google Authenticator, Authy\n- **Backup codes:** Lưu mã dự phòng\n\n### 3. Cập nhật thường xuyên\n- **App ngân hàng:** Luôn cập nhật phiên bản mới\n- **Hệ điều hành:** Cài đặt bản vá bảo mật\n- **Antivirus:** Sử dụng phần mềm diệt virus\n\n### 4. Mạng an toàn\n- **Tránh WiFi công cộng:** Không giao dịch qua WiFi chung\n- **Sử dụng VPN:** Nếu cần thiết\n- **Mạng nhà:** Đảm bảo mạng nhà an toàn\n\n## Cách sử dụng an toàn\n\n### 1. Truy cập chính thức\n- **Gõ URL trực tiếp:** Không click link từ email\n- **Tải app từ store:** App Store, Google Play\n- **Kiểm tra HTTPS:** Đảm bảo có khóa bảo mật\n\n### 2. Kiểm tra thông tin\n- **Xem số dư thường xuyên:** Phát hiện giao dịch lạ\n- **Đọc SMS ngân hàng:** Theo dõi thông báo\n- **Lịch sử giao dịch:** Kiểm tra định kỳ\n\n### 3. Đăng xuất an toàn\n- **Đăng xuất hoàn toàn:** Không chỉ tắt app\n- **Xóa cache:** Xóa dữ liệu đã lưu\n- **Khóa điện thoại:** Sử dụng mã PIN, vân tay\n\n### 4. Cài đặt bảo mật\n- **Thông báo giao dịch:** Bật SMS cho mọi giao dịch\n- **Hạn mức:** Đặt hạn mức chuyển tiền\n- **Khóa chức năng:** Khóa các tính năng không dùng\n\n## Cách nhận biết website/app giả\n\n### Dấu hiệu website giả\n- **URL lạ:** Không phải domain chính thức\n- **HTTPS:** Không có hoặc chứng chỉ không hợp lệ\n- **Giao diện:** Khác biệt so với website thật\n- **Lỗi chính tả:** Nhiều lỗi ngữ pháp\n\n### Dấu hiệu app giả\n- **Tên nhà phát triển:** Không phải ngân hàng\n- **Đánh giá:** Ít đánh giá hoặc đánh giá fake\n- **Quyền truy cập:** Yêu cầu quá nhiều quyền\n- **Kích thước:** Khác biệt lớn so với app thật\n\n## Xử lý khi nghi ngờ bị hack\n\n### Hành động ngay lập tức\n1. **Đổi mật khẩu:** Ngay lập tức\n2. **Liên hệ ngân hàng:** Gọi hotline\n3. **Khóa tài khoản:** Tạm thời khóa\n4. **Kiểm tra giao dịch:** Xem lịch sử\n\n### Báo cáo sự cố\n- **Ngân hàng:** Báo cáo chi tiết\n- **Công an:** Làm đơn tố cáo\n- **Website:** Tạo tố cáo trên hệ thống\n\n## Cài đặt bảo mật cho từng ngân hàng\n\n### Vietcombank\n- **VCB Digibank:** Bật thông báo push\n- **SmartOTP:** Sử dụng thay vì SMS\n- **Vân tay:** Đăng nhập bằng vân tay\n\n### Techcombank\n- **F@st Mobile:** Cài đặt mã PIN\n- **Face ID:** Đăng nhập bằng khuôn mặt\n- **Thông báo:** Bật alert cho mọi giao dịch\n\n### BIDV\n- **BIDV SmartBanking:** Sử dụng mã hóa\n- **Soft token:** Tạo OTP trên app\n- **Giới hạn:** Đặt hạn mức giao dịch\n\n## Lời khuyên cho các nhóm đối tượng\n\n### Người cao tuổi\n- **Học cách sử dụng:** Nhờ con cháu hướng dẫn\n- **Ghi nhớ:** Không chia sẻ thông tin với ai\n- **Hỗ trợ:** Liên hệ ngân hàng khi có thắc mắc\n\n### Doanh nhân\n- **Tài khoản riêng:** Tách biệt cá nhân và doanh nghiệp\n- **Ủy quyền:** Cẩn thận khi ủy quyền\n- **Backup:** Chuẩn bị phương án dự phòng\n\n### Nhân viên văn phòng\n- **Không dùng máy công ty:** Giao dịch trên thiết bị cá nhân\n- **Bảo mật:** Không lưu thông tin trên máy chung\n- **Tập trung:** Tránh giao dịch khi đang làm việc\n\n## Số hotline các ngân hàng\n\n| Ngân hàng | Hotline | Giờ hoạt động |\n|-----------|---------|---------------|\n| Vietcombank | 1900 54 54 13 | 24/7 |\n| Techcombank | 1900 58 88 85 | 24/7 |\n| BIDV | 1900 9247 | 24/7 |\n| VietinBank | 1900 55 88 68 | 24/7 |\n| Agribank | 1900 55 88 18 | 24/7 |\n| Sacombank | 1900 55 88 44 | 24/7 |\n\n## Checklist bảo mật hàng ngày\n\n### Hàng ngày\n- [ ] Kiểm tra SMS thông báo\n- [ ] Đăng xuất sau khi sử dụng\n- [ ] Không để người khác thấy mật khẩu\n\n### Hàng tuần\n- [ ] Kiểm tra lịch sử giao dịch\n- [ ] Cập nhật app ngân hàng\n- [ ] Kiểm tra cài đặt bảo mật\n\n### Hàng tháng\n- [ ] Đổi mật khẩu (nếu cần)\n- [ ] Kiểm tra sao kê\n- [ ] Cập nhật thông tin liên lạc\n\n## Kết luận\n\nBảo vệ tài khoản ngân hàng online đòi hỏi sự cẩn thận và kiến thức. Hãy:\n- **Luôn cảnh giác:** Không tin tưởng hoàn toàn\n- **Cập nhật kiến thức:** Theo dõi cảnh báo mới\n- **Báo cáo:** Thông báo khi phát hiện bất thường\n- **Chia sẻ:** Hướng dẫn người thân bảo vệ tài khoản\n\nAn toàn tài khoản ngân hàng là trách nhiệm của chính bạn!",
          coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3",
          tags: ["ngân hàng online", "bảo mật", "phòng chống", "tài khoản"],
          category: "Kiến thức bảo mật",
          readTime: 20,
          views: 3247,
          status: "published",
          featured: false,
          authorName: "Chuyên gia bảo mật ngân hàng",
          seoTitle: "Bảo vệ tài khoản ngân hàng online - Hướng dẫn toàn diện 2024",
          seoDescription: "Hướng dẫn chi tiết cách bảo vệ tài khoản ngân hàng online khỏi lừa đảo. Biện pháp bảo mật hiệu quả và cách xử lý khi gặp sự cố.",
          publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        }
      ]);
      console.log("✓ Enhanced sample blog posts added to database");
    }

    if (existingAdmins.length === 0) {
      // Add enhanced admin accounts
      await db.insert(admins).values([
        {
          username: "admin",
          password: "admin123", // Note: In production, this should be hashed
          role: "super_admin",
          fullName: "Quản trị viên hệ thống",
          email: "admin@phongchongluadao.vn",
          permissions: ["blog_write", "report_manage", "chat_monitor", "user_manage"],
          isActive: true
        },
        {
          username: "moderator",
          password: "mod123",
          role: "moderator",
          fullName: "Kiểm duyệt viên",
          email: "moderator@phongchongluadao.vn",
          permissions: ["blog_write", "report_manage"],
          isActive: true
        },
        {
          username: "editor",
          password: "editor123",
          role: "admin",
          fullName: "Biên tập viên",
          email: "editor@phongchongluadao.vn",
          permissions: ["blog_write"],
          isActive: true
        }
      ]);
      console.log("✓ Enhanced admin accounts created");
      console.log("  - Super Admin: admin/admin123");
      console.log("  - Moderator: moderator/mod123");
      console.log("  - Editor: editor/editor123");
    }

    console.log("✓ Database initialization completed successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}