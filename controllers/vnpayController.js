const moment = require("moment");
const crypto = require("crypto");
const querystring = require("qs");
const config = require("../config/vnpay");
const paymentController = require("./paymentController");
const { Booking } = require("../models");

exports.createPayment = async (req, res) => {
  const ipAddr = "127.0.0.1";
  const { bookingId } = req.query;

  if (!bookingId)
    return res.status(400).json({ message: "Thiếu bookingId" });

  const booking = await Booking.findByPk(bookingId);
  if (!booking)
    return res.status(404).json({ message: "Không tìm thấy booking" });

  if (booking.status === "confirmed")
    return res.status(400).json({ message: "Đơn hàng đã được xác nhận. Không thể thanh toán lại." });

  if (booking.status === "expired")
    return res.status(400).json({ message: "Đơn hàng đã hết hạn (do cron job)." });

  const createdAt = new Date(booking.createdAt);
  const now = new Date();
  const minutesDiff = (now - createdAt) / 1000 / 60;

  if (minutesDiff > 15) {
    booking.status = "expired";
    await booking.save();
    return res.status(400).json({ message: "Đơn hàng đã hết hạn thanh toán." });
  }

  const amount = booking.total_price;
  const orderId = `${bookingId}_${Math.floor(Math.random() * 1000000)}`;
  const createDate = moment().format("YYYYMMDDHHmmss");

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toán đơn hàng ${bookingId}`,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };

  const sorted = Object.fromEntries(Object.entries(vnp_Params).sort());
  const signData = Object.entries(sorted)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  sorted.vnp_SecureHash = signed;

  const paymentUrl = config.vnp_Url + "?" + 
    Object.entries(sorted)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

  // Ghi lại payment (pending)
  await paymentController.createPayment({
    bookingId,
    amount,
    method: "VNPay",
    orderId
  });

  res.redirect(paymentUrl);
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
