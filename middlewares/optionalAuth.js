const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware authenticate optional - không throw error nếu không có token
const optionalAuth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token → tiếp tục như guest
      console.log("🎫 No token provided - proceeding as guest");
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "
    
    if (!token) {
      // Token empty → tiếp tục như guest
      console.log("🎫 Empty token - proceeding as guest");
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tìm user
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'username', 'role']
    });

    if (!user) {
      // User không tồn tại → tiếp tục như guest
      console.log("🎫 User not found - proceeding as guest");
      req.user = null;
      return next();
    }

    // ✅ User hợp lệ
    console.log("👤 Authenticated user found:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    req.user = user;
    next();

  } catch (error) {
    // Token invalid hoặc expired → tiếp tục như guest
    console.log("🎫 Token invalid/expired - proceeding as guest:", error.message);
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
