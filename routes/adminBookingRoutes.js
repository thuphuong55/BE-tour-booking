const express = require("express");
const router = express.Router();
const adminBookingController = require("../controllers/adminBookingController");
const { protect } = require("../middlewares/authMiddleware");

// Tất cả routes yêu cầu admin role
router.use(protect(['admin']));

// Dashboard & Statistics
router.get("/stats", adminBookingController.getBookingStats);
router.get("/revenue", adminBookingController.getRevenueStats);

// Booking Management
router.get("/", adminBookingController.getAllBookings);
router.get("/:id", adminBookingController.getBookingById);
router.put("/:id/status", adminBookingController.updateBookingStatus);
router.delete("/:id", adminBookingController.deleteBooking);

// Bulk Operations
router.put("/bulk/status", adminBookingController.bulkUpdateStatus);
router.delete("/bulk", adminBookingController.bulkDeleteBookings);

// Export
router.get("/export/csv", adminBookingController.exportBookingsCSV);

module.exports = router;
