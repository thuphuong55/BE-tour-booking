const express = require("express");
const router = express.Router();
const agencyPaymentController = require("../controllers/agencyPaymentController");
const { protect } = require("../middlewares/authMiddleware");
const ensureAgencyApproved = require("../middlewares/ensureAgencyApproved");

// Tất cả routes yêu cầu agency role và agency đã được approved
router.use(protect(['agency']));
router.use(ensureAgencyApproved);

// Dashboard & Statistics
router.get("/stats", agencyPaymentController.getMyPaymentStats);
router.get("/revenue", agencyPaymentController.getMyRevenueStats);
router.get("/commission", agencyPaymentController.getMyCommissionStats);

// Payment Management (chỉ payments của tours thuộc agency)
router.get("/", agencyPaymentController.getMyPayments);
router.get("/:id", agencyPaymentController.getMyPaymentById);

// Revenue Tracking
router.get("/monthly", agencyPaymentController.getMonthlyRevenue);
router.get("/export/csv", agencyPaymentController.exportMyPaymentsCSV);

module.exports = router;
