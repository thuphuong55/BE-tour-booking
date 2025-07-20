// Lấy payment theo id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id, { include: ['booking'] });
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy payment với id này' });
    res.json(payment);
  } catch (error) {
    console.error('Error getById:', error);
    res.status(500).json({ message: 'Lỗi lấy thông tin payment theo id' });
  }
};
//Lấy thông tin payment và booking theo orderId (MoMo)
exports.getByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    let payment = await Payment.findOne({
      where: { order_id: orderId }
    });
    
    // Nếu không tìm thấy payment record nhưng orderId có pattern MoMo
    if (!payment && orderId.startsWith('MOMO')) {
      console.log('Detected MoMo payment without database record (legacy flow)');
      
      // Tạo mock payment object cho MoMo legacy payments
      payment = {
        id: orderId,
        order_id: orderId,
        payment_method: 'MoMo',
        status: 'completed', // Giả sử đã thành công vì đã đến confirmation page
        amount: null, // Không có trong database
        payment_date: new Date(),
        booking_id: null
      };
      
      return res.json({
        ...payment,
        booking: null,
        isLegacyMoMo: true // Flag để frontend biết đây là legacy
      });
    }
    
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy payment với orderId này' });
    }
    
    // Lấy booking riêng để tránh association issues
    let booking = null;
    if (payment.booking_id) {
      try {
        booking = await Booking.findByPk(payment.booking_id);
      } catch (bookingError) {
        console.log('Warning: Could not load booking details:', bookingError.message);
      }
    }
    
    const result = {
      ...payment.toJSON(),
      booking: booking
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error getByOrderId:', error);
    res.status(500).json({ message: 'Lỗi lấy thông tin payment theo orderId' });
  }
};
const { Payment, Booking } = require('../models');

//Dùng khi tạo thanh toán từ bookingController
exports.createPayment = async ({ bookingId, amount, method, orderId }) => {
  console.log('paymentController.createPayment params:', { bookingId, amount, method, orderId });
  return await Payment.create({
    booking_id: bookingId,
    amount,
    payment_method: method, // Bắt buộc phải truyền method
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
