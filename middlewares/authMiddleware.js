const jwt = require("jsonwebtoken");
require("dotenv").config();

// protect.js
exports.protect = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          code: 401,
          error: "Unauthorized",
          message: "Authorization header must start with Bearer",
        });
      }

      const token = authHeader.split(" ")[1];
      // Kiểm tra biến môi trường JWT_SECRET
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: "Lỗi cấu hình server: JWT_SECRET chưa được thiết lập trong .env"
        });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Nếu yêu cầu role và user không thuộc role
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden: You don't have permission" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  };
};

// Hướng dẫn:
// - Đảm bảo file .env có dòng JWT_SECRET=your_jwt_secret
// - Sau khi chỉnh .env, phải khởi động lại server để biến môi trường được load

