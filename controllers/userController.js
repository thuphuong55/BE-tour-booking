const { User } = require("../models");
const generateCrudController = require("./generateCrudController");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../config/mailer"); // dùng file mailer của bạn
require("dotenv").config();

const OTP_STORE = {};
const JWT_SECRET = process.env.JWT_SECRET || "secret";

const register = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    OTP_STORE[email] = otp;

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      name,
      password_hash: hashed,
      isVerified: false,
      role: "user" // hoặc đặt default trong DB
    });

    await sendEmail(
      email,
      "Mã xác thực tài khoản",
      `<p>Mã xác thực là: <b>${otp}</b></p>`
    );
   

    res.json({ message: "Đã gửi mã xác thực qua email" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (OTP_STORE[email] && OTP_STORE[email] == otp) {
      await User.update({ isVerified: true }, { where: { email } });
      delete OTP_STORE[email];
      return res.json({ message: "Xác thực thành công" });
    }
    res.status(400).json({ message: "Mã OTP sai hoặc đã hết hạn" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Tài khoản chưa xác thực" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

module.exports = {
  ...generateCrudController(User),
  register,
  verifyOtp,
  login
};
