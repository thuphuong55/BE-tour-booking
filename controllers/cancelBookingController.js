// controllers/cancelBookingController.js
const { Booking, Refund, Commission, User, Agency } = require('../models');
const { Op } = require('sequelize');

// Helper: Tính số ngày làm việc giữa 2 ngày (loại trừ T7, CN)
function getBusinessDays(start, end) {
  let count = 0;
  let current = new Date(start);
  end = new Date(end);
  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Helper: Tính phí dịch vụ không hoàn lại
function calculateNonRefundableFees(booking) {
  return (booking.visaFee || 0) + (booking.depositFee || 0) + (booking.paymentFee || 0) + (booking.ticketFee || 0);
}

// Helper: Xác định mức hoàn tiền
function getRefundRate(booking, now) {
  const daysToDeparture = getBusinessDays(now, booking.departureDate);
  const paidAt = booking.paidAt ? new Date(booking.paidAt) : null;
  const isWithin24h = paidAt && (now - paidAt < 24 * 60 * 60 * 1000);
  if (booking.forceMajeure) return 1;
  if (booking.noShow) return 0;
  if (isWithin24h && daysToDeparture >= 15) return 1;
  if (daysToDeparture >= 30) return 1;
  if (daysToDeparture >= 15) return 0.7;
  if (daysToDeparture >= 7) return 0.5;
  return 0;
}

// Main endpoint
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role; // 'user', 'agency', 'admin'
    const reason = req.body.reason || '';
    const now = new Date();

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });
    if (booking.departureDate && new Date(booking.departureDate) <= now) {
      return res.status(400).json({ error: 'Tour đã khởi hành, không thể hủy.' });
    }

    // Phân quyền
    if (role === 'user' && booking.userId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy booking này' });
    }
    if (role === 'agency' && booking.agencyId !== userId) {
      return res.status(403).json({ error: 'Đại lý không có quyền hủy booking này' });
    }

    // Xác định mức hoàn tiền
    const refundRate = getRefundRate(booking, now);
    const nonRefundableFees = calculateNonRefundableFees(booking);
    const refundAmount = Math.max(booking.totalPrice * refundRate - nonRefundableFees, 0);

    // Xử lý hoa hồng
    const commissions = await Commission.findAll({ where: { bookingId } });
    for (const commission of commissions) {
      if (commission.status === 'paid') {
        await Commission.create({
          bookingId,
          agencyId: commission.agencyId,
          amount: -commission.amount,
          status: 'reversal',
          note: 'Thu hồi hoa hồng do hủy tour',
          createdAt: now
        });
        // TODO: Thông báo cho agency/admin về việc thu hồi hoa hồng
      } else {
        commission.status = 'cancelled';
        commission.note = 'Hủy hoa hồng do hủy tour';
        await commission.save();
      }
    }

    // Cập nhật trạng thái booking
    booking.status = 'cancelled';
    booking.cancelledBy = role;
    booking.cancelledReason = reason;
    booking.cancelledAt = now;
    await booking.save();

    // Tạo record hoàn tiền
    await Refund.create({
      bookingId,
      userId,
      amount: refundAmount,
      status: 'pending',
      reason,
      createdAt: now
    });

    // TODO: Gửi thông báo cho khách hàng

    res.json({
      message: 'Yêu cầu hủy tour đã được ghi nhận',
      refundAmount,
      refundRate,
      nonRefundableFees
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: err.message });
  }
};
