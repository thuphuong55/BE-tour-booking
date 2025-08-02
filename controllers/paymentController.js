const { Payment, Booking, User, Tour, DepartureDate, Promotion, InformationBookingTour, Agency } = require('../models');

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
              attributes: ['id', 'name', 'destination', 'price', 'agency_id'],
              include: [
                {
                  model: Agency,
                  as: 'agency',
                  attributes: ['id', 'name']
                }
              ]
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
            },
            {
              model: InformationBookingTour,
              as: 'guests',
              attributes: ['id', 'name', 'email', 'phone', 'cccd']
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
              attributes: ['id', 'name', 'destination', 'price', 'agency_id'],
              include: [
                {
                  model: Agency,
                  as: 'agency',
                  attributes: ['id', 'name']
                }
              ]
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
            },
            {
              model: InformationBookingTour,
              as: 'guests',
              attributes: ['id', 'name', 'email', 'phone', 'cccd']
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
const { updateBookingSummary } = require('../utils/bookingSummary');
exports.updatePaymentStatus = async (orderId, newStatus) => {
  const payment = await Payment.findOne({ where: { order_id: orderId } });
  if (!payment) throw new Error('Không tìm thấy thanh toán');
  console.log(`Updating payment status for orderId ${orderId} to ${newStatus}`);
  payment.status = newStatus;
  await payment.save();
console.log(`✅ Payment status updated: ${payment.status} and newStatus=${newStatus}`);
  //Nếu thanh toán thành công → cập nhật trạng thái booking và booking_summary
  if (newStatus === 'completed') {
  const affectedRows = await Booking.update(
  { status: 'confirmed' },
  { where: { id: payment.booking_id } }
);
console.log(`✅ Booking status updated to confirmed for booking_id=${affectedRows}`);
  console.log(`✅ Booking status updated to confirmed for booking_id=${payment.booking_id}`);

    if (affectedRows) {
      // Cập nhật booking_summary
      await updateBookingSummary(payment.booking_id);
    } else {
      // Nếu không lấy được booking từ update, thử lấy lại từ DB
      const bookingInstance = await Booking.findByPk(payment.booking_id);
      if (bookingInstance) {
        await updateBookingSummary(bookingInstance);
      }
    }
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
            },
            {
              model: InformationBookingTour,
              as: 'guests',
              attributes: ['id', 'name', 'email', 'phone', 'cccd']
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
            },
            {
              model: InformationBookingTour,
              as: 'guests',
              attributes: ['id', 'name', 'email', 'phone', 'cccd']
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
