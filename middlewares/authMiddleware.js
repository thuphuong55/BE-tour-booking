const jwt = require("jsonwebtoken");
require("dotenv").config();

// protect.js
exports.protect = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

        if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          code: 401,
          error: "Unauthorized",
          message: "Authorization header must start with Bearer",
        });
      }

      const token = authHeader.split(" ")[1];
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

