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

exports.createPayment = async (req, res) => {
  try {
    console.log('MoMo createPayment request body:', req.body);
    const { tourId } = req.body;

    const tour = await Tour.findByPk(tourId);
    console.log('Found tour:', tour ? tour.id : 'Not found');
    if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });

    const amount = Number(tour.price);
    console.log('Tour amount:', amount);
    if (!amount || amount < 1000) {
      return res.status(400).json({ message: 'Giá tour không hợp lệ để thanh toán MoMo' });
    }

    // Sử dụng FE Next.js port 3000 cho redirectUrl
    const redirectUrl = `http://localhost:3000/tour/${tour.id}/confirmation`;
    const orderInfo = `Thanh toán tour ${tour.name}`;
    console.log('Calling createMomoPayment with:', { orderInfo, amount, redirectUrl });
    const momoRes = await createMomoPayment(orderInfo, amount, redirectUrl);
    console.log('MoMo response:', momoRes);

    // Chỉ trả về response từ MoMo - payment record sẽ được tạo sau khi callback
    res.json(momoRes);
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({ message: 'Lỗi khi tạo thanh toán', error: error.message });
  }
};

exports.handleIpnCallback = async (req, res) => {
  try {
    const { orderId, resultCode } = req.body;

    // Nếu thanh toán thành công
    if (resultCode === 0) {
      await paymentController.updatePaymentStatus(orderId, 'completed');
    } else {
      await paymentController.updatePaymentStatus(orderId, 'failed');
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
