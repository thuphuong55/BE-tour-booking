const { FAQ } = require("../models");

// Sample FAQ data cho chat system
const sampleFAQs = [
  {
    question: "Làm thế nào để đặt tour?",
    answer: "Bạn có thể đặt tour bằng cách: 1) Chọn tour yêu thích, 2) Chọn ngày khởi hành, 3) Điền thông tin khách hàng, 4) Chọn phương thức thanh toán (VNPay/MoMo), 5) Hoàn tất thanh toán để xác nhận đặt tour.",
    category: "booking",
    keywords: ["đặt tour", "booking", "đặt chỗ", "đăng ký tour"],
    order_priority: 10
  },
  {
    question: "Có thể hủy tour sau khi đã đặt không?",
    answer: "Có, bạn có thể hủy tour nhưng cần tuân thủ chính sách hủy: Hủy trước 7 ngày: hoàn 80% tiền, Hủy trước 3 ngày: hoàn 50% tiền, Hủy trong 3 ngày: không hoàn tiền.",
    category: "booking", 
    keywords: ["hủy tour", "cancel", "hoàn tiền", "refund"],
    order_priority: 9
  },
  {
    question: "Các phương thức thanh toán nào được hỗ trợ?",
    answer: "Chúng tôi hỗ trợ thanh toán qua: VNPay (thẻ ATM, Internet Banking), MoMo (ví điện tử), và chuyển khoản ngân hàng.",
    category: "payment",
    keywords: ["thanh toán", "payment", "vnpay", "momo", "chuyển khoản"],
    order_priority: 8
  },
  {
    question: "Tour có bao gồm bảo hiểm không?",
    answer: "Có, tất cả tour của chúng tôi đều bao gồm bảo hiểm du lịch cơ bản. Bạn có thể mua thêm bảo hiểm mở rộng nếu cần.",
    category: "tour",
    keywords: ["bảo hiểm", "insurance", "an toàn"],
    order_priority: 7
  },
  {
    question: "Nên mang theo gì khi đi Đà Lạt?",
    answer: "Khi đi Đà Lạt, bạn nên mang: áo khoác ấm (ban đêm lạnh), dù/áo mưa, giày thể thao thoải mái, kem chống nắng, và camera để chụp ảnh.",
    category: "tour",
    keywords: ["đà lạt", "chuẩn bị", "đồ đạc", "packing"],
    order_priority: 6
  },
  {
    question: "Thời tiết Đà Lạt tháng 7 như thế nào?",
    answer: "Tháng 7 ở Đà Lạt khá mát mẻ với nhiệt độ 18-22°C, thỉnh thoảng có mưa nhẹ. Đây là mùa hoa đẹp và thời tiết dễ chịu để du lịch.",
    category: "tour",
    keywords: ["thời tiết", "đà lạt", "tháng 7", "weather"],
    order_priority: 5
  },
  {
    question: "Có thể đặt tour cho nhóm lớn không?",
    answer: "Có, chúng tôi hỗ trợ đặt tour cho nhóm từ 10 người trở lên với giá ưu đãi. Vui lòng liên hệ hotline để được tư vấn chi tiết.",
    category: "booking",
    keywords: ["nhóm lớn", "group", "ưu đãi", "giảm giá"],
    order_priority: 4
  },
  {
    question: "Làm thế nào để liên hệ hỗ trợ?",
    answer: "Bạn có thể liên hệ qua: Hotline: 1900-xxxx, Email: support@tourapp.com, hoặc chat trực tiếp tại website.",
    category: "general",
    keywords: ["liên hệ", "support", "hotline", "help"],
    order_priority: 3
  }
];

// Function to seed FAQ data
async function seedFAQData() {
  try {
    console.log("🌱 Starting to seed FAQ data...");
    
    // Xóa data cũ (nếu có)
    await FAQ.destroy({ where: {} });
    
    // Thêm sample data
    await FAQ.bulkCreate(sampleFAQs);
    
    console.log("✅ FAQ data seeded successfully!");
    console.log(`📊 Created ${sampleFAQs.length} FAQ entries`);
    
    return true;
  } catch (error) {
    console.error("❌ Error seeding FAQ data:", error);
    return false;
  }
}

module.exports = {
  sampleFAQs,
  seedFAQData
};
