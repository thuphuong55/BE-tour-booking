const { Booking, Tour, DepartureDate, InformationBookingTour, User, Promotion, Payment, sequelize } = require("../models");
const generateCrudController = require("./generateCrudController");
const tourController = require("./tourController");
const { Op } = require("sequelize");
const { sendEmail, sendBookingEmail } = require("../config/mailer");

// ID của guest user cố định
const GUEST_USER_ID = "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";

// ─────────────────────────────────────────────
//  Hàm CREATE Booking - YÊU CẦU THANH TOÁN NGAY
// ─────────────────────────────────────────────
const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // 🔍 DEBUG: Log essential booking info only
    console.log('📋 Booking Request:', {
      tour_id: req.body.tour_id,
      user_type: req.body.user_type || (req.user ? 'REGISTERED' : 'GUEST'),
      payment_method: req.body.payment_method,
      total_price: req.body.total_price
    });
    
    const {
      // user_id được loại bỏ - sẽ auto-detect từ authentication
      tour_id,
      departure_date_id,
      promotion_id = null,
      total_price,
      number_of_adults,
      number_of_children,
      payment_method, // 🆕 BẮT BUỘC: "vnpay" hoặc "momo"
      guests = []
    } = req.body;

    // ✅ KIỂM TRA BẮT BUỘC: Phải có payment_method
    if (!payment_method || !['vnpay', 'momo'].includes(payment_method.toLowerCase())) {
      await t.rollback();
      return res.status(400).json({ 
        message: "Vui lòng chọn phương thức thanh toán (VNPay hoặc MoMo) để hoàn tất đặt tour.",
        error: "PAYMENT_METHOD_REQUIRED",
        available_methods: ["vnpay", "momo"]
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔍 AUTO-DETECT: User đăng nhập hay Guest vãng lai
    // ═══════════════════════════════════════════════════════════════════
    let finalUserId;
    let bookingType;

    if (req.user && req.user.id) {
      // ✅ User đã đăng nhập (có token)
      finalUserId = req.user.id;
      bookingType = "AUTHENTICATED_USER";
      console.log("👤 Authenticated user booking:", {
        userId: req.user.id,
        userName: req.user.name || req.user.username,
        email: req.user.email
      });
    } else {
      // 🎫 Guest vãng lai (không có token)
      finalUserId = GUEST_USER_ID;
      bookingType = "GUEST_USER";
      console.log("🎫 Guest booking detected - using Guest User ID:", GUEST_USER_ID);
    }

    // 🛡️ SAFETY CHECK: Đảm bảo finalUserId không bao giờ null
    if (!finalUserId) {
      console.error("🚨 CRITICAL ERROR: finalUserId is null/undefined");
      await t.rollback();
      return res.status(500).json({ 
        message: "Lỗi hệ thống: không xác định được user ID",
        error: "USER_ID_NULL",
        debug: {
          hasUser: !!req.user,
          userId: req.user?.id,
          guestUserId: GUEST_USER_ID
        }
      });
    }

    /* ────────── 0. Kiểm tra guest & email người đại diện ────────── */
    if (!Array.isArray(guests) || guests.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Phải nhập ít nhất 1 khách (người đại diện)." });
    }

    const representative = guests[0];
    if (!representative.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representative.email)) {
      await t.rollback();
      return res.status(400).json({ message: "Người đại diện phải có email hợp lệ." });
    }

    /* ────────── 1. Kiểm tra ngày khởi hành ────────── */
    const departure = await DepartureDate.findByPk(departure_date_id);
    if (!departure) {
      await t.rollback();
      return res.status(400).json({ message: "Không tìm thấy ngày khởi hành." });
    }
    if (departure.tour_id !== tour_id) {
      await t.rollback();
      return res.status(400).json({ message: "Ngày khởi hành không thuộc tour đã chọn." });
    }
    
    // Lấy thông tin tour để có giá gốc
    const tour = await Tour.findByPk(tour_id);
    if (!tour) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy tour." });
    }

    // Kiểm tra promotion chỉ áp dụng cho tour thuộc agency
    if (promotion_id) {
      const promotion = await Promotion.findByPk(promotion_id);
      if (!promotion) {
        await t.rollback();
        return res.status(400).json({ message: "Mã giảm giá không tồn tại." });
      }
      if (promotion.agency_id !== tour.agency_id) {
        await t.rollback();
        return res.status(400).json({ message: "Mã giảm giá không áp dụng cho tour này." });
      }
    }
    
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    if (new Date(departure.departure_date) < minDate) {
      await t.rollback();
      return res.status(400).json({ message: "Ngày khởi hành phải cách hiện tại ít nhất 3 ngày." });
    }

    /* ────────── 2. Tạo booking với User ID phù hợp ────────── */
    // Tính discount amount nếu có promotion
    const original_price = tour.price * (number_of_adults + number_of_children);
    const discount_amount = original_price - total_price;

    // ═══════════════════════════════════════════════════════════════════
    // 🆕 TẠO BOOKING "PENDING" TRƯỚC KHI THANH TOÁN
    // ═══════════════════════════════════════════════════════════════════
    
    // Tạo booking với status "pending" để track user behavior
    const booking = await Booking.create({
      user_id: finalUserId,
      tour_id,
      departure_date_id,
      promotion_id,
      original_price,
      discount_amount,
      total_price,
      number_of_adults,
      number_of_children,
      status: 'pending', // 🔄 Pending cho đến khi thanh toán
      payment_method: payment_method
    }, { transaction: t });

    // Tạo guests
    const guestRecords = guests.map(g => ({ ...g, booking_id: booking.id }));
    await InformationBookingTour.bulkCreate(guestRecords, { transaction: t });

    await t.commit(); // ✅ Commit booking "pending"

    console.log(`📋 Pending booking created:`, {
      bookingId: booking.id,
      type: bookingType,
      userId: finalUserId,
      paymentMethod: payment_method,
      status: 'pending'
    });

    // 📦 Tạo data package để gửi đến payment gateway
    const bookingData = {
      booking_id: booking.id, // 🆕 Thêm booking ID
      user_id: finalUserId,
      tour_id,
      departure_date_id,
      promotion_id,
      original_price,
      discount_amount,
      total_price,
      number_of_adults,
      number_of_children,
      guests,
      representative_email: representative.email,
      representative_name: representative.name || representative.username,
      tour_name: tour.name,
      booking_type: bookingType
    };

    // 🔐 Mã hóa booking data để tránh tampering
    const encodedBookingData = Buffer.from(JSON.stringify(bookingData)).toString('base64');

    // 💳 Chuyển hướng đến payment gateway tương ứng
    let paymentResponse;
    
    if (payment_method.toLowerCase() === 'vnpay') {
      // 🏦 VNPay Payment
      console.log(`💳 Redirecting to VNPay payment for tour: ${tour.name}`);
      
      paymentResponse = {
        message: "Vui lòng hoàn tất thanh toán để xác nhận đặt tour",
        payment_method: "vnpay",
        payment_url: `/api/payments/vnpay/create_payment_url`, // ✅ Correct endpoint
        booking_data: encodedBookingData,
        tour_info: {
          name: tour.name,
          price: total_price,
          adults: number_of_adults,
          children: number_of_children
        },
        next_step: "Gửi POST request đến payment_url với booking_data trong body"
      };
      
    } else if (payment_method.toLowerCase() === 'momo') {
      // 🎯 MoMo Payment  
      console.log(`💰 Redirecting to MoMo payment for tour: ${tour.name}`);
      
      paymentResponse = {
        message: "Vui lòng hoàn tất thanh toán để xác nhận đặt tour",
        payment_method: "momo",
        payment_url: `/api/payments/momo/create_payment_url`, // ✅ Correct endpoint  
        booking_data: encodedBookingData,
        tour_info: {
          name: tour.name,
          price: total_price,
          adults: number_of_adults,
          children: number_of_children
        },
        next_step: "Gửi POST request đến payment_url với booking_data trong body"
      };
    }

    // 🔄 Response cho frontend để redirect đến payment
    console.log(`🚀 Payment redirection prepared:`, {
      type: bookingType,
      userId: finalUserId,
      representative: representative.email,
      tourName: tour.name,
      paymentMethod: payment_method,
      totalPrice: total_price
    });

    // Luôn trả về booking_id ở cấp cao nhất để FE dễ lấy
    return res.status(200).json({
      booking_id: booking.id,
      ...paymentResponse
    });

  } catch (err) {
    await t.rollback();
    console.error("❌ BOOKING CREATION ERROR:", err);
    
    // 🚨 Thông báo đặt tour thất bại
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: "Đặt tour thất bại - Thông tin không hợp lệ",
        error: "VALIDATION_ERROR",
        details: err.errors.map(e => e.message)
      });
    }
    
    return res.status(500).json({ 
      message: "Đặt tour thất bại - Vui lòng thử lại sau",
      error: "BOOKING_FAILED"
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🎯 CẬP NHẬT BOOKING THÀNH "CONFIRMED" SAU KHI THANH TOÁN THÀNH CÔNG
// ═══════════════════════════════════════════════════════════════════
const updateBookingAfterPayment = async (bookingId, paymentInfo) => {
  try {
    // Tìm và cập nhật booking từ "pending" thành "confirmed"
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { 
          model: User, 
          as: "user",
          attributes: ['id', 'name', 'email', 'username']
        },
        { 
          model: Tour, 
          as: "tour",
          attributes: ['id', 'name', 'destination', 'price']
        },
        { 
          model: DepartureDate, 
          as: "departureDate",
          attributes: ['id', 'departure_date', 'number_of_days']
        },
        { 
          model: Promotion, 
          as: "promotion",
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        },
        { 
          model: InformationBookingTour, 
          as: "guests",
          attributes: ['id', 'name', 'email', 'phone', 'cccd']
        }
      ]
    });
    
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (booking.status !== 'pending') {
      throw new Error(`Booking ${bookingId} is not in pending status. Current status: ${booking.status}`);
    }

    // Cập nhật booking thành confirmed với payment info
    await booking.update({
      status: 'confirmed',
      payment_method: paymentInfo.method,
      payment_id: paymentInfo.transaction_id,
      confirmed_at: new Date()
    });
    
    console.log(`✅ Booking updated to confirmed:`, {
      bookingId: booking.id,
      paymentMethod: paymentInfo.method,
      transactionId: paymentInfo.transaction_id,
      previousStatus: 'pending',
      newStatus: 'confirmed'
    });

    // 📧 GỬI EMAIL XÁC NHẬN BOOKING CHO KHÁCH HÀNG
    try {
      const representative = booking.guests && booking.guests[0];
      if (representative && representative.email) {
        const emailData = {
          booking_id: booking.id,
          tour_name: booking.tour.name,
          departure_date: new Date(booking.departureDate.departure_date).toLocaleDateString('vi-VN'),
          total_price: booking.total_price,
          number_of_adults: booking.number_of_adults,
          number_of_children: booking.number_of_children,
          guests: booking.guests,
          booking_type: booking.user_id === GUEST_USER_ID ? 'GUEST' : 'REGISTERED',
          user_id: booking.user_id
        };

        await sendBookingEmail(representative.email, emailData);
        console.log(`📧 Confirmation email sent to: ${representative.email}`);
      }
    } catch (emailError) {
      console.error(`⚠️ Failed to send confirmation email for booking ${bookingId}:`, emailError);
      // Không throw error để không ảnh hưởng đến luồng chính
    }

    await tourController.updateBookingSummary();
    return booking;
  } catch (err) {
    console.error(`❌ Failed to update booking ${bookingId}:`, err);
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🚫 CẬP NHẬT BOOKING THÀNH "FAILED" KHI THANH TOÁN THẤT BẠI
// ═══════════════════════════════════════════════════════════════════
const updateBookingToFailed = async (bookingId, reason = 'payment_failed') => {
  try {
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      console.warn(`⚠️ Booking ${bookingId} not found for failure update`);
      return null;
    }

    if (booking.status === 'confirmed') {
      console.warn(`⚠️ Cannot mark confirmed booking ${bookingId} as failed`);
      return booking;
    }

    // Cập nhật booking thành failed
    await booking.update({
      status: 'failed',
      failure_reason: reason,
      failed_at: new Date()
    });
    
    console.log(`❌ Booking marked as failed:`, {
      bookingId: booking.id,
      reason,
      previousStatus: booking.status,
      newStatus: 'failed'
    });

    return booking;
  } catch (err) {
    console.error(`❌ Failed to mark booking ${bookingId} as failed:`, err);
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════════
// 🔍 LẤY BOOKING DATA VỚI PAYMENT INFO CHO FRONTEND
// ═══════════════════════════════════════════════════════════════════
const getBookingWithPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Tìm booking với đầy đủ thông tin
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { 
          model: User, 
          as: "user",
          attributes: ['id', 'name', 'email', 'username']
        },
        { 
          model: Tour, 
          as: "tour",
          attributes: ['id', 'name', 'destination', 'price']
        },
        { 
          model: DepartureDate, 
          as: "departureDate",
          attributes: ['id', 'departure_date', 'number_of_days']
        },
        { 
          model: Promotion, 
          as: "promotion",
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        },
        { 
          model: InformationBookingTour, 
          as: "guests",
          attributes: ['id', 'name', 'email', 'phone', 'cccd']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy booking' 
      });
    }
    
    // Tìm payment record cho booking này
    const payment = await Payment.findOne({
      where: { booking_id: bookingId },
      order: [['created_at', 'DESC']] // Lấy payment mới nhất
    });
    
    return res.json({
      success: true,
      data: {
        ...payment?.dataValues || {},
        booking: booking
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting booking with payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────
//  Export CRUD + create custom
// ─────────────────────────────────────────────
module.exports = {
  ...generateCrudController(Booking, [
    { 
      model: User, 
      as: "user",
      attributes: ['id', 'name', 'email', 'username']
    },
    { model: Tour, as: "tour" },
    { model: DepartureDate, as: "departureDate" },
    { 
      model: Promotion, 
      as: "promotion",
      attributes: ['id', 'code', 'description', 'discount_amount'],
      required: false
    },
    { model: InformationBookingTour, as: "guests" }
  ]),
  create,
  updateBookingAfterPayment,
  updateBookingToFailed,
  getBookingWithPayment
};
