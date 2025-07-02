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

