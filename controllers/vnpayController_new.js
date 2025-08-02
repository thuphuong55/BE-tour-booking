const moment = require("moment");
const crypto = require("crypto");
const querystring = require("qs");
const config = require("../config/vnpay");
const paymentController = require("./paymentController");
const { Booking, Payment } = require("../models");
const { sendBookingConfirmationEmail, sendPaymentFailedEmail } = require("../services/emailNotificationService");

function createHash(data, secret) {
  return crypto.createHmac('sha512', secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');
}

function formatDate(date) {
  return date.toISOString()
    .replace(/T/, '')
    .replace(/[-:]/g, '')
    .replace(/\..+/, '');
}

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 TẠO PAYMENT URL CHO BOOKING (CHÍNH THỨC)
// ═══════════════════════════════════════════════════════════════════
exports.createPayment = async (req, res) => {
  try {
    const { bookingId } = req.query;
    
    if (!bookingId)
      return res.status(400).json({ message: "Thiếu bookingId" });

    const booking = await Booking.findByPk(bookingId, {
      attributes: ['id', 'user_id', 'tour_id', 'total_price', 'booking_date', 'status', 'created_at', 'updated_at']
    });
    
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy booking" });

    if (booking.status === "confirmed")
      return res.status(400).json({ message: "Đơn hàng đã được xác nhận. Không thể thanh toán lại." });

    if (booking.status === "expired")
      return res.status(400).json({ message: "Đơn hàng đã hết hạn (do cron job)." });

    const createdAt = new Date(booking.created_at);
    const now = new Date();
    const minutesDiff = (now - createdAt) / 1000 / 60;

    // Tạm thời disable expiry check để test
    // if (minutesDiff > 15) {
    //   booking.status = "expired";
    //   await booking.save();
    //   return res.status(400).json({ message: "Đơn hàng đã hết hạn thanh toán." });
    // }

    const orderInfo = `Thanh toán đơn hàng ${bookingId}`;
    const amount = booking.total_price;
    const orderId = `${bookingId}_${Math.floor(Math.random() * 1000000)}`;

    const orderInfoFormatted = orderInfo.replace(/\s+/g, '+');
    const createDate = formatDate(new Date());

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_Amount: parseInt(amount) * 100,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: orderInfoFormatted,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: config.vnp_ReturnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedKeys = Object.keys(vnp_Params).sort();
    const signData = sortedKeys
      .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&');

    const secureHash = createHash(signData, config.vnp_HashSecret);

    const urlQuery = sortedKeys
      .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&')
      .replace(/%20/g, '+');

    const paymentUrl = `${config.vnp_Url}?${urlQuery}&vnp_SecureHash=${secureHash}`;

    // Tạo payment record
    await paymentController.createPayment({
      bookingId,
      amount,
      method: "VNPay",
      orderId
    });

    console.log("✅ VNPay Payment URL created:", { bookingId, orderId, amount });
    res.json({ paymentUrl });

  } catch (error) {
    console.error('❌ VNPay createPayment error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🎯 XỬ LÝ CALLBACK TỪ VNPAY (CHÍNH THỨC)
// ═══════════════════════════════════════════════════════════════════
exports.vnpayReturn = async (req, res) => {
    console.log('🔄 VNPay return callback:', req.query);
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = Object.fromEntries(
      Object.entries(vnp_Params).sort()
    );

    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("========== DEBUG VNPay Signature ==========");
    console.log("SIGN DATA:\n", signData);
    console.log("SIGNED (local):\n", signed);
    console.log("SECURE HASH (from VNPay):\n", secureHash);
    console.log("===========================================");

    if (secureHash !== signed) {
      return res.status(400).json({ message: "Sai chữ ký VNPay" });
    }

    const orderId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const bookingId = orderId.split("_")[0];

    const [payment, booking] = await Promise.all([
      Payment.findOne({ where: { order_id: orderId } }),
      Booking.findByPk(bookingId),
    ]);

    // Nếu đã thanh toán xong hoặc đã xác nhận booking
    if (
      (payment && payment.status === "completed") ||
      (booking && booking.status === "confirmed")
    ) {
      return res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    }
    else {
if (!payment || !booking) {
      const redirectUrl = responseCode === "00"
        ? "payment-success"
        : "payment-failed";
      return res.redirect(`http://localhost:3000/${redirectUrl}?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    }

    if (responseCode === "00") {
      // ✅ THÀNH CÔNG
      await paymentController.updatePaymentStatus(orderId, "completed");

      // --- Cập nhật booking_summary ---
      try {
        const { sequelize } = require('../models');
        const { tour_id: tourId, departure_date_id: departureDateId, number_of_adults, number_of_children } = booking;
        const numGuests = (number_of_adults || 0) + (number_of_children || 0);

        const [[existing]] = await sequelize.query(
          `SELECT total_booked FROM booking_summary WHERE tour_id = ? AND departure_date_id = ? LIMIT 1`,
          {
            replacements: [tourId, departureDateId],
            type: sequelize.QueryTypes.SELECT,
          }
        );

        if (existing) {
          await sequelize.query(
            `UPDATE booking_summary SET total_booked = total_booked + ?, last_updated = NOW() WHERE tour_id = ? AND departure_date_id = ?`,
            { replacements: [numGuests, tourId, departureDateId] }
          );
        } else {
          await sequelize.query(
            `INSERT INTO booking_summary (tour_id, departure_date_id, total_booked, last_updated) VALUES (?, ?, ?, NOW())`,
            { replacements: [tourId, departureDateId, numGuests] }
          );
        }
      } catch (err) {
        console.error("❌ Lỗi cập nhật booking_summary:", err);
      }

      try {
        await sendBookingConfirmationEmail(bookingId, "VNPay", orderId);
        console.log(`✅ Email xác nhận gửi thành công cho booking: ${bookingId}`);
      } catch (emailErr) {
        console.error("❌ Gửi email xác nhận thất bại:", emailErr);
      }

      return res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    } else {
      // ❌ THANH TOÁN THẤT BẠI
      await paymentController.updatePaymentStatus(orderId, "failed");

      try {
        await sendPaymentFailedEmail(bookingId, "VNPay", orderId);
        console.log(`📧 Email thất bại gửi thành công cho booking: ${bookingId}`);
      } catch (emailErr) {
        console.error("❌ Gửi email thất bại thất bại:", emailErr);
      }

      return res.redirect(`http://localhost:3000/payment-failed?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    }
    }

    // Nếu không tìm thấy payment hoặc booking
    
  } catch (err) {
    console.error("❌ Lỗi xử lý vnpayReturn:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🎯 ENDPOINT XÁC NHẬN THANH TOÁN CHO FE (LEGACY SUPPORT)
// ═══════════════════════════════════════════════════════════════════
exports.getTourConfirmation = async (req, res) => {
  try {
    const tourId = req.params.id;
    const { resultCode, orderId } = req.query;
    
    const feUrl = `http://localhost:3000/tour/${tourId}/confirmation?resultCode=${resultCode || ''}&orderId=${orderId || ''}`;
    return res.redirect(feUrl);
  } catch (error) {
    console.error('Error getTourConfirmation:', error);
    res.status(500).send('Lỗi xác nhận thanh toán');
  }
};
