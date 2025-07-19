const { Booking, Tour, DepartureDate, InformationBookingTour, sequelize } = require("../models");
const generateCrudController = require("./generateCrudController");
const { Op } = require("sequelize");

// ─────────────────────────────────────────────
//  Hàm CREATE Booking + guests (đã thêm check email)
// ─────────────────────────────────────────────
const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      user_id,
      tour_id,
      departure_date_id,
      promotion_id = null, // Thêm promotion_id
      total_price,
      number_of_adults,
      number_of_children,
      status,
      guests = []
    } = req.body;

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

    /* ────────── 2. Tạo booking ────────── */
    // Tính discount amount nếu có promotion
    const original_price = tour.price * (number_of_adults + number_of_children);
    const discount_amount = original_price - total_price;
    
    const booking = await Booking.create({
      user_id,
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
        { model: Tour, as: "tour" },
        { model: DepartureDate, as: "departureDate" },
        { model: InformationBookingTour, as: "guests" }
      ]
    });
    return res.status(201).json(fullBooking);

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
    { model: Tour, as: "tour" },
    { model: DepartureDate, as: "departureDate" },
    { model: InformationBookingTour, as: "guests" }
  ]),
  create
};
