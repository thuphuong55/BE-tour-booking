const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refundController");
const { protect } = require("../middlewares/auth");

router.get("/", protect(['admin']), refundController.getAllRefunds);
router.get("/:id", protect(['admin', 'user']), refundController.getRefundById);

// Admin Actions - Duyệt/Từ chối refund
router.put("/:id/approve", protect(['admin']), refundController.approveRefund);
router.put("/:id/reject", protect(['admin']), refundController.rejectRefund);

// User Routes - Xem refunds của chính mình
router.get("/user/:userId", protect(['admin', 'user']), refundController.getUserRefunds);

module.exports = router;
