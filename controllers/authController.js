const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const { User } = require("../models");
require("dotenv").config();

// [POST] /api/auth/register
exports.register = async (req, res) => {
  try {

    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng cung cấp tất cả các trường bắt buộc" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role
    });


    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [POST] /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });


    let agencyId = null;
    if (user.role === "agency") {
      const agency = await require("../models").Agency.findOne({ where: { user_id: user.id } });
      if (agency) agencyId = agency.id;
    }
    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ...(agencyId && { agency_id: agencyId })
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [POST] /api/auth/logout
exports.logout = async (req, res) => {
  try {
    return res.json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
// authController.js
exports.setPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: "Thiếu token hoặc mật khẩu" });

  const user = await User.findOne({ where: { temp_password_token: token } });
  if (!user) return res.status(400).json({ message: "Token không hợp lệ/đã dùng" });

  user.password = await bcrypt.hash(password, 10);
  user.status = "active";
  user.temp_password_token = null;
  await user.save();

  res.json({ message: "Đặt mật khẩu thành công, hãy đăng nhập!" });
};
//set lại mật khẩu
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword)
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Mật khẩu không khớp" });

  try {
    const user = await User.findByPk(token); // nếu token là user.id
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash(password, 10);

    await user.update({ password_hash: hashed });

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// [GET] /api/auth/me - Get current user info
exports.getUserInfo = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'status', 'name', 'created_at', 'updated_at']
    });

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    return res.status(200).json({
      message: "Lấy thông tin người dùng thành công",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (err) {
    console.error("Error getting user info:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// [PUT] /api/auth/me - Update current user info
exports.updateUserInfo = async (req, res) => {
  try {
    const { username, email, name, currentPassword, newPassword } = req.body;
    
    // Lấy thông tin user hiện tại
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Kiểm tra email trùng lặp (nếu thay đổi email)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email đã được sử dụng bởi người dùng khác" });
      }
    }

    // Kiểm tra username trùng lặp (nếu thay đổi username)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: "Username đã được sử dụng bởi người dùng khác" });
      }
    }

    // Nếu muốn đổi mật khẩu, phải cung cấp mật khẩu hiện tại
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu mới" });
      }

      // Kiểm tra mật khẩu hiện tại
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
      }

      // Validate mật khẩu mới
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      }
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (name !== undefined) updateData.name = name; // Cho phép set name = null
    
    // Hash mật khẩu mới nếu có
    if (newPassword) {
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }

    // Cập nhật thông tin user
    await user.update(updateData);

    // Trả về thông tin user đã cập nhật (không bao gồm password)
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'status', 'name', 'created_at', 'updated_at']
    });

    return res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        name: updatedUser.name,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (err) {
    console.error("Error updating user info:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] /api/auth/forgot-password - Gửi OTP qua email
exports.forgotPassword = async (req, res) => {
  try {
    const { email, emailOrUsername } = req.body;
    
    // Accept both 'email' and 'emailOrUsername' fields
    const userEmail = email || emailOrUsername;

    if (!userEmail) {
      return res.status(400).json({ message: "Vui lòng cung cấp email" });
    }

    // Tìm user theo email
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
      // Không tiết lộ email có tồn tại hay không (security)
      return res.status(200).json({ 
        message: "Nếu email tồn tại, OTP đã được gửi. Vui lòng kiểm tra hộp thư." 
      });
    }

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // OTP có hiệu lực trong 15 phút
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Lưu OTP vào database
    await user.update({
      forgot_password_otp: otp,
      forgot_password_otp_expires: otpExpires
    });

    // Gửi email chứa OTP
    const { sendEmail } = require("../config/mailer");
    try {
      await sendEmail(
        userEmail,
        "Mã OTP đặt lại mật khẩu",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p>Chào <strong>${user.name || user.username || 'bạn'}</strong>,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>Lưu ý quan trọng:</strong></p>
          <ul>
            <li>OTP này có hiệu lực trong <strong>15 phút</strong></li>
            <li>Chỉ sử dụng được <strong>1 lần</strong></li>
            <li>Không chia sẻ OTP với bất kỳ ai</li>
          </ul>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #888; font-size: 12px;">
            Email này được gửi tự động, vui lòng không phản hồi.
          </p>
        </div>
        `
      );
    } catch (emailError) {
      console.error("Lỗi gửi email OTP:", emailError);
      return res.status(500).json({ message: "Lỗi gửi email. Vui lòng thử lại sau." });
    }

    return res.status(200).json({ 
      message: "OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
      debug: process.env.NODE_ENV === 'development' ? { otp } : undefined // Chỉ để debug
    });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] /api/auth/verify-otp - Xác thực OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Vui lòng cung cấp email và OTP" });
    }

    // Tìm user và kiểm tra OTP
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    // Kiểm tra OTP
    if (!user.forgot_password_otp || user.forgot_password_otp !== otp) {
      return res.status(400).json({ message: "OTP không chính xác" });
    }

    // Kiểm tra thời hạn OTP
    if (!user.forgot_password_otp_expires || new Date() > user.forgot_password_otp_expires) {
      return res.status(400).json({ message: "OTP đã hết hạn. Vui lòng yêu cầu OTP mới." });
    }

    // OTP hợp lệ - tạo token tạm thời để reset password
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Lưu reset token (có thể dùng temp_password_token field)
    await user.update({
      temp_password_token: resetToken,
      forgot_password_otp: null, // Xóa OTP sau khi xác thực thành công
      forgot_password_otp_expires: null
    });

    return res.status(200).json({ 
      message: "OTP hợp lệ. Bạn có thể đặt mật khẩu mới.",
      resetToken // Frontend sẽ dùng token này để reset password
    });
  } catch (err) {
    console.error("Error in verifyOTP:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// [POST] /api/auth/reset-password-with-token - Đặt mật khẩu mới bằng token
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    // Tìm user theo reset token
    const user = await User.findOne({ where: { temp_password_token: resetToken } });
    if (!user) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu và xóa token
    await user.update({
      password_hash: hashedPassword,
      temp_password_token: null
    });

    // Gửi email thông báo đổi mật khẩu thành công
    const { sendEmail } = require("../config/mailer");
    try {
      await sendEmail(
        user.email,
        "Mật khẩu đã được đặt lại thành công",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Đặt lại mật khẩu thành công!</h2>
          <p>Chào <strong>${user.name || user.username || 'bạn'}</strong>,</p>
          <p>Mật khẩu của bạn đã được đặt lại thành công vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
          <p><strong>Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.</strong></p>
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              ✅ Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ hỗ trợ ngay lập tức.
            </p>
          </div>
          <hr style="margin: 30px 0;">
          <p style="color: #888; font-size: 12px;">
            Email này được gửi tự động, vui lòng không phản hồi.
          </p>
        </div>
        `
      );
    } catch (emailError) {
      console.error("Lỗi gửi email thông báo:", emailError);
      // Không return error vì việc đổi password đã thành công
    }

    return res.status(200).json({ 
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới." 
    });
  } catch (err) {
    console.error("Error in resetPasswordWithToken:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

