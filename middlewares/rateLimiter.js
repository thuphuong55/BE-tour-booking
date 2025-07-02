const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000,   // 1 phút
  max: 5,                // 5 request / phút / IP
  message: { message: "Quá nhiều yêu cầu, thử lại sau!" },
});
