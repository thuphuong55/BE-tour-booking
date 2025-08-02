// controllers/cancelBookingController.js
const { Booking, Refund, Commission, User, Agency, InformationBookingTour } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../config/mailer');
const { updateBookingSummary } = require('../utils/bookingSummary');

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
function getRefundRate(booking, now, payment) {
  // Lấy ngày khởi hành
  let departureDate = null;
  if (booking.departureDate) {
    if (booking.departureDate.departure_date) {
      departureDate = booking.departureDate.departure_date;
    } else if (booking.departureDate.dataValues && booking.departureDate.dataValues.departure_date) {
      departureDate = booking.departureDate.dataValues.departure_date;
    }
  }
  if (!departureDate && booking.departure_date) {
    departureDate = booking.departure_date;
  }
  // Lấy ngày thanh toán
  let paidAt = booking.paidAt || (payment && (payment.paid_at || payment.payment_date));
  paidAt = paidAt ? new Date(paidAt) : null;
  // Tính số ngày thực tế giữa now và departureDate
  let daysToDeparture = 0;
  if (departureDate) {
    const depDate = new Date(departureDate);
    daysToDeparture = Math.ceil((depDate - now) / (1000 * 60 * 60 * 24));
  }
  const isWithin24h = paidAt && (now - paidAt < 24 * 60 * 60 * 1000);
  if (booking.forceMajeure) return 1;
  if (booking.noShow) return 0;
  // Chính sách hoàn tiền:
  // - Hủy trước 7 ngày: hoàn 100%
  // - Hủy trước 3-7 ngày: hoàn 50%
  // - Hủy trong vòng 3 ngày: không hoàn tiền
  if (daysToDeparture >= 7) return 1;
  if (daysToDeparture >= 3) return 0.5;
  return 0;
}

// Main endpoint
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    // Cho phép guest không cần Authorization
    // Ưu tiên lấy user_id từ body (nếu có), nếu không thì lấy từ req.user
    let userId = req.body.user_id || null;
    let role = 'guest';
    if (req.user && req.user.id) {
      userId = req.user.id;
      role = req.user.role;
    }
    const reason = req.body.reason || '';
    const now = new Date();

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: require('../models').DepartureDate,
          as: 'departureDate',
          include: [
            {
              model: require('../models').Tour,
              as: 'tour',
              attributes: ['id', 'name', 'agency_id']
            }
          ]
        }
      ]
    });
    
    console.log(`[CANCEL BOOKING] Booking found:`, booking ? 'YES' : 'NO');
    console.log(`[CANCEL BOOKING] Booking departureDate:`, booking?.departureDate ? 'YES' : 'NO');
    console.log(`[CANCEL BOOKING] Booking tour:`, booking?.departureDate?.tour ? 'YES' : 'NO');
    console.log(`[CANCEL BOOKING] Tour agency_id:`, booking?.departureDate?.tour?.agency_id);
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking already cancelled' });
    // Nếu ngày khởi hành không tồn tại, vẫn cho phép hủy booking
    if (!booking.departureDate) {
      console.warn(`[CANCEL BOOKING] DepartureDate not found for booking ${bookingId}. Vẫn cho phép hủy.`);
    } else if (new Date(booking.departureDate) <= now) {
      return res.status(400).json({ error: 'Tour đã khởi hành, không thể hủy.' });
    }

    // Phân quyền: chỉ kiểm tra với user hoặc agency, guest thì bỏ qua (cho phép hủy qua link)
    if (role === 'user' && booking.user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy booking này' });
    }
    if (role === 'agency') {
      // Lấy agency_id từ user_id
      console.log(`[CANCEL BOOKING] Finding agency for user:`, userId);
      const agency = await Agency.findOne({ where: { user_id: userId } });
      console.log(`[CANCEL BOOKING] agency_id from user:`, agency ? agency.id : 'null');
      
      // Lấy agency_id từ tour của booking (qua departureDate)
      let tourAgencyId = booking.departureDate?.tour?.agency_id;
      console.log(`[CANCEL BOOKING] agency_id from tour (direct):`, tourAgencyId);
      
      // Nếu không lấy được từ include, query trực tiếp
      if (!tourAgencyId && booking.departureDate) {
        const { Tour } = require('../models');
        const tour = await Tour.findByPk(booking.departureDate.tour_id, {
          attributes: ['id', 'agency_id']
        });
        tourAgencyId = tour?.agency_id;
        console.log(`[CANCEL BOOKING] agency_id from tour (direct query):`, tourAgencyId);
      }
      
      if (!agency) {
        return res.status(403).json({ error: 'Không tìm thấy agency cho user này' });
      }
      
      if (tourAgencyId !== agency.id) {
        return res.status(403).json({ 
          error: 'Đại lý không có quyền hủy booking này',
          debug: {
            agency_id_user: agency.id,
            agency_id_tour: tourAgencyId
          }
        });
      }
    }
    // Nếu là guest, chỉ cần đúng bookingId là cho phép hủy

    // Xác định mức hoàn tiền (tạm thời để null, sẽ tính sau khi có payment)
    let refundAmount = null;
    let refundRate = null;
    let nonRefundableFees = null;
    let totalPrice = null;

    // Xử lý hoa hồng
    const commissions = await Commission.findAll({ where: { booking_id: bookingId } });
    for (const commission of commissions) {
      if (commission.status === 'paid') {
        await Commission.create({
          booking_id: bookingId,
          agency_id: commission.agency_id,
          amount: -commission.amount,
          status: 'reversal',
          note: 'Thu hồi hoa hồng do hủy tour',
          created_at: now
        });
        // TODO: Thông báo cho agency/admin về việc thu hồi hoa hồng
      } else {
        commission.status = 'cancelled';
        commission.note = 'Hủy hoa hồng do hủy tour';
        await commission.save();
      }
    }

    // Xử lý hoàn tiền qua API nội bộ
    let refundStatus = 'pending';
    let paymentError = null;
    try {
      const axios = require('axios');
      const payment = await require('../models').Payment.findOne({ where: { booking_id: booking.id, status: 'completed' } });
      console.log('[CANCEL BOOKING] Tìm payment:', payment);
      if (payment) {
        // Tính lại các biến hoàn tiền sau khi đã có payment
        // Nếu agency là người hủy, luôn hoàn 100%
        if (role === 'agency') {
          refundRate = 1;
        } else {
          refundRate = Number(getRefundRate(booking, now, payment)) || 0;
        }
        nonRefundableFees = Number(calculateNonRefundableFees(booking)) || 0;
        // Ưu tiên booking.total_price, nếu không có thì lấy payment.amount
        totalPrice = Number(booking.total_price) || Number(payment.amount) || 0;

        // Debug: log thông tin chi tiết về ngày tháng
        console.log('[CANCEL BOOKING] Debug dates:');
        console.log('  - now:', now);
        console.log('  - booking.departureDate:', booking.departureDate);
        console.log('  - booking.departure_date:', booking.departure_date);
        console.log('  - payment.payment_date:', payment.payment_date);

        // Không ép cứng refundRate, để hệ thống tự động tính theo quy tắc

        console.log('[CANCEL BOOKING] totalPrice:', totalPrice, 'refundRate:', refundRate, 'nonRefundableFees:', nonRefundableFees);
        refundAmount = Math.max(totalPrice * refundRate - nonRefundableFees, 0);

        // Nếu số tiền hoàn = 0, không gọi refund API, chỉ trả về thông báo cho user
        if (refundAmount <= 0) {
          // Cập nhật trạng thái booking thành cancelled
          booking.status = 'cancelled';
          booking.cancelledBy = role;
          booking.cancelledReason = reason;
          booking.cancelledAt = now;
          await booking.save();

          // Tăng số chỗ trống của departure date
          if (booking.departure_date_id) {
            const departure = await booking.getDepartureDate();
            if (departure && typeof departure.available_slots === 'number') {
              departure.available_slots += booking.number_of_adults + booking.number_of_children;
              await departure.save();
            }
            // Ghi lại lịch sử hủy tour (booking_summary)
            try {
              await updateBookingSummary(booking.id);
            } catch (err) {
              console.error('[CANCEL BOOKING] Lỗi cập nhật booking_summary:', err);
            }
          }

          await Refund.create({
            booking_id: bookingId,
            user_id: userId,
            amount: refundAmount,
            status: 'no_refund',
            reason,
            created_at: now
          });
          return res.status(200).json({
            message: 'Không có khoản tiền nào được hoàn trả cho booking này. Đơn đã được hủy thành công.',
            refundAmount,
            refundRate,
            nonRefundableFees,
            refundStatus: 'no_refund',
            paymentError: null
          });
        }

        // Gọi refund API phù hợp với phương thức thanh toán
        let transactionId = payment.transaction_id || payment.vnpay_transaction_id || payment.momo_transaction_id || undefined;
        if (!transactionId && payment.vnpay_response) {
          try {
            const vnpayRes = typeof payment.vnpay_response === 'string' ? JSON.parse(payment.vnpay_response) : payment.vnpay_response;
            transactionId = vnpayRes?.vnp_TransactionNo || vnpayRes?.transactionNo || vnpayRes?.transaction_id || vnpayRes?.txnRef;
          } catch (e) { /* ignore */ }
        }
        if (!transactionId && payment.momo_response) {
          try {
            const momoRes = typeof payment.momo_response === 'string' ? JSON.parse(payment.momo_response) : payment.momo_response;
            transactionId = momoRes?.transId || momoRes?.transaction_id || momoRes?.txnRef;
          } catch (e) { /* ignore */ }
        }
        const orderId = payment.order_id;
        if (!transactionId && (payment.payment_method === 'VNPay' || payment.payment_method === 'MoMo')) {
          transactionId = payment.id;
        }
        if (!transactionId && orderId) {
          transactionId = orderId;
        }
        const amount = Number(refundAmount);
        let transDate;
        const paymentDateSource = payment.payment_date || payment.created_at || payment.createdAt;
        if (paymentDateSource) {
          const d = new Date(paymentDateSource);
          transDate = d.getFullYear().toString() +
            (d.getMonth() + 1).toString().padStart(2, '0') +
            d.getDate().toString().padStart(2, '0') +
            d.getHours().toString().padStart(2, '0') +
            d.getMinutes().toString().padStart(2, '0') +
            d.getSeconds().toString().padStart(2, '0');
        }
        console.log('[CANCEL BOOKING] transactionId:', transactionId, 'orderId:', orderId, 'amount:', amount);
        if (!transactionId && payment.payment_method === 'VNPay' && orderId) {
          transactionId = orderId;
          console.log('[CANCEL BOOKING] Fallback: dùng orderId làm transactionId cho VNPay:', transactionId);
        }
        if (!transactionId || isNaN(amount)) {
          if (payment.payment_method === 'VNPay') {
            throw new Error('Booking thanh toán qua VNPay nhưng không lưu mã giao dịch (transaction_id/vnpay_response/order_id). Vui lòng nhập transaction_id hoặc order_id vào bảng payment để hoàn tiền tự động.');
          } else if (payment.payment_method === 'MoMo') {
            throw new Error('Booking thanh toán qua MoMo nhưng không lưu mã giao dịch (transaction_id/momo_response/order_id). Vui lòng nhập transaction_id hoặc order_id vào bảng payment để hoàn tiền tự động.');
          } else {
            throw new Error('Thiếu thông tin thanh toán để hoàn tiền (transactionId, amount, orderId)');
          }
        }
        // Gọi endpoint phù hợp
        let refundRes;
        if (payment.payment_method === 'VNPay') {
          const refundPayload = {
            transactionId,
            amount,
            orderId,
            transDate,
            reason: reason || 'Hoàn tiền khi hủy booking'
          };
          console.log('[CANCEL BOOKING] Gọi POST /api/payments/refund với payload:', refundPayload);
          refundRes = await axios.post(
            'http://localhost:5000/api/payments/refund',
            refundPayload,
            req.headers['authorization']
              ? { headers: { Authorization: req.headers['authorization'] } }
              : undefined
          );
        } else if (payment.payment_method === 'MoMo') {
          const refundPayload = {
            orderId,
            transId: transactionId,
            amount,
            reason: reason || 'Hoàn tiền khi hủy booking'
          };
          console.log('[CANCEL BOOKING] Gọi POST /api/payments/momo/refund với payload:', refundPayload);
          refundRes = await axios.post(
            'http://localhost:5000/api/payments/momo/refund',
            refundPayload,
            req.headers['authorization']
              ? { headers: { Authorization: req.headers['authorization'] } }
              : undefined
          );
        } else {
          throw new Error('Phương thức thanh toán không hỗ trợ hoàn tiền tự động.');
        }
        console.log('[CANCEL BOOKING] Kết quả trả về từ refund endpoint:', refundRes.data);
        if (refundRes.data && (refundRes.data.refundStatus === 'completed' || refundRes.data.message?.includes('thành công'))) {
          refundStatus = 'completed';
        } else {
          throw new Error(refundRes.data && (refundRes.data.errorMessage || refundRes.data.error) ? (refundRes.data.errorMessage || refundRes.data.error) : 'Refund failed');
        }
      } else {
        console.error('[CANCEL BOOKING] Không tìm thấy thanh toán hoàn tất cho booking:', booking.id);
        throw new Error('Không tìm thấy thanh toán hoàn tất.');
      }
    } catch (err) {
      console.error('[CANCEL BOOKING] Lỗi khi gọi refund:', err);
      refundStatus = 'manual_required';
      paymentError = err.message;
    }

    // Luôn cập nhật trạng thái booking
    booking.status = 'cancelled';
    booking.cancelledBy = role;
    booking.cancelledReason = reason;
    booking.cancelledAt = now;
    await booking.save();

    // Nếu agency hủy booking, xóa luôn ngày khởi hành và gửi email cho tất cả user có booking liên quan
    if (role === 'agency' && booking.departure_date_id) {
      const DepartureDate = require('../models').DepartureDate;
      const departure = await DepartureDate.findByPk(booking.departure_date_id);
      if (departure) {
        // Tìm tất cả booking liên quan đến ngày khởi hành này
        const relatedBookings = await Booking.findAll({
          where: {
            departure_date_id: booking.departure_date_id,
            status: { [Op.not]: 'cancelled' }
          }
        });

        // BE tự động hủy và refund cho từng booking liên quan
        for (const relatedBooking of relatedBookings) {
          try {
            // Gọi lại chính hàm cancelBooking cho từng booking liên quan
            // Truyền lý do chuẩn hóa: 'Agency hủy ngày khởi hành'
            // Truyền user_id là agency của booking đó (để qua được check quyền)
            const fakeReq = {
              params: { id: relatedBooking.id },
              body: { reason: 'Agency hủy ngày khởi hành', user_id: relatedBooking.agency_id },
              user: { id: relatedBooking.agency_id, role: 'agency' },
              headers: req.headers
            };
            const fakeRes = {
              status: () => ({ json: () => {} }),
              json: () => {}
            };
            await cancelBooking(fakeReq, fakeRes);
          } catch (err) {
            console.error(`[CANCEL BOOKING] Lỗi hủy booking ${relatedBooking.id} khi agency xóa ngày khởi hành:`, err);
          }
        }

        // Xóa ngày khởi hành
        await departure.destroy();
        console.log(`[CANCEL BOOKING] Đã xóa ngày khởi hành id=${booking.departure_date_id} do agency hủy booking và đã tự động hủy/refund tất cả booking liên quan.`);
      }
      // Cập nhật lại booking_summary sau khi hủy booking
      try {
        await updateBookingSummary(booking.id);
      } catch (err) {
        console.error('[CANCEL BOOKING] Lỗi cập nhật booking_summary:', err);
      }
    } else if (booking.departure_date_id) {
      // Nếu không phải agency, vẫn tăng số chỗ trống như cũ
      const departure = await booking.getDepartureDate();
      if (departure && typeof departure.available_slots === 'number') {
        departure.available_slots += booking.number_of_adults + booking.number_of_children;
        await departure.save();
      }
      try {
        await updateBookingSummary(booking.id);
      } catch (err) {
        console.error('[CANCEL BOOKING] Lỗi cập nhật booking_summary:', err);
      }
    }

    // Nếu refundStatus là manual_required, tạo Refund record và trả về thông báo rõ ràng cho khách
    if (refundStatus !== 'completed') {
      await Refund.create({
        booking_id: bookingId,
        user_id: userId,
        amount: refundAmount,
        status: refundStatus,
        reason,
        created_at: now
      });
      // Gửi email thông báo hoàn tiền thủ công qua emailNotificationService
      try {
        const { sendManualRefundEmail } = require('../services/emailNotificationService');
        await sendManualRefundEmail(bookingId, refundAmount, refundRate, refundStatus);
      } catch (mailErr) {
        console.error('[CANCEL BOOKING] Lỗi gửi email hoàn tiền thủ công:', mailErr);
      }
      return res.status(200).json({
        message: 'Đơn đã được hủy thành công. Tuy nhiên, hệ thống chưa hoàn tiền tự động. Vui lòng liên hệ CSKH để được hỗ trợ hoàn tiền.',
        refundAmount,
        refundRate,
        nonRefundableFees,
        refundStatus,
        paymentError
      });
    }

    // Tạo record hoàn tiền
    await Refund.create({
      booking_id: bookingId,
      user_id: userId,
      amount: refundAmount,
      status: refundStatus,
      reason,
      created_at: now
    });


    // Gửi email thông báo cho khách đại diện (cả khách login và vãng lai)
    try {
      // Lấy thông tin khách đại diện từ bảng InformationBookingTour
      const rep = await InformationBookingTour.findOne({
        where: { booking_id: bookingId },
        order: [['created_at', 'ASC']]
      });
      if (rep && rep.email) {
        let subject, html;
        if (refundStatus === 'completed') {
          subject = 'Thông báo hủy tour & hoàn tiền thành công';
          html = `<p>Xin chào ${rep.name || 'Quý khách'},</p>
            <p>Đơn hàng tour của bạn đã được hủy và hoàn tiền thành công.</p>
            <ul>
              <li>Mã booking: <b>${bookingId}</b></li>
              <li>Số tiền hoàn: <b>${refundAmount.toLocaleString()} VND</b></li>
              <li>Lý do: ${reason}</li>
            </ul>
            <p>Nếu có thắc mắc, vui lòng liên hệ bộ phận CSKH.</p>`;
        } else {
          subject = 'Thông báo hủy tour - cần hỗ trợ hoàn tiền';
          html = `<p>Xin chào ${rep.name || 'Quý khách'},</p>
            <p>Đơn hàng tour của bạn đã được hủy. Tuy nhiên, hệ thống chưa hoàn tiền tự động thành công.</p>
            <ul>
              <li>Mã booking: <b>${bookingId}</b></li>
              <li>Số tiền dự kiến hoàn: <b>${refundAmount.toLocaleString()} VND</b></li>
              <li>Lý do: ${reason}</li>
              <li>Ghi chú: ${paymentError}</li>
            </ul>
            <p>Vui lòng liên hệ CSKH để được hỗ trợ hoàn tiền.</p>`;
        }
        await sendEmail(rep.email, subject, html);
      }
    } catch (mailErr) {
      console.error('[CANCEL BOOKING] Lỗi gửi email thông báo:', mailErr);
    }

    res.json({
      message: 'Yêu cầu hủy tour đã được ghi nhận và hoàn tiền thành công.',
      refundAmount,
      refundRate,
      nonRefundableFees,
      refundStatus,
      paymentError
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { cancelBooking };