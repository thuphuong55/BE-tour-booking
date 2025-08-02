const moment = require("moment");
const crypto = require("crypto");
const querystring = require("qs");
const axios = require("axios");
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
    // Cho phép nhận bookingId từ cả body (POST) và query (GET)
    const bookingId = req.body.booking_id || req.body.bookingId || req.query.bookingId || req.query.booking_id;
    
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

    // console.log("✅ VNPay Payment URL created:", { bookingId, orderId, amount });
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
      .join('&');

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
    const bookingId = orderId.split('_')[0];
console.log(`🔄 VNPay return callback: orderId=${orderId}, responseCode=${responseCode}, bookingId=${bookingId}`);
    if (responseCode === "00") {
      // ✅ THANH TOÁN THÀNH CÔNG
      await paymentController.updatePaymentStatus(orderId, "completed");
      console.log(`✅ Payment completed for booking: ${bookingId}`);

      try {
        const result = await sendBookingConfirmationEmail(bookingId, "VNPay", orderId);
        console.log(`✅ Booking confirmation email sent: ${result}`);
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
        // Vẫn redirect về trang thành công dù email thất bại
      }

      return res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    } else {
      // ❌ THANH TOÁN THẤT BẠI
      await paymentController.updatePaymentStatus(orderId, "failed");
      console.log(`❌ Payment failed for booking: ${bookingId}`);

      try {
        await sendPaymentFailedEmail(bookingId, "VNPay", orderId);
        console.log(`📧 Payment failed email sent for booking: ${bookingId}`);
      } catch (emailError) {
        console.error("❌ Failed to send payment failed email:", emailError);
      }

      return res.redirect(`http://localhost:3000/payment-failed?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    }
  } catch (err) {
    console.error("❌ Lỗi xử lý vnpayReturn:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
// ═══════════════════════════════════════════════════════════════════
// 🎯 ENDPOINT XÁC NHẬN THANH TOÁN CHO FE (LEGACY SUPPORT)
// ═══════════════════════════════════════════════════════════════════
// 🎯 REFUND VNPAY
// ═══════════════════════════════════════════════════════════════════
exports.refundVNPay = async ({ transactionId, amount, orderId, transDate }) => {
  try {
    const moment = require('moment');
    
    console.log('[VNPAY REFUND] Input params:', { transactionId, amount, orderId, transDate });
    
    // Tạo request ID và thời gian refund theo format VNPay
    const vnp_RequestId = moment().format('YYYYMMDDHHmmss');
    const vnp_CreateDate = moment().format('YYYYMMDDHHmmss');
    
    // NOTE: VNPay sandbox có thể yêu cầu transaction phải có transaction number thật
    // Thử dùng orderId làm vnp_TransactionNo thay vì để trống
    
    // Tạo refund data theo spec VNPay chính xác
    const refundData = {
      vnp_RequestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_TransactionType: '02', // 02 = Hoàn tiền toàn phần
      vnp_TxnRef: orderId, // Mã giao dịch gốc
      vnp_Amount: amount * 100, // Chuyển VND sang xu
      vnp_OrderInfo: `Refund cho don hang ${orderId}`,
      vnp_TransactionNo: '', // Để trống để VNPay tự tìm
      vnp_TransactionDate: transDate,
      vnp_CreateDate,
      vnp_CreateBy: 'admin',
      vnp_IpAddr: '127.0.0.1'
    };

    // Sắp xếp theo alphabet để tạo signature
    const sortedData = sortObject(refundData);
    const signData = querystring.stringify(sortedData, { encode: false });
    const vnp_SecureHash = createHash(signData, config.vnp_HashSecret);

    console.log('[VNPAY REFUND] Sign data:', signData);
    console.log('[VNPAY REFUND] Hash:', vnp_SecureHash);
    
    // Request payload cuối cùng
    const requestData = querystring.stringify({
      ...sortedData,
      vnp_SecureHash
    });

    console.log('[VNPAY REFUND] Request payload:', requestData);

    // Gọi VNPay API
    const response = await axios({
      method: 'POST',
      url: config.vnp_ApiUrl,
      data: requestData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 60000
    });

    console.log('[VNPAY REFUND] Response status:', response.status);
    console.log('[VNPAY REFUND] Response headers:', response.headers);
    console.log('[VNPAY REFUND] Response data raw:', response.data);
    console.log('[VNPAY REFUND] Response data type:', typeof response.data);

    // Parse response từ VNPay
    let responseData = response.data;
    
    // VNPay có thể trả về query string hoặc JSON
    if (typeof responseData === 'string' && responseData.includes('=')) {
      console.log('[VNPAY REFUND] Parsing query string response...');
      responseData = querystring.parse(responseData);
      console.log('[VNPAY REFUND] Parsed response:', responseData);
    }

    const success = responseData.vnp_ResponseCode === '00';
    
    return {
      success,
      message: responseData.vnp_Message || (success ? 'Hoàn tiền thành công' : 'Hoàn tiền thất bại'),
      responseCode: responseData.vnp_ResponseCode,
      transactionStatus: responseData.vnp_TransactionStatus,
      requestId: vnp_RequestId,
      rawResponse: responseData
    };

  } catch (error) {
    console.error('[VNPAY REFUND] Error:', error.message);
    if (error.response) {
      console.error('[VNPAY REFUND] Error status:', error.response.status);
      console.error('[VNPAY REFUND] Error data:', error.response.data);
    }
    
    return {
      success: false,
      message: error.response?.data?.Message || error.message || 'Lỗi khi gọi VNPay refund API',
      error: error.response?.data || error.message,
      requestId: vnp_RequestId || 'unknown'
    };
  }
};

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
