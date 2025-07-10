const axios = require("axios");

module.exports = async (req, res, next) => {
  const captchaToken = req.body.captchaToken;
  console.log("[validateCaptcha] captchaToken nhận được từ FE:", captchaToken); // Log để debug

  // ✅ Cho phép bỏ qua khi test
  if (captchaToken === "test" || captchaToken === "bypass") {
    console.log("Captcha đã được bỏ qua để kiểm tra.");
    return next();
  }

  if (!captchaToken) {
    console.log("Thiếu mã thông báo Captcha.");
    return res.status(400).json({ message: "Thiếu captcha" });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY chưa được đặt trong .env");
      return res.status(500).json({ message: "Lỗi cấu hình server: Missing reCAPTCHA" });
    }

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`
    );

    if (!response.data.success) {
      console.log("Xác minh Captcha không thành công:", response.data['error-codes']);
      return res.status(400).json({ message: "Captcha failed" });
    }

    next();
  } catch (err) {
    console.error("Lỗi xác minh captcha:", err.message);
    return res.status(500).json({ message: "Lỗi xác thực captcha", error: err.message });
  }
};

