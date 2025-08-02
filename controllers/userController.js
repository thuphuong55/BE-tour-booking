const { User } = require("../models");
const generateCrudController = require("./generateCrudController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../config/mailer"); // dùng file mailer của bạn
require("dotenv").config();

const OTP_STORE = {};
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// 🧹 Dọn dẹp OTP hết hạn mỗi 5 phút
setInterval(() => {
  const now = new Date();
  const expiredEmails = [];
  
  for (const [email, data] of Object.entries(OTP_STORE)) {
    if (data.expiresAt && now > data.expiresAt) {
      expiredEmails.push(email);
    }
  }
  
  expiredEmails.forEach(email => {
    delete OTP_STORE[email];
    console.log(`🗑️ Cleaned up expired OTP for: ${email}`);
  });
  
  if (expiredEmails.length > 0) {
    console.log(`🧹 Cleaned up ${expiredEmails.length} expired OTPs`);
  }
}, 5 * 60 * 1000); // 5 phút

const register = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Kiểm tra email đã tồn tại chưa (bao gồm cả user chưa verified)
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // 🔄 THAY ĐỔI: Lưu thông tin tạm vào OTP_STORE thay vì tạo user ngay
    OTP_STORE[email] = {
      otp: otp,
      userData: {
        email,
        name,
        password_hash: await bcrypt.hash(password, 10),
        role: "user"
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // OTP hết hạn sau 10 phút
    };

    await sendEmail(
      email,
      "Mã xác thực tài khoản",
      `<h2>Chào mừng bạn đến với hệ thống Travel Tour!</h2>
      <p>Để hoàn tất đăng ký, vui lòng nhập mã xác thực bên dưới vào ứng dụng:</p>
      <div style='font-size:24px;font-weight:bold;color:#1976d2;margin:16px 0;'>${otp}</div>
      <p><strong>⏰ Mã này sẽ hết hạn sau 10 phút.</strong></p>
      <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
      <hr>
      <p>Trân trọng,<br>Travel Tour Team</p>`
    );
   
    console.log(`📧 OTP sent to ${email}: ${otp} (expires in 10 minutes)`);

    res.json({ 
      message: "Đã gửi mã xác thực qua email. Vui lòng kiểm tra email và nhập OTP để hoàn tất đăng ký.",
      note: "OTP có hiệu lực trong 10 phút"
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Kiểm tra OTP_STORE có thông tin đăng ký tạm chưa
    const tempData = OTP_STORE[email];
    
    if (!tempData) {
      return res.status(400).json({ 
        message: "Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại." 
      });
    }

    // Kiểm tra OTP có đúng không
    if (tempData.otp != otp) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }

    // Kiểm tra OTP có hết hạn chưa
    if (new Date() > tempData.expiresAt) {
      delete OTP_STORE[email]; // Xóa data hết hạn
      return res.status(400).json({ 
        message: "Mã OTP đã hết hạn. Vui lòng đăng ký lại." 
      });
    }

    // ✅ OTP hợp lệ → Tạo user trong database
    const user = await User.create({
      ...tempData.userData,
      isVerified: false, // User được tạo với trạng thái đã verified
      status: 'active'
    });

    // Xóa thông tin tạm khỏi memory
    delete OTP_STORE[email];

    console.log(`✅ User created successfully: ${user.email} (ID: ${user.id})`);

    // 🎁 GỬI MÃ GIẢM GIÁ WELCOME CHO USER MỚI
    try {
      await sendEmail(
        email,
        "🎉 Chào mừng bạn! Nhận ngay mã giảm giá 10%",
        `<h2>🎉 Chào mừng bạn đến với Travel Tour!</h2>
        <p>Xin chào ${user.name},</p>
        <p>Tài khoản của bạn đã được tạo thành công!</p>
        
        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;'>
          <h3 style='color: white; margin: 0;'> MÃ GIẢM GIÁ ĐẶC BIỆT</h3>
          <div style='background: white; color: #333; font-size: 24px; font-weight: bold; 
                      padding: 10px; border-radius: 5px; margin: 10px 0; letter-spacing: 2px;'>
            WELCOME10
          </div>
          <p style='color: white; margin: 0;'>Giảm 10% cho tour đầu tiên của bạn!</p>
        </div>
        
        <p><strong>Cách sử dụng:</strong></p>
        <ul>
          <li>Nhập mã <strong>WELCOME10</strong> khi đặt tour</li>
          <li>Áp dụng cho đơn hàng từ 1,000,000 VNĐ</li>
          <li>Có hiệu lực trong 30 ngày</li>
        </ul>
        
        <p> Hãy khám phá các tour du lịch tuyệt vời của chúng tôi!</p>
        <hr>
        <p>Trân trọng,<br>Travel Tour Team</p>`
      );
      console.log(`📧 Welcome promotion email sent to: ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome promotion email:', emailError);
      // Không fail verification nếu email không gửi được
    }
    
    res.json({ 
      success: true,
      message: "Xác thực thành công! Tài khoản đã được tạo. Kiểm tra email để nhận mã giảm giá welcome.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kiểm tra xem input là email hay số điện thoại
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || phone);
    const whereClause = isEmail ? { email: email || phone } : { phone: email || phone };

    console.log(`🔍 Login attempt with ${isEmail ? 'email' : 'phone'}:`, email);

    const user = await User.findOne({ where: whereClause });
    if (!user) {
      return res.status(404).json({ 
        message: `Tài khoản không tồn tại với ${isEmail ? 'email' : 'số điện thoại'} này` 
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Tài khoản chưa xác thực" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu" });

    // Tạo JWT token với thông tin user
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        phone: user.phone 
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`✅ Login successful for user: ${user.email} (${user.role})`);

    res.json({ 
      message: "Đăng nhập thành công", 
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  ...generateCrudController(User),
  register,
  verifyOtp,
  login
};
