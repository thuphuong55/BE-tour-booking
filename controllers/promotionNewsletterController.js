const { User, Promotion } = require("../models");
const { sendEmail } = require("../config/mailer");
const { protect } = require("../middlewares/auth");

// 📧 ADMIN - Gửi mã giảm giá qua email cho tất cả users
const sendPromotionNewsletter = async (req, res) => {
  try {
    const { promotion_code, subject, custom_message } = req.body;

    if (!promotion_code) {
      return res.status(400).json({ message: "Cần có mã giảm giá để gửi" });
    }

    // Kiểm tra promotion có tồn tại không
    const promotion = await Promotion.findOne({
      where: { code: promotion_code.trim().toUpperCase() }
    });

    if (!promotion) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại" });
    }

    // Lấy tất cả users đã verified
    const users = await User.findAll({
      where: { 
        isVerified: true,
        role: 'user' // Chỉ gửi cho user, không gửi cho admin/agency
      },
      attributes: ['email', 'name']
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "Không có user nào để gửi" });
    }

    // Tạo email content
    const emailSubject = subject || `🎁 Mã giảm giá đặc biệt: ${promotion.code}`;
    const customMsg = custom_message || "Chúng tôi có một ưu đãi đặc biệt dành riêng cho bạn!";

    // Gửi email đồng thời cho tất cả users
    const emailPromises = users.map(user => 
      sendEmail(
        user.email,
        emailSubject,
        `<h2>🎁 ${customMsg}</h2>
        <p>Xin chào ${user.name || 'bạn'},</p>
        
        <div style='background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                    padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;'>
          <h3 style='color: white; margin: 0; font-size: 20px;'>🌟 MÃ GIẢM GIÁ ĐẶC BIỆT</h3>
          <div style='background: white; color: #333; font-size: 28px; font-weight: bold; 
                      padding: 15px; border-radius: 8px; margin: 15px 0; letter-spacing: 3px;'>
            ${promotion.code}
          </div>
          <p style='color: white; margin: 0; font-size: 16px;'>${promotion.description}</p>
        </div>
        
        <div style='background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;'>
          <h4 style='color: #333; margin-top: 0;'>📋 Thông tin ưu đãi:</h4>
          <ul style='color: #555;'>
            <li><strong>Mã giảm giá:</strong> ${promotion.code}</li>
            <li><strong>Mô tả:</strong> ${promotion.description}</li>
            <li><strong>Hiệu lực từ:</strong> ${new Date(promotion.start_date).toLocaleDateString('vi-VN')}</li>
            <li><strong>Hết hạn:</strong> ${new Date(promotion.end_date).toLocaleDateString('vi-VN')}</li>
          </ul>
        </div>
        
        <p><strong>Cách sử dụng:</strong></p>
        <ol>
          <li>Chọn tour yêu thích trên website</li>
          <li>Nhập mã <strong>${promotion.code}</strong> khi đặt tour</li>
          <li>Hệ thống sẽ tự động áp dụng giảm giá</li>
        </ol>
        
        <div style='text-align: center; margin: 30px 0;'>
          <a href="http://localhost:3000/tours" 
             style='background: #007bff; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 25px; font-weight: bold;'>
            🧳 KHÁM PHÁ TOURS NGAY
          </a>
        </div>
        
        <hr>
        <p style='color: #666;'>
          <em>Email này được gửi tới ${user.email}. 
          Nếu bạn không muốn nhận email khuyến mãi, vui lòng liên hệ support.</em>
        </p>
        <p>Trân trọng,<br>Travel Tour Team</p>`
      ).catch(error => {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
        return { email: user.email, error: error.message };
      })
    );

    // Chờ tất cả emails được gửi
    const results = await Promise.allSettled(emailPromises);
    
    // Đếm thành công và thất bại
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`📧 Newsletter sent: ${successful} successful, ${failed} failed`);

    res.json({
      success: true,
      message: `Đã gửi mã giảm giá ${promotion.code} cho ${successful}/${users.length} users`,
      stats: {
        total_users: users.length,
        successful_emails: successful,
        failed_emails: failed,
        promotion: {
          code: promotion.code,
          description: promotion.description,
          valid_until: promotion.end_date
        }
      }
    });

  } catch (error) {
    console.error('❌ Error sending promotion newsletter:', error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi gửi newsletter", 
      error: error.message 
    });
  }
};

// 📧 ADMIN - Gửi mã giảm giá cho user cụ thể
const sendPromotionToUser = async (req, res) => {
  try {
    const { user_email, promotion_code, custom_message } = req.body;

    if (!user_email || !promotion_code) {
      return res.status(400).json({ message: "Cần có email user và mã giảm giá" });
    }

    // Kiểm tra user tồn tại
    const user = await User.findOne({
      where: { email: user_email, isVerified: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại hoặc chưa xác thực" });
    }

    // Kiểm tra promotion
    const promotion = await Promotion.findOne({
      where: { code: promotion_code.trim().toUpperCase() }
    });

    if (!promotion) {
      return res.status(404).json({ message: "Mã giảm giá không tồn tại" });
    }

    const customMsg = custom_message || `Chúng tôi gửi bạn một mã giảm giá đặc biệt!`;

    // Gửi email
    await sendEmail(
      user.email,
      `🎁 Mã giảm giá dành riêng cho ${user.name || 'bạn'}`,
      `<h2>🎁 ${customMsg}</h2>
      <p>Xin chào ${user.name || 'bạn'},</p>
      
      <div style='background: linear-gradient(135deg, #48cae4 0%, #023e8a 100%); 
                  padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;'>
        <h3 style='color: white; margin: 0;'>✨ MÃ GIẢM GIÁ DÀNH RIÊNG CHO BẠN</h3>
        <div style='background: white; color: #333; font-size: 28px; font-weight: bold; 
                    padding: 15px; border-radius: 8px; margin: 15px 0; letter-spacing: 3px;'>
          ${promotion.code}
        </div>
        <p style='color: white; margin: 0;'>${promotion.description}</p>
      </div>
      
      <p>Mã này được gửi đặc biệt cho tài khoản <strong>${user.email}</strong></p>
      <p>Hãy sử dụng ngay để nhận ưu đãi tuyệt vời!</p>
      
      <hr>
      <p>Trân trọng,<br>Travel Tour Team</p>`
    );

    console.log(`📧 Personal promotion sent to: ${user.email}`);

    res.json({
      success: true,
      message: `Đã gửi mã giảm giá ${promotion.code} cho user ${user.email}`,
      data: {
        recipient: {
          email: user.email,
          name: user.name
        },
        promotion: {
          code: promotion.code,
          description: promotion.description,
          valid_until: promotion.end_date
        }
      }
    });

  } catch (error) {
    console.error('❌ Error sending personal promotion:', error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi gửi mã giảm giá cá nhân", 
      error: error.message 
    });
  }
};

module.exports = {
  sendPromotionNewsletter,
  sendPromotionToUser
};
