const { createMomoPayment } = require('../services/momoService');
const paymentController = require('./paymentController'); // để cập nhật trạng thái đơn hàng
const { Tour , Payment} = require('../models');


exports.createPayment = async (req, res) => {
  try {
    const { tourId } = req.body;

    const tour = await Tour.findByPk(tourId);
    if (!tour) return res.status(404).json({ message: 'Không tìm thấy tour' });

    const amount = Number(tour.price);
    if (!amount || amount < 1000) {
      return res.status(400).json({ message: 'Giá tour không hợp lệ để thanh toán MoMo' });
    }

    const momoRes = await createMomoPayment(
      `Thanh toán tour ${tour.title}`,
      amount
    );

    res.json(momoRes);
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({ message: 'Lỗi khi tạo thanh toán' });
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
    const { resultCode } = req.query;
    if (resultCode == 0) {
        res.send('Thanh toán thành công!');
    } else {
        res.send('Thanh toán thất bại!');
    }
};
