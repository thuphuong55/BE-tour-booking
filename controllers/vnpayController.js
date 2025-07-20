const moment = require("moment");
const crypto = require("crypto");
const querystring = require("qs");
const config = require("../config/vnpay");
const paymentController = require("./paymentController");
const { Booking } = require("../models");
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
// exports.createPayment = async (req, res) => {
//   const ipAddr = "127.0.0.1";
//   const { bookingId } = req.query;

//   if (!bookingId)
//     return res.status(400).json({ message: "Thiếu bookingId" });

//   const booking = await Booking.findByPk(bookingId);
//   if (!booking)
//     return res.status(404).json({ message: "Không tìm thấy booking" });

//   if (booking.status === "confirmed")
//     return res.status(400).json({ message: "Đơn hàng đã được xác nhận. Không thể thanh toán lại." });

//   if (booking.status === "expired")
//     return res.status(400).json({ message: "Đơn hàng đã hết hạn (do cron job)." });

//   const createdAt = new Date(booking.createdAt);
//   const now = new Date();
//   const minutesDiff = (now - createdAt) / 1000 / 60;

//   if (minutesDiff > 15) {
//     booking.status = "expired";
//     await booking.save();
//     return res.status(400).json({ message: "Đơn hàng đã hết hạn thanh toán." });
//   }
//   const orderInfo = `Thanh toán đơn hàng ${bookingId}`;
//   const orderInfoFormatted = orderInfo.replace(/\s+/g, '+');
//   const createDate = formatDate(new Date())
//   const amount = booking.total_price;
//   const orderId = `${bookingId}_${Math.floor(Math.random() * 1000000)}`;

//   const vnp_Params = {
//     vnp_Version: '2.1.0',
//     vnp_Command: 'pay',
//     vnp_TmnCode: config.tmnCode,
//     vnp_Amount: parseInt(amount) * 100,
//     vnp_CurrCode: 'VND',
//     vnp_TxnRef: orderId.toString(),
//     vnp_OrderInfo: orderInfoFormatted,
//     vnp_OrderType: 'other',
//     vnp_Locale: 'vn',
//     vnp_ReturnUrl: config.vnp_ReturnUrl,
//     vnp_IpAddr: '127.0.0.1',
//     vnp_CreateDate: createDate,
//   };

//   const sortedKeys = Object.keys(vnp_Params).sort();
//   const signData = sortedKeys
//     .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
//     .join('&');

//   const secureHash = createHash(signData, config.vnp_HashSecret);

//   const urlQuery = sortedKeys
//     .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
//     .join('&')
//     .replace(/%20/g, '+');

//   const paymentUrl = `${config.vnp_Url}?${urlQuery}&vnp_SecureHash=${secureHash}`;
//   await paymentController.createPayment({
//     bookingId,
//     amount,
//     method: "VNPay",
//     orderId
//   });
//   console.log("Payment URL:", paymentUrl);
//   res.redirect(paymentUrl);
// };


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
// exports.createPayment = async (req, res) => {
//   const ipAddr = "127.0.0.1";
//   const { bookingId } = req.query;

//   if (!bookingId)
//     return res.status(400).json({ message: "Thiếu bookingId" });

//   const booking = await Booking.findByPk(bookingId);
//   if (!booking)
//     return res.status(404).json({ message: "Không tìm thấy booking" });

//   if (booking.status === "confirmed")
//     return res.status(400).json({ message: "Đơn hàng đã được xác nhận. Không thể thanh toán lại." });

//   if (booking.status === "expired")
//     return res.status(400).json({ message: "Đơn hàng đã hết hạn (do cron job)." });

//   const createdAt = new Date(booking.createdAt);
//   const now = new Date();
//   const minutesDiff = (now - createdAt) / 1000 / 60;

//   if (minutesDiff > 15) {
//     booking.status = "expired";
//     await booking.save();
//     return res.status(400).json({ message: "Đơn hàng đã hết hạn thanh toán." });
//   }
//   const orderInfo = `Thanh toán đơn hàng ${bookingId}`;
//  const orderInfoFormatted = orderInfo.replace(/\s+/g, '+');
//         const createDate = formatDate(new Date())
//   const amount = booking.total_price;
//   const orderId = `${bookingId}_${Math.floor(Math.random() * 1000000)}`;

//         const vnp_Params = {
//             vnp_Version: '2.1.0',
//             vnp_Command: 'pay',
//             vnp_TmnCode: config.tmnCode,
//             vnp_Amount: parseInt(amount) * 100,
//             vnp_CurrCode: 'VND',
//             vnp_TxnRef: orderId.toString(),
//             vnp_OrderInfo: orderInfoFormatted,
//             vnp_OrderType: 'other',
//             vnp_Locale: 'vn',
//             vnp_ReturnUrl: config.vnp_ReturnUrl,
//             vnp_IpAddr: '127.0.0.1',
//             vnp_CreateDate: createDate,
//         };

//         const sortedKeys = Object.keys(vnp_Params).sort();
//         const signData = sortedKeys
//             .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
//             .join('&');

//         const secureHash = createHash(signData, config.vnp_HashSecret);

//         const urlQuery = sortedKeys
//             .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
//             .join('&')
//             .replace(/%20/g, '+');

//         const paymentUrl = `${config.vnp_Url}?${urlQuery}&vnp_SecureHash=${secureHash}`;
//   await paymentController.createPayment({
//     bookingId,
//     amount,
//     method: "VNPay",
//     orderId
//   });
//   console.log("Payment URL:", paymentUrl);
//   res.redirect(paymentUrl);
// };
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

    // Temporarily disable expiry check for testing
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

  await paymentController.createPayment({
    bookingId,
    amount,
    method: "VNPay",
    orderId
  });
    res.json({ paymentUrl });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
};



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

    if (responseCode === "00") {
      await paymentController.updatePaymentStatus(orderId, "completed");
      
      // Lấy bookingId từ orderId (format: bookingId_random)
      const bookingId = orderId.split('_')[0];
      
      // Gửi email xác nhận booking
      try {
        await sendBookingConfirmationEmail(bookingId, "VNPay", orderId);
        console.log(`✅ Booking confirmation email sent for booking: ${bookingId}`);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
        // Không fail payment process nếu email fail
      }
      
      // ✅ FIX: Thêm orderId và bookingId vào URL
      return res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    } else {
      await paymentController.updatePaymentStatus(orderId, "failed");
      
      // Lấy bookingId từ orderId và gửi email thông báo thất bại
      const bookingId = orderId.split('_')[0];
      try {
        await sendPaymentFailedEmail(bookingId, "VNPay", orderId);
        console.log(`📧 Payment failed email sent for booking: ${bookingId}`);
      } catch (emailError) {
        console.error('❌ Failed to send payment failed email:', emailError);
      }
      
      // ✅ FIX: Thêm thông tin lỗi vào URL
      return res.redirect(`http://localhost:3000/payment-failed?orderId=${orderId}&bookingId=${bookingId}&method=VNPay`);
    }
  } catch (err) {
    console.error("Lỗi xử lý vnpayReturn:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
