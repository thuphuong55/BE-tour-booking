const moment = require("moment");
const crypto = require("crypto");
const querystring = require("qs");
const config = require("../config/vnpay");
const paymentController = require("./paymentController");
const { Booking } = require("../models");
function createHash(data, secret) {
    return createHmac('sha512', secret)
        .update(Buffer.from(data, 'utf-8'))
        .digest('hex');
}
const { createHmac } = require('crypto');
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
        if (!config.tmnCode || !config.vnp_HashSecret) {
            return res.status(500).json({ error: 'Cấu hình VNPay bị thiếu' });
        }

        if (!req.body.orderInfo || !req.body.amount || !req.body.orderId) {
            return res.status(400).json({ error: 'Thiếu thông tin thanh toán' });
        }

        const { orderInfo, amount, orderId } = req.body;
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
            vnp_ReturnUrl: 'http://10.0.2.2:5000/api/vnpay/payment-result',
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

        const paymentUrl = `${config.vnpayHost}?${urlQuery}&vnp_SecureHash=${secureHash}`;

        res.json({ paymentUrl });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
    }
}
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
      return res.redirect("/payment-success");
    } else {
      await paymentController.updatePaymentStatus(orderId, "failed");
      return res.redirect("/payment-failed");
    }
  } catch (err) {
    console.error("Lỗi xử lý vnpayReturn:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
