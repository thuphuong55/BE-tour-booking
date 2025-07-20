const express = require("express");
const router = express.Router();
const guestBookingController = require("../controllers/guestBookingController");

// ─────────────────────────────────────────────
//  GUEST BOOKING ROUTES (No authentication required)
// ─────────────────────────────────────────────

// 📋 Tạo booking cho khách vãng lai
router.post("/bookings", guestBookingController.createGuestBooking);

// 🔍 Tra cứu booking bằng email
router.get("/bookings/lookup/:email", guestBookingController.lookupBookingByEmail);

// 📄 Lấy chi tiết booking guest
router.get("/bookings/:id", guestBookingController.getGuestBookingById);

// ✅ Validate promotion code cho guest
router.post("/validate-promotion", guestBookingController.validateGuestPromotion);

module.exports = router;
