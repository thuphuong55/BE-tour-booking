const express = require("express");
const router = express.Router();
const adminPaymentController = require("../controllers/adminPaymentController");
const { protect } = require("../middlewares/authMiddleware");

// Tất cả routes yêu cầu admin role
router.use(protect(['admin']));

// Dashboard & Statistics
router.get("/stats", adminPaymentController.getPaymentStats);
router.get("/revenue", adminPaymentController.getRevenueStats);
router.get("/methods", adminPaymentController.getPaymentMethodStats);

// Payment Management
router.get("/", adminPaymentController.getAllPayments);
router.get("/:id", adminPaymentController.getPaymentById);
router.put("/:id/status", adminPaymentController.updatePaymentStatus);

// Failed Payments Management
router.get("/failed", adminPaymentController.getFailedPayments);
router.put("/:id/retry", adminPaymentController.retryPayment);

// Export
router.get("/export/csv", adminPaymentController.exportPaymentsCSV);

module.exports = router;
