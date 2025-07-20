const { Payment, Booking, User, Tour, DepartureDate, Promotion } = require('../models');

// Lấy payment theo id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id, { 
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'username']
            },
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'name', 'destination', 'price']
            },
            {
              model: DepartureDate,
              as: 'departureDate',
              attributes: ['id', 'departure_date', 'number_of_days']
            },
            {
              model: Promotion,
              as: 'promotion',
              attributes: ['id', 'code', 'description', 'discount_amount'],
              required: false
            }
          ]
        }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy payment với id này' 
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error getById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy thông tin payment theo id',
      error: error.message 
    });
  }
};

//Lấy thông tin payment và booking theo orderId (MoMo)
exports.getByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    let payment = await Payment.findOne({
      where: { order_id: orderId },
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'username']
            },
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'name', 'destination', 'price']
            },
            {
              model: DepartureDate,
              as: 'departureDate',
              attributes: ['id', 'departure_date', 'number_of_days']
            },
            {
              model: Promotion,
              as: 'promotion',
              attributes: ['id', 'code', 'description', 'discount_amount'],
              required: false
            }
          ]
        }
      ]
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
        success: true,
        data: {
          ...payment,
          booking: null,
          isLegacyMoMo: true // Flag để frontend biết đây là legacy
        }
      });
    }
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy payment với orderId này' 
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error getByOrderId:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi lấy thông tin payment theo orderId',
      error: error.message 
    });
  }
};

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
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'username']
            },
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'name', 'destination', 'price']
            },
            {
              model: DepartureDate,
              as: 'departureDate',
              attributes: ['id', 'departure_date', 'number_of_days']
            },
            {
              model: Promotion,
              as: 'promotion',
              attributes: ['id', 'code', 'description', 'discount_amount'],
              required: false
            }
          ]
        }
      ]
    });
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy payment cho booking này' 
      });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (err) {
    console.error('Error getByBookingId:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server', 
      error: err.message 
    });
  }
};

// Lấy danh sách toàn bộ payment với thông tin user & booking đầy đủ
exports.getAll = async (req, res) => {
  try {
    const payments = await Payment.findAll({ 
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'username']
            },
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'name', 'destination', 'price']
            },
            {
              model: DepartureDate,
              as: 'departureDate',
              attributes: ['id', 'departure_date', 'number_of_days']
            },
            {
              model: Promotion,
              as: 'promotion',
              attributes: ['id', 'code', 'description', 'discount_amount'],
              required: false
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (err) {
    console.error('Error in getAll payments:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server', 
      error: err.message 
    });
  }
};
