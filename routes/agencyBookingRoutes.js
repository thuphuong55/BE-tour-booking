const express = require("express");
const router = express.Router();
const agencyBookingController = require("../controllers/agencyBookingController");
const { protect } = require("../middlewares/authMiddleware");
const ensureAgencyApproved = require("../middlewares/ensureAgencyApproved");
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Tất cả routes yêu cầu agency role và agency đã được approved
// Middleware cho từng route

// Dashboard & Statistics
router.get("/stats", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.getMyBookingStats);
router.get("/revenue", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.getMyRevenueStats);

// Customer Management (phải đặt trước /:id để tránh conflict)
router.get("/customers", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.getMyCustomers);
router.get("/reviews", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.getMyBookingReviews);

// Booking Management (chỉ tours của agency)
router.get("/", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.getMyBookings);
router.get("/:id", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.getMyBookingById);
router.put("/:id/status", protect(['agency']), asyncHandler(ensureAgencyApproved), agencyBookingController.updateMyBookingStatus);

// Test middleware
router.get("/test-middleware", protect(['agency']), asyncHandler(ensureAgencyApproved), (req, res) => {
  res.json({ message: "Middleware chạy thành công" });
});

console.log("Đang gắn middleware protect và ensureAgencyApproved");

module.exports = router;
