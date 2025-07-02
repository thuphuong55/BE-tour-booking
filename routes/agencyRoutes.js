const express = require("express");
const router = express.Router();
const agencyCtrl = require("../controllers/agencyController");

const rateLimiter = require("../middlewares/rateLimiter");
const validateCaptcha = require("../middlewares/validateCaptcha");
const protect = require("../middlewares/protect"); 

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

module.exports = router;
