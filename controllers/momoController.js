const axios = require("axios");
const crypto = require("crypto");
const momoConfig = require("../config/env"); 

exports.getTourConfirmation = async (req, res) => {
  try {
    const tourId = req.params.id;
    // Lấy các query param cần thiết
    const { resultCode, orderId } = req.query;
    const feUrl = `http://localhost:3000/tour/${tourId}/confirmation?resultCode=${resultCode || ''}&orderId=${orderId || ''}`;
    return res.redirect(feUrl);
  } catch (error) {
    console.error('Error getTourConfirmation:', error);
    res.status(500).send('Lỗi xác nhận thanh toán');
  }
};

const { createMomoPayment } = require('../services/momoService');
const paymentController = require('./paymentController'); 
const { Tour, Payment, Booking } = require('../models');
const { sendBookingConfirmationEmail, sendPaymentFailedEmail } = require('../services/emailNotificationService');

exports.createPayment = async (req, res) => {
  try {
    console.log('MoMo createPayment request body:', req.body);
    const { tourId, bookingId } = req.body;

    // Nếu có bookingId, lấy thông tin từ booking
    let tour, amount, orderInfo;
    if (bookingId) {
      const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Tour, as: 'tour' }]
      });
      if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });
      
      tour = booking.tour;
      amount = Number(booking.total_price);
      orderInfo = `Thanh toán booking ${booking.id} - ${tour.name}`;
    } else {
      // Legacy: tạo từ tour trực tiếp
      tour = await Tour.findByPk(tourId);
      if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });
      
      amount = Number(tour.price);
      orderInfo = `Thanh toán tour ${tour.name}`;
    }

    console.log('Found tour:', tour ? tour.id : 'Not found');
    console.log('Tour amount:', amount);
    if (!amount || amount < 1000) {
      return res.status(400).json({ message: 'Giá tour không hợp lệ để thanh toán MoMo' });
    }

    // Sử dụng endpoint BE để xử lý redirect callback từ MoMo
    const redirectUrl = `http://localhost:5000/api/payments/momo/redirect-callback?tourId=${tour.id}`;
    console.log('Calling createMomoPayment with:', { orderInfo, amount, redirectUrl });
    const momoRes = await createMomoPayment(orderInfo, amount, redirectUrl);
    console.log('MoMo response:', momoRes);

    // TẠO PAYMENT RECORD TRONG DATABASE với payment_method = 'MoMo'
    if (momoRes.resultCode === 0 && bookingId) {
      try {
        await paymentController.createPayment({
          bookingId: bookingId,
          amount: amount,
          method: 'MoMo',
          orderId: momoRes.orderId
        });
        console.log('✅ Created MoMo payment record in database');
      } catch (paymentError) {
        console.error('❌ Error creating payment record:', paymentError);
      }
    }

    res.json(momoRes);
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({ message: 'Lỗi khi tạo thanh toán', error: error.message });
  }
};


exports.handleIpnCallback = async (req, res) => {
  try {
    const { orderId, resultCode } = req.body;
    console.log('🔄 MoMo IPN callback:', { orderId, resultCode });

    // Tìm payment record với payment_method = 'MoMo'
    let payment = await Payment.findOne({ where: { order_id: orderId } });
    
    if (!payment) {
      console.log('❌ Payment record not found for orderId:', orderId);
      return res.status(404).send('Payment not found');
    }

    // Nếu thanh toán thành công
    if (resultCode === 0) {
      await paymentController.updatePaymentStatus(orderId, 'completed');
      console.log('✅ Updated MoMo payment status to completed');
      
      // Gửi email xác nhận booking
      try {
        await sendBookingConfirmationEmail(payment.booking_id, "MoMo", orderId);
        console.log(`✅ Booking confirmation email sent for booking: ${payment.booking_id}`);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
      }
    } else {
      await paymentController.updatePaymentStatus(orderId, 'failed');
      console.log('❌ Updated MoMo payment status to failed');
      
      // Gửi email thông báo thất bại
      try {
        await sendPaymentFailedEmail(payment.booking_id, "MoMo", orderId);
        console.log(`📧 Payment failed email sent for booking: ${payment.booking_id}`);
      } catch (emailError) {
        console.error('❌ Failed to send payment failed email:', emailError);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("❌ Lỗi xử lý IPN MoMo:", error);
    res.status(500).send('Fail');
  }
};

exports.handleRedirectCallback = (req, res) => {
    const { resultCode, orderId } = req.query;
    console.log('🔄 MoMo redirect callback:', { resultCode, orderId });
    const tourId = req.query.tourId || 'default';
    const { Payment, Booking } = require('../models');
    const { sendBookingConfirmationEmail, sendPaymentFailedEmail } = require('../services/emailNotificationService');
    const { updateBookingSummary } = require('../utils/bookingSummary');
    (async () => {
      try {
        const payment = await Payment.findOne({ where: { order_id: orderId } });
        // console.log(`🔄 MoMo redirect callback: orderId=${orderId}, resultCode=${payment.booking_id}, payment=${payment ? payment.status : 'not found'}`);
        if (resultCode == 0) {
          // Nếu payment chưa completed thì cập nhật trạng thái và booking_summary
          if (payment && payment.status !== 'completed') {
            payment.status = 'completed';
            await payment.save();
              
           const booking = await Booking.findOne({ where: { id: payment.booking_id } })
            if (booking && booking.status !== 'confirmed') {
              booking.status = 'confirmed';
              await booking.save();
              console.log(`🔄 Updating booking status for booking_id=${booking.id} and ${booking.status}`);
             await updateBookingSummary(booking.id);
            }
            try {
              await sendBookingConfirmationEmail(payment.booking_id, "MoMo", orderId);
            } catch (e) { /* ignore */ }
          }
          
          res.redirect(`http://localhost:3000/payment-success?orderId=${orderId}&method=MoMo`);
        } else {
          // Nếu payment chưa failed thì cập nhật trạng thái
          if (payment && payment.status !== 'failed') {
            payment.status = 'failed';
            await payment.save();
            const booking = await Booking.findByPk(payment.booking_id);
            if (booking && booking.status !== 'failed') {
              booking.status = 'failed';
              await booking.save();
            }
            try {
              await sendPaymentFailedEmail(payment.booking_id, "MoMo", orderId);
            } catch (e) { /* ignore */ }
          }
           res.redirect(`http://localhost:3000/payment-failed?orderId=${orderId}&method=MoMo`);
        }
      } catch (err) {
        console.error("❌ Lỗi xử lý redirect MoMo:", err);
        return res.status(500).json({ message: "Lỗi server", error: err.message });
      }
    })();
   
};

exports.refundMomo = async ({ orderId, transId, amount }) => {
  try {
    const requestId = `${orderId}_${Date.now()}`;
    const requestType = "refundMoMoWallet";
    const { accessKey, secretKey, partnerCode, refundEndpoint } = momoConfig;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}&requestType=${requestType}&transId=${transId}`;
    const signature = crypto.createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const payload = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      transId,
      requestType,
      signature,
      lang: "vi"
    };

    const response = await axios.post(refundEndpoint, payload, {
      headers: { "Content-Type": "application/json" }
    });

    if (response.data.resultCode === 0) {
      return { success: true };
    } else {
      return {
        success: false,
        message: response.data.message || "MoMo từ chối hoàn tiền"
      };
    }
  } catch (err) {
    console.error("❌ Lỗi refund MoMo:", err);
    return {
      success: false,
      message: err.message
    };
  }
};  
