const express = require("express");
const router = express.Router();
const agencyController = require('../controllers/agencyController');

// ...existing routes...

// Lấy agency theo user_id
router.get('/by-user/:userId', agencyController.getAgencyByUserId);

module.exports = router;
const agencyCtrl = require("../controllers/agencyController");

const rateLimiter = require("../middlewares/rateLimiter");
const validateCaptcha = require("../middlewares/validateCaptcha");
const protect = require("../middlewares/protect"); 


router.post(
  "/", 
  rateLimiter,
  validateCaptcha,
  agencyCtrl.publicRequestAgency
);

// Public user gửi yêu cầu trở thành agency
router.post(
  "/public-request",
  rateLimiter,
  validateCaptcha,
  agencyCtrl.publicRequestAgency
);

// Test endpoint without captcha validation
router.post(
  "/public-request-test",
  rateLimiter,
  agencyCtrl.publicRequestAgency
);

// Admin duyệt agency
router.put(
  "/approve/:id",
  protect(["admin"]),
  agencyCtrl.approveAgency
);
// 3) NEW: Admin xem danh sách agency
router.get(
  "/",
  protect(["admin"]),
  agencyCtrl.getAgencies
);

// 4) NEW: Admin (hoặc chính agency) xem chi tiết
router.get(
  "/:id",
  protect(["admin", "agency"]),
  agencyCtrl.getAgency
);

// 5) Admin khóa/mở khóa agency
router.put(
  "/toggle-lock/:id",
  protect(["admin"]),
  agencyCtrl.toggleLockAgency
);

// 6) Admin xóa agency 
router.delete(
  "/:id",
  protect(["admin"]),
  agencyCtrl.deleteAgency
);

module.exports = router;
