const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware bảo vệ - xác thực token
const protect = (req, res, next) => {
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
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error: JWT_SECRET not set"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    console.log('[protect] Authenticated user:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });

    next();
  } catch (error) {
    console.error('[protect] Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid or expired token"
    });
  }
};

// Middleware kiểm tra role admin
const ensureAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "User not authenticated"
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Admin access required"
    });
  }

  console.log('[ensureAdmin] Admin access granted for:', req.user.email);
  next();
};

// Middleware kiểm tra role agency
const ensureAgency = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "User not authenticated"
    });
  }

  if (req.user.role !== 'agency') {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Agency access required"
    });
  }

  console.log('[ensureAgency] Agency access granted for:', req.user.email);
  next();
};

// Middleware kiểm tra agency đã được approve
const ensureAgencyApproved = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "User not authenticated"
    });
  }

  if (req.user.role !== 'agency') {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Agency access required"
    });
  }

  if (req.user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Agency not approved yet"
    });
  }

  console.log('[ensureAgencyApproved] Approved agency access for:', req.user.email);
  next();
};

// Middleware cho phép admin hoặc agency
const ensureAdminOrAgency = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "User not authenticated"
    });
  }

  if (!['admin', 'agency'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Admin or Agency access required"
    });
  }

  console.log('[ensureAdminOrAgency] Access granted for:', req.user.role, req.user.email);
  next();
};

module.exports = {
  protect,
  ensureAdmin,
  ensureAgency,
  ensureAgencyApproved,
  ensureAdminOrAgency
};
