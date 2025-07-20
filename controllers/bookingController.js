const { Booking, Tour, DepartureDate, InformationBookingTour, User, Promotion, sequelize } = require("../models");
const generateCrudController = require("./generateCrudController");
const { Op } = require("sequelize");
const { sendEmail } = require("../config/mailer");

// ID của guest user cố định
const GUEST_USER_ID = "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";

// ─────────────────────────────────────────────
//  Hàm CREATE Booking - Hỗ trợ cả User đăng nhập và Guest
// ─────────────────────────────────────────────
const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      user_id, // Optional - sẽ bị override bởi logic auto-detect
      tour_id,
      departure_date_id,
      promotion_id = null,
      total_price,
      number_of_adults,
      number_of_children,
      status,
      guests = []
    } = req.body;

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
      console.log("🎫 Guest booking detected - using Guest User ID");
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
    
    const booking = await Booking.create({
      user_id: finalUserId, // Sử dụng User ID đã được auto-detect
      tour_id,
      departure_date_id,
      promotion_id,
      original_price, // Giá gốc từ tour * số người
      discount_amount, // Số tiền được giảm giá
      total_price, // Giá cuối cùng sau discount
      number_of_adults,
      number_of_children,
      status
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
        { model: Tour, as: "tour" },
        { model: DepartureDate, as: "departureDate" },
        { 
          model: Promotion, 
          as: "promotion",
          attributes: ['id', 'code', 'description', 'discount_amount'],
          required: false
        },
        { model: InformationBookingTour, as: "guests" }
      ]
    });

    // ✅ Success response với thông tin booking type
    console.log(`✅ Booking created successfully:`, {
      bookingId: booking.id,
      type: bookingType,
      userId: finalUserId,
      representative: representative.email,
      tourName: tour.name
    });

    // 📧 Gửi email thông báo booking đã được tạo (pending payment)
    try {
      const departureDate = new Date(departure.departure_date);
      const formattedDate = departureDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { color: #333; }
    .button { background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
    .warning-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 BOOKING ĐÃ ĐƯỢC TẠO!</h1>
      <p>Vui lòng hoàn tất thanh toán để xác nhận chỗ</p>
    </div>
    
    <div class="content">
      <div class="booking-card">
        <h2>🎫 Thông tin booking</h2>
        <div class="info-row">
          <span class="info-label">🎫 Mã booking:</span>
          <span class="info-value"><strong>${booking.id}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">🏷️ Tên tour:</span>
          <span class="info-value"><strong>${tour.name}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 Điểm đến:</span>
          <span class="info-value">${tour.destination}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Ngày khởi hành:</span>
          <span class="info-value"><strong>${formattedDate}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">💰 Tổng giá:</span>
          <span class="info-value"><strong>${total_price.toLocaleString('vi-VN')} VNĐ</strong></span>
        </div>
      </div>

      <div class="warning-box">
        <h4>⏰ Quan trọng!</h4>
        <p><strong>Vui lòng thanh toán trong vòng 15 phút</strong> để giữ chỗ. Booking sẽ tự động hủy nếu không được thanh toán kịp thời.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000/booking/${booking.id}/payment" class="button">💳 Thanh toán ngay</a>
      </div>

      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>📧 Email này được gửi tự động.</strong> Bạn sẽ nhận được email xác nhận chi tiết sau khi thanh toán thành công.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      await sendEmail(
        representative.email,
        `📋 Booking đã tạo - Vui lòng thanh toán để xác nhận chỗ`,
        emailHTML
      );

      console.log(`📧 Booking created email sent to: ${representative.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send booking created email:', emailError);
      // Không fail booking process nếu email fail
    }

    return res.status(201).json({
      success: true,
      message: bookingType === "AUTHENTICATED_USER" 
        ? "Đặt tour thành công! Booking đã được tạo cho tài khoản của bạn."
        : "Đặt tour thành công! Vui lòng kiểm tra email để nhận thông tin chi tiết.",
      bookingType: bookingType,
      data: fullBooking
    });

  } catch (err) {
    await t.rollback();
    console.error("❌ Lỗi khi tạo booking:", err);
    res.status(500).json({ message: "Tạo booking thất bại", error: err.message });
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
  create
};
