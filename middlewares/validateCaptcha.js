const axios = require("axios");

module.exports = async (req, res, next) => {
  const captchaToken = req.body.captchaToken;

  // ✅ Cho phép bypass khi test
  if (captchaToken === "test" || captchaToken === "bypass") {
    return next();
  }

  if (!captchaToken) {
    return res.status(400).json({ message: "Thiếu captcha" });
  }

  // Nếu dùng thật thì gửi lên Google (đang bị lỗi ở đây)
  const axios = require("axios");

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`
    );

    if (!response.data.success) {
      return res.status(400).json({ message: "Captcha thất bại" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Lỗi xác minh captcha", error: err.message });
  }
};

