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

module.exports = router;
