
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const momoController = require("../controllers/momoController");
const vnpayController = require("../controllers/vnpayController");
const { refundVNPay } = require("../controllers/vnpayController");
const { refundMomo } = require("../controllers/momoController");
const { Refund, Booking, Payment } = require("../models");
const { protect } = require("../middlewares/auth");

// Lấy danh sách các bản ghi hoàn tiền
router.get("/refund", protect(["admin", "agency", "user"]), async (req, res) => {
  try {
    // Có thể lọc theo booking_id, user_id, orderId nếu cần
    const { booking_id, user_id, orderId } = req.query;
    const where = {};
    if (booking_id) where.booking_id = booking_id;
    if (user_id) where.user_id = user_id;
    if (orderId) {
      // Tìm payment trước để lấy booking_id
      const payment = await Payment.findOne({ where: { order_id: orderId } });
      if (payment) where.booking_id = payment.booking_id;
    }
    const refunds = await Refund.findAll({ where, order: [["created_at", "DESC"]] });
    res.json({ refunds });
  } catch (err) {
    console.error("Lỗi lấy danh sách hoàn tiền:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách các bản ghi hoàn tiền MoMo
router.get("/momo/refund", protect(["admin", "agency", "user"]), async (req, res) => {
  try {
    // Có thể lọc theo booking_id, user_id, orderId nếu cần
    const { booking_id, user_id, orderId } = req.query;
    const where = {};
    if (booking_id) where.booking_id = booking_id;
    if (user_id) where.user_id = user_id;
    if (orderId) {
      // Tìm payment trước để lấy booking_id
      const payment = await Payment.findOne({ where: { order_id: orderId } });
      if (payment) where.booking_id = payment.booking_id;
    }
    const refunds = await Refund.findAll({ where, order: [["created_at", "DESC"]] });
    res.json({ refunds });
  } catch (err) {
    console.error("Lỗi lấy danh sách hoàn tiền MoMo:", err);
    res.status(500).json({ error: err.message });
  }
});

//hoan tien momo
router.post("/momo/refund", protect(["admin", "agency"]), async (req, res) => {
  try {
    const { orderId, transId, amount, reason = "Hoàn tiền MoMo thủ công" } = req.body;

    if (!orderId || !transId || !amount) {
      return res.status(400).json({ error: "Thiếu thông tin orderId, transId hoặc amount." });
    }

    const result = await refundMomo({ orderId, transId, amount });

    if (result.success) {
      return res.json({
        message: "✅ Hoàn tiền MoMo thành công.",
        refundAmount: amount,
        orderId,
        transId
      });
    } else {
      return res.status(400).json({
        message: "❌ Hoàn tiền MoMo thất bại.",
        error: result.message
      });
    }
  } catch (err) {
    console.error("Refund MoMo error:", err);
    return res.status(500).json({ error: err.message });
  }
});


// Payment details routes
router.get('/details/:orderId', paymentController.getByOrderId);
router.get('/by-order/:orderId', paymentController.getByOrderId);
router.get('/:id', paymentController.getById);
router.get("/", paymentController.getAll);
router.get("/by-booking/:bookingId", paymentController.getByBookingId);


// router.get("/vnpay/create-payment", vnpayController.createPayment); // Query param: bookingId
router.post("/vnpay/create-payment", vnpayController.createPayment); // Query param: bookingId (hỗ trợ POST)
router.get("/vnpay/return", vnpayController.vnpayReturn);
router.get("/tour/:id/confirmation", vnpayController.getTourConfirmation); // Legacy support
router.post("/refund", protect(["admin", "agency", "user"]), async (req, res) => {
  try {
    const { amount, orderId, transDate, reason = "Hoàn tiền thủ công" } = req.body;

    console.log('[REFUND API] Request body:', req.body);

    if (!amount || !orderId) {
      return res.status(400).json({ error: "Thiếu thông tin yêu cầu: amount, orderId" });
    }

    // Tìm payment trước để đảm bảo có booking_id
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    console.log('[REFUND API] Tìm payment với orderId:', orderId, '- Kết quả:', payment);
    
    if (!payment) {
      return res.status(404).json({ error: `Không tìm thấy payment với orderId: ${orderId}` });
    }

    if (!payment.booking_id) {
      return res.status(400).json({ error: `Payment với orderId ${orderId} không có booking_id` });
    }

    // Gọi API hoàn tiền VNPay hoặc mock cho sandbox
    let result;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Gọi VNPay API thật - dùng orderId làm transactionId
      result = await refundVNPay({
        transactionId: orderId, // Dùng orderId làm transactionId
        amount,
        orderId,
        transDate: transDate || new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14),
      });
    } else {
      // Development/Sandbox: Mock successful refund
      console.log('[REFUND API] Mock refund for development/sandbox environment');
      result = {
        success: true,
        message: 'Hoàn tiền thành công (mock for development)',
        responseCode: '00',
        transactionStatus: '00',
        requestId: `mock_${Date.now()}`
      };
      
      // Vẫn log payload để debug
      console.log('[REFUND API] Mock refund payload:', {
        transactionId: orderId, amount, orderId, transDate
      });
    }

    console.log('[REFUND API] Kết quả VNPay refund:', result);

    const bookingId = payment.booking_id;
    const userId = req.user.id;
    const now = new Date();

    // Tạo bản ghi Refund
    await Refund.create({
      booking_id: bookingId,
      user_id: userId,
      amount,
      status: result.success ? "completed" : "manual_required",
      reason: result.success ? reason : `${reason} | Lỗi: ${result.message}`,
      created_at: now,
    });

    // Trả kết quả
    res.json({
      message: result.success ? "Hoàn tiền thành công qua VNPay." : "Hoàn tiền thất bại. Vui lòng xử lý thủ công.",
      refundStatus: result.success ? "completed" : "manual_required",
      refundAmount: amount,
      orderId,
      bookingId,
      errorMessage: result.success ? null : result.message,
    });
  } catch (err) {
    console.error("Lỗi hoàn tiền:", err);
    res.status(500).json({ error: err.message });
  }
});

// MoMo
router.post("/momo/create-payment", momoController.createPayment); // Body: { bookingId } hoặc { tourId }
router.post("/momo/ipn", momoController.handleIpnCallback);
router.get("/momo/return", momoController.handleRedirectCallback);
router.get("/tour/:id/confirmation", momoController.getTourConfirmation); // Legacy support
router.get("/momo/redirect-callback", momoController.handleRedirectCallback);
module.exports = router;
