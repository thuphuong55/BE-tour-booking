const { Payment, Booking } = require('../models');

//Dùng khi tạo thanh toán từ bookingController
exports.createPayment = async ({ bookingId, amount, method, orderId }) => {
  return await Payment.create({
    booking_id: bookingId,
    amount,
    payment_method: method || 'MoMo',
    order_id: orderId || null,
    status: 'pending'
  });
};

//Dùng trong IPN từ MoMo
exports.updatePaymentStatus = async (orderId, newStatus) => {
  const payment = await Payment.findOne({ where: { order_id: orderId } });
  if (!payment) throw new Error('Không tìm thấy thanh toán');

  payment.status = newStatus;
  await payment.save();

  //Nếu thanh toán thành công → cập nhật trạng thái booking
  if (newStatus === 'completed') {
    await Booking.update(
      { status: 'confirmed' },
      { where: { id: payment.booking_id } }
    );
  }
  return payment;
};


//Dùng khi cần hiển thị payment theo booking
exports.getByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const payment = await Payment.findOne({
      where: { booking_id: bookingId },
      include: ['booking']
    });
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// (Tùy chọn) Dùng cho admin xem danh sách toàn bộ payment
exports.getAll = async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: ['booking'] });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};
