import { db } from "./db";
import { reports, blogPosts, admins } from "@shared/schema";

export async function initializeDatabase() {
  try {
    // Check if data already exists
    const existingReports = await db.select().from(reports).limit(1);
    const existingBlogs = await db.select().from(blogPosts).limit(1);
    const existingAdmins = await db.select().from(admins).limit(1);
    
    if (existingReports.length === 0) {
      // Add sample reports
      await db.insert(reports).values([
        {
          accusedName: "Nguyễn Văn A",
          phoneNumber: "0123456789",
          accountNumber: "1234567890123",
          bank: "vietcombank",
          amount: 5000000,
          description: "Lừa đảo qua Facebook bằng cách giả mạo bán hàng online. Đã chuyển tiền nhưng không nhận được hàng và bị chặn liên lạc.",
          isAnonymous: false,
          reporterName: "Trần Thị B",
          reporterPhone: "0987654321",
          receiptUrl: null
        },
        {
          accusedName: "Lê Minh C",
          phoneNumber: "0987123456",
          accountNumber: "9876543210987",
          bank: "techcombank",
          amount: 10000000,
          description: "Lừa đảo đầu tư tiền ảo với lời hứa lợi nhuận cao. Sau khi chuyển tiền không thể rút được và mất liên lạc.",
          isAnonymous: true,
          reporterName: null,
          reporterPhone: null,
          receiptUrl: null
        },
        {
          accusedName: "Phạm Văn D",
          phoneNumber: "0369852147",
          accountNumber: null,
          bank: null,
          amount: 2000000,
          description: "Lừa đảo qua tin nhắn giả mạo ngân hàng yêu cầu cập nhật thông tin và lấy mã OTP.",
          isAnonymous: false,
          reporterName: "Hoàng Thị E",
          reporterPhone: "0912345678",
          receiptUrl: null
        }
      ]);
      console.log("✓ Sample reports added to database");
    }

    if (existingBlogs.length === 0) {
      // Add sample blog posts
      await db.insert(blogPosts).values([
        {
          title: "10 thủ đoạn lừa đảo phổ biến nhất năm 2024",
          slug: "10-thu-doan-lua-dao-pho-bien-nhat-2024",
          excerpt: "Cập nhật những phương thức lừa đảo mới nhất mà các kẻ xấu đang sử dụng để chiếm đoạt tài sản của người dân. Từ việc giả mạo ngân hàng đến lừa đảo đầu tư...",
          content: "Trong năm 2024, các thủ đoạn lừa đảo ngày càng tinh vi và đa dạng. Dưới đây là 10 thủ đoạn phổ biến nhất mà bạn cần biết:\n\n1. Giả mạo tin nhắn ngân hàng\n2. Lừa đảo qua mạng xã hội\n3. Đầu tư tiền ảo có lợi nhuận cao\n4. Giả mạo nhân viên công an\n5. Lừa đảo qua ứng dụng hẹn hò\n6. Bán hàng online không giao hàng\n7. Lừa đảo vay tiền online\n8. Giả mạo nhân viên bảo hiểm\n9. Lừa đảo qua game online\n10. Chiếm đoạt tài khoản Facebook\n\nHãy luôn cảnh giác và xác minh thông tin từ nhiều nguồn trước khi thực hiện bất kỳ giao dịch nào.",
          coverImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3",
          tags: ["lừa đảo online", "phòng chống", "cảnh báo"],
          readTime: 8,
          views: 0
        },
        {
          title: "Cách nhận biết tin nhắn lừa đảo từ ngân hàng",
          slug: "cach-nhan-biet-tin-nhan-lua-dao-tu-ngan-hang",
          excerpt: "Hướng dẫn chi tiết cách phân biệt tin nhắn thật và giả từ ngân hàng để tránh bị lừa đảo...",
          content: "Ngân hàng không bao giờ yêu cầu thông tin cá nhân qua tin nhắn. Dưới đây là những dấu hiệu nhận biết tin nhắn lừa đảo:\n\n- Yêu cầu cung cấp mã OTP\n- Link dẫn đến trang web không chính thức\n- Thông báo tài khoản bị khóa đột ngột\n- Yêu cầu xác nhận thông tin thẻ\n- Số điện thoại gửi tin không phải của ngân hàng\n\nLuôn liên hệ trực tiếp với ngân hàng qua hotline chính thức để xác minh.",
          coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3",
          tags: ["ngân hàng", "tin nhắn", "phòng chống"],
          readTime: 5,
          views: 0
        },
        {
          title: "Lừa đảo qua mạng xã hội: Cách thức và phòng tránh",
          slug: "lua-dao-qua-mang-xa-hoi-cach-thuc-va-phong-tranh",
          excerpt: "Phân tích các hình thức lừa đảo phổ biến trên Facebook, Zalo và cách bảo vệ bản thân...",
          content: "Mạng xã hội là môi trường màu mỡ cho các hoạt động lừa đảo. Các thủ đoạn phổ biến:\n\n- Giả mạo danh tính người quen\n- Bán hàng online giả\n- Lừa đảo tình cảm\n- Đầu tư tài chính ảo\n- Chiếm đoạt tài khoản\n\nCách phòng tránh:\n- Xác minh danh tính qua video call\n- Không chuyển tiền cho người lạ\n- Kiểm tra thông tin người bán\n- Báo cáo tài khoản đáng ngờ\n- Sử dụng mật khẩu mạnh",
          coverImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3",
          tags: ["mạng xã hội", "facebook", "zalo"],
          readTime: 7,
          views: 0
        }
      ]);
      console.log("✓ Sample blog posts added to database");
    }

    if (existingAdmins.length === 0) {
      // Add default admin account
      await db.insert(admins).values([
        {
          username: "admin",
          password: "admin123", // Note: In production, this should be hashed
          role: "admin"
        }
      ]);
      console.log("✓ Default admin account created (username: admin, password: admin123)");
    }

    console.log("✓ Database initialization completed");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}