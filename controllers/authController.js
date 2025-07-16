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


    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
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

