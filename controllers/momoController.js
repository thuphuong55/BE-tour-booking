// Endpoint xác nhận thanh toán MoMo cho FE
exports.getTourConfirmation = async (req, res) => {
  try {
    const tourId = req.params.id;
    // Lấy các query param cần thiết
    const { resultCode, orderId } = req.query;
    // FE URL, có thể dùng ngrok hoặc localhost tuỳ môi trường
    // Redirect về FE (Next.js) để FE render trang xác nhận
    const feUrl = `http://localhost:3000/tour/${tourId}/confirmation?resultCode=${resultCode || ''}&orderId=${orderId || ''}`;
    return res.redirect(feUrl);
  } catch (error) {
    console.error('Error getTourConfirmation:', error);
    res.status(500).send('Lỗi xác nhận thanh toán');
  }
};
const { createMomoPayment } = require('../services/momoService');
const paymentController = require('./paymentController'); // để cập nhật trạng thái đơn hàng
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

    // Sử dụng FE Next.js port 3000 cho redirectUrl
    const redirectUrl = `http://localhost:3000/tour/${tour.id}/confirmation`;
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
    console.log('MoMo IPN callback:', { orderId, resultCode });

    // Tìm hoặc tạo payment record với payment_method = 'MoMo'
    let payment = await Payment.findOne({ where: { order_id: orderId } });
    
    if (!payment) {
      console.log('Payment record not found, this might be a legacy MoMo payment');
      // Với old flow không có payment record, chỉ update booking nếu có
      // Tìm booking từ orderId pattern hoặc từ database
    }

    // Nếu thanh toán thành công
    if (resultCode === 0) {
      if (payment) {
        await paymentController.updatePaymentStatus(orderId, 'completed');
        console.log('✅ Updated MoMo payment status to completed');
        
        // Gửi email xác nhận booking
        try {
          await sendBookingConfirmationEmail(payment.booking_id, "MoMo", orderId);
          console.log(`✅ Booking confirmation email sent for booking: ${payment.booking_id}`);
        } catch (emailError) {
          console.error('❌ Failed to send confirmation email:', emailError);
        }
      }
    } else {
      if (payment) {
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
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Lỗi xử lý IPN MoMo:", error);
    res.status(500).send('Fail');
  }
};

exports.handleRedirectCallback = (req, res) => {
    const { resultCode, orderId } = req.query;
    // Extract tourId from orderId or use from query params
    const tourId = req.query.tourId || 'default';
    if (resultCode == 0) {
        res.redirect(`http://localhost:3000/tour/${tourId}/confirmation?orderId=${orderId}&status=success`);
    } else {
        res.redirect(`http://localhost:3000/tour/${tourId}/confirmation?orderId=${orderId}&status=failed`);
    }
};
