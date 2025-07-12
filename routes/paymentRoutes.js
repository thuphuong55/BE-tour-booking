const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const momoController = require("../controllers/momoController");
const vnpayController = require("../controllers/vnpayController");


router.get("/", paymentController.getAll);
router.get("/by-booking/:bookingId", paymentController.getByBookingId);


router.get("/vnpay/create-payment", vnpayController.createPayment);
router.get("/vnpay/return", vnpayController.vnpayReturn);


module.exports = router;
