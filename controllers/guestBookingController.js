const { Booking, Tour, DepartureDate, InformationBookingTour, User, Promotion, sequelize } = require("../models");
const { Op } = require("sequelize");

// ID của guest user cố định
const GUEST_USER_ID = "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";

// ─────────────────────────────────────────────
//  Đặt tour cho khách vãng lai (Guest Booking)
// ─────────────────────────────────────────────
const createGuestBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      tour_id,
      departure_date_id,
      promotion_id = null,
      total_price,
      number_of_adults,
      number_of_children,
      guests = []
    } = req.body;

    console.log("🎫 Guest booking request:", {
      tour_id,
      departure_date_id,
      guestCount: guests.length,
      total_price
    });

    /* ────────── 0. Kiểm tra guest & email người đại diện ────────── */
    if (!Array.isArray(guests) || guests.length === 0) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Phải nhập ít nhất 1 khách (người đại diện)." 
      });
    }

    const representative = guests[0];
    if (!representative.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representative.email)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Người đại diện phải có email hợp lệ." 
      });
    }

    /* ────────── 1. Kiểm tra ngày khởi hành ────────── */
    const departure = await DepartureDate.findByPk(departure_date_id);
    if (!departure) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Không tìm thấy ngày khởi hành." 
      });
    }
    if (departure.tour_id !== tour_id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Ngày khởi hành không thuộc tour đã chọn." 
      });
    }
    
    // Lấy thông tin tour để có giá gốc
    const tour = await Tour.findByPk(tour_id);
    if (!tour) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy tour." 
      });
    }
    
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    if (new Date(departure.departure_date) < minDate) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Ngày khởi hành phải cách hiện tại ít nhất 3 ngày." 
      });
    }

    /* ────────── 2. Tạo booking với GUEST_USER_ID ────────── */
    const original_price = tour.price * (number_of_adults + number_of_children);
    const discount_amount = original_price - total_price;
    
    const booking = await Booking.create({
      user_id: GUEST_USER_ID, // Tự động set guest user ID
      tour_id,
      departure_date_id,
      promotion_id,
      original_price,
      discount_amount,
      total_price,
      number_of_adults,
      number_of_children,
      status: 'pending'
    }, { transaction: t });

    /* ────────── 3. Tạo guests ────────── */
    const guestRecords = guests.map(g => ({ ...g, booking_id: booking.id }));
    await InformationBookingTour.bulkCreate(guestRecords, { transaction: t });

    await t.commit();

    /* ────────── 4. Trả booking kèm quan hệ ────────── */
    const fullBooking = await Booking.findByPk(booking.id, {
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

    console.log("✅ Guest booking created successfully:", {
      bookingId: booking.id,
      representative: representative.email,
      tourName: tour.name
    });

    res.status(201).json({
      success: true,
      message: "Đặt tour thành công! Vui lòng kiểm tra email để nhận thông tin chi tiết.",
      data: fullBooking
    });

  } catch (error) {
    await t.rollback();
    console.error("❌ Error creating guest booking:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi hệ thống khi đặt tour",
      error: error.message 
    });
  }
};

// ─────────────────────────────────────────────
//  Tra cứu booking bằng email (Guest lookup)
// ─────────────────────────────────────────────
const lookupBookingByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Email không hợp lệ." 
      });
    }

    console.log("🔍 Looking up bookings for email:", email);

    // Tìm tất cả guest records có email này
    const guestRecords = await InformationBookingTour.findAll({
      where: { email },
      include: [
        {
          model: Booking,
          as: 'booking',
          where: { 
            user_id: GUEST_USER_ID // Chỉ lấy guest bookings
          },
          include: [
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
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (guestRecords.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy booking nào với email này." 
      });
    }

    // Group bookings by booking_id để tránh duplicate
    const bookingsMap = {};
    guestRecords.forEach(record => {
      const bookingId = record.booking.id;
      if (!bookingsMap[bookingId]) {
        bookingsMap[bookingId] = {
          ...record.booking.toJSON(),
          guests: []
        };
      }
      bookingsMap[bookingId].guests.push({
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone,
        cccd: record.cccd
      });
    });

    const bookings = Object.values(bookingsMap);

    console.log(`✅ Found ${bookings.length} guest bookings for ${email}`);

    res.json({
      success: true,
      message: `Tìm thấy ${bookings.length} booking(s) cho email ${email}`,
      data: bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error("❌ Error looking up guest bookings:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi hệ thống khi tra cứu booking",
      error: error.message 
    });
  }
};

// ─────────────────────────────────────────────
//  Lấy chi tiết booking guest bằng booking ID
// ─────────────────────────────────────────────
const getGuestBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: { 
        id,
        user_id: GUEST_USER_ID // Đảm bảo chỉ lấy guest booking
      },
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
        message: "Không tìm thấy booking guest với ID này." 
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error("❌ Error getting guest booking by ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi hệ thống khi lấy thông tin booking",
      error: error.message 
    });
  }
};

// ─────────────────────────────────────────────
//  Validate promotion cho guest booking
// ─────────────────────────────────────────────
const validateGuestPromotion = async (req, res) => {
  try {
    const { promotion_code, tour_price } = req.body;
    
    if (!promotion_code) {
      return res.status(400).json({ 
        success: false,
        message: "Mã khuyến mãi không được để trống" 
      });
    }
    
    const normalizedCode = promotion_code.trim().toUpperCase();
    
    const promotion = await Promotion.findOne({
      where: { code: normalizedCode }
    });
    
    if (!promotion) {
      return res.status(404).json({ 
        success: false,
        message: "Mã khuyến mãi không tồn tại" 
      });
    }
    
    const now = new Date();
    if (now < new Date(promotion.start_date)) {
      return res.status(400).json({ 
        success: false,
        message: "Mã khuyến mãi chưa có hiệu lực" 
      });
    }
    
    if (now > new Date(promotion.end_date)) {
      return res.status(400).json({ 
        success: false,
        message: "Mã khuyến mãi đã hết hạn" 
      });
    }
    
    // Tính toán giảm giá
    const discount_value = parseFloat(promotion.discount_amount);
    const original_price = parseFloat(tour_price);
    
    let discount_amount;
    if (discount_value > 100) {
      // Giá cố định (VNĐ)
      discount_amount = Math.min(discount_value, original_price);
    } else {
      // Phần trăm (%)
      discount_amount = (original_price * discount_value) / 100;
    }
    
    const final_price = Math.max(0, original_price - discount_amount);
    
    res.json({
      success: true,
      message: "Mã khuyến mãi hợp lệ",
      data: {
        promotion: {
          id: promotion.id,
          code: promotion.code,
          description: promotion.description,
          discount_amount: promotion.discount_amount
        },
        pricing: {
          original_price: original_price,
          discount_amount: discount_amount,
          final_price: final_price,
          savings: original_price - final_price
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Error validating guest promotion:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi khi kiểm tra mã khuyến mãi", 
      error: error.message 
    });
  }
};

module.exports = {
  createGuestBooking,
  lookupBookingByEmail,
  getGuestBookingById,
  validateGuestPromotion
};
