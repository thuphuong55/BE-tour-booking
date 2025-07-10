const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const momoController = require("../controllers/momoController");

router.get("/", paymentController.getAll);
router.get("/by-booking/:bookingId", paymentController.getByBookingId);

module.exports = router;
