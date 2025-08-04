const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware bảo vệ - xác thực token và kiểm tra role
const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      console.log('[PROTECT] Request to:', req.method, req.originalUrl);
      const authHeader = req.headers.authorization;
      console.log('[PROTECT] Auth header:', authHeader ? 'Present' : 'Missing');

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log('[PROTECT] No valid auth header');
        return res.status(401).json({
          success: false,
          code: 401,
          error: "Unauthorized",
          message: "Authorization header must start with Bearer",
        });
      }

      const token = authHeader.split(" ")[1];
      console.log('[PROTECT] Token extracted:', token ? 'Present' : 'Missing');
      
      if (!process.env.JWT_SECRET) {
        console.log('[PROTECT] JWT_SECRET not set');
        return res.status(500).json({
          success: false,
          error: "Server configuration error: JWT_SECRET not set"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log('[PROTECT] User decoded:', {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        fullDecoded: decoded
      });
      
      // ✨ KIỂM TRA USER STATUS TRONG DATABASE
      if (decoded.role === 'agency') {
        const { User } = require('../models');
        const userInDb = await User.findByPk(decoded.id);
        
        if (!userInDb || userInDb.status !== 'active') {
          console.log('[PROTECT] Agency user inactive/locked:', {
            userId: decoded.id,
            userExists: !!userInDb,
            userStatus: userInDb?.status
          });
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng đăng nhập lại.",
            action: "FORCE_LOGOUT" // Signal frontend to logout
          });
        }
        
        // ✨ KIỂM TRA TOKEN INVALIDATION TIME (if exists)
        if (userInDb.token_invalidated_at) {
          const tokenIssuedAt = new Date(decoded.iat * 1000);
          const invalidatedAt = new Date(userInDb.token_invalidated_at);
          
          if (tokenIssuedAt < invalidatedAt) {
            console.log('[PROTECT] Token invalidated:', {
              tokenIssued: tokenIssuedAt,
              invalidatedAt: invalidatedAt
            });
            return res.status(403).json({
              success: false,
              error: "Forbidden", 
              message: "Token đã bị vô hiệu hóa. Vui lòng đăng nhập lại.",
              action: "FORCE_LOGOUT"
            });
          }
        }
        
        console.log('[PROTECT] Agency user status verified: active');
      }
      
      // Kiểm tra role nếu có yêu cầu
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        console.log('[PROTECT] Role access denied:', decoded.role, 'not in', allowedRoles);
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      console.log('[PROTECT] Authentication successful');
      next();
    } catch (error) {
      console.error('[PROTECT] Authentication error:', error.message);
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Invalid or expired token"
      });
    }
  };
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

  next();
};

module.exports = {
  protect,
  ensureAdmin,
  ensureAgency,
  ensureAgencyApproved,
  ensureAdminOrAgency
};
