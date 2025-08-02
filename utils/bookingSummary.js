// utils/bookingSummary.js
// Helper to update booking_summary table after booking confirmation
const { sequelize, Booking } = require('../models');

/**
 * Update booking_summary for a confirmed booking
 * @param {Object} booking - Booking instance (Sequelize model)
 * @returns {Promise<void>}
 */
async function updateBookingSummary(booking_id) {
  // Tìm booking theo ID
  const booking = await Booking.findByPk(booking_id);
 
  if (!booking) {
    throw new Error(`Không tìm thấy booking với ID: ${booking_id}`);
  }

  const tourId = booking.tour_id;
  const departureDateId = booking.departure_date_id;

  if (!tourId || !departureDateId) {
    throw new Error(`Booking thiếu thông tin tour_id hoặc departure_date_id`);
  }

  console.log(`✅ Updating booking_summary cho tourId=${tourId}, departureDateId=${departureDateId}`);

  // Lấy tổng số người đã đặt (người lớn + trẻ em) cho tour và ngày khởi hành này
  const [results] = await sequelize.query(
    `SELECT SUM(COALESCE(number_of_adults, 0) + COALESCE(number_of_children, 0)) AS total_booked
     FROM booking
     WHERE tour_id = ? AND departure_date_id = ? AND status = 'confirmed'`,
    {
      replacements: [tourId, departureDateId],
      type: sequelize.QueryTypes.SELECT
    }
  );

  const totalBooked = results.total_booked ? parseInt(results.total_booked, 10) : 0;

  // Thực hiện upsert vào bảng booking_summary
  await sequelize.query(
    `INSERT INTO booking_summary (tour_id, departure_date_id, total_booked, last_updated)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
     total_booked = VALUES(total_booked),
     last_updated = VALUES(last_updated)`,
    {
      replacements: [tourId, departureDateId, totalBooked]
    }
  );

  console.log(`✅ booking_summary đã được cập nhật: total_booked = ${totalBooked}`);
}


module.exports = { updateBookingSummary };
