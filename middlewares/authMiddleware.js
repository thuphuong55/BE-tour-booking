const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.protect = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      // Không có header hoặc không phải dạng Bearer token
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
      }

      const token = authHeader.split(" ")[1];

      // Xác minh token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        }

        // Lưu thông tin user vào req
        req.user = decoded;

        // Nếu có chỉ định role mà user không thuộc role cho phép
        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }

        next();
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
