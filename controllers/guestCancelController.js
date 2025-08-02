const { Booking, Tour, DepartureDate, InformationBookingTour, User, sequelize } = require("../models");
const { sendEmail } = require("../config/mailer");

// ID của guest user cố định
const GUEST_USER_ID = "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";

// 🚫 HỦY BOOKING CHO GUEST THÔNG QUA LINK EMAIL
const cancelGuestBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { bookingId } = req.params;

    // Tìm booking với đầy đủ thông tin
    const booking = await Booking.findByPk(bookingId, {
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
          model: InformationBookingTour, 
          as: "guests",
          attributes: ['id', 'name', 'email', 'phone', 'cccd']
        }
      ],
      transaction: t
    });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy booking" 
      });
    }

    // Kiểm tra chỉ guest mới có thể hủy qua link này
    if (booking.user_id !== GUEST_USER_ID) {
      await t.rollback();
      return res.status(403).json({ 
        success: false,
        message: "Chỉ khách vãng lai mới có thể hủy booking qua link này" 
      });
    }

    // Kiểm tra trạng thái booking
    if (booking.status === 'cancelled') {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Booking này đã được hủy trước đó" 
      });
    }

    if (booking.status === 'completed') {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Không thể hủy booking đã hoàn thành" 
      });
    }

    // Kiểm tra thời gian hủy (ít nhất 24 giờ trước ngày khởi hành)
    const departureTime = new Date(booking.departureDate.departure_date);
    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 24) {
      await t.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Chỉ có thể hủy booking ít nhất 24 giờ trước ngày khởi hành",
        departure_date: booking.departureDate.departure_date,
        hours_remaining: Math.round(hoursDiff)
      });
    }

    // Cập nhật trạng thái booking thành cancelled
    await booking.update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: 'guest_cancellation'
    }, { transaction: t });

    await t.commit();

    // 📧 Gửi email xác nhận hủy booking
    try {
      const representative = booking.guests && booking.guests[0];
      if (representative && representative.email) {
        const cancelEmailHtml = `
          <!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Xác nhận hủy tour</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8f9fa;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              }
              .header {
                background: #dc3545;
                color: white;
                padding: 20px;
                text-align: center;
              }
              .content {
                padding: 20px;
              }
              .booking-info {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
              }
              .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Hủy Tour Thành Công</h1>
                <p>Booking của bạn đã được hủy</p>
              </div>
              
              <div class="content">
                <div class="booking-info">
                  <h3>Thông tin tour đã hủy:</h3>
                  <p><strong>Mã booking:</strong> ${booking.id}</p>
                  <p><strong>Tên tour:</strong> ${booking.tour.name}</p>
                  <p><strong>Ngày khởi hành:</strong> ${new Date(booking.departureDate.departure_date).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN').format(booking.total_price)} VNĐ</p>
                  <p><strong>Thời gian hủy:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <h4 style="color: #856404;">📋 Thông tin hoàn tiền:</h4>
                  <p style="color: #856404; font-size: 14px;">
                    Tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.<br>
                    Phí hủy tour có thể được áp dụng theo chính sách.<br>
                    Bộ phận chăm sóc khách hàng sẽ liên hệ với bạn sớm nhất.
                  </p>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Du lịch ABC</strong> - Đồng hành cùng hạnh phúc</p>
                <p>📞 Hotline: 1900 1234 | 📧 support@dulichabc.com</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail(
          representative.email,
          `🚫 Xác nhận hủy tour - Mã: ${booking.id}`,
          cancelEmailHtml
        );
        console.log(`📧 Cancellation email sent to: ${representative.email}`);
      }
    } catch (emailError) {
      console.error(`⚠️ Failed to send cancellation email:`, emailError);
      // Không throw error để không ảnh hưởng đến response
    }

    console.log(`🚫 Guest booking cancelled:`, {
      bookingId: booking.id,
      tourName: booking.tour.name,
      cancelledAt: new Date(),
      hoursBefore: Math.round(hoursDiff)
    });

    return res.json({
      success: true,
      message: "Hủy booking thành công",
      data: {
        booking_id: booking.id,
        tour_name: booking.tour.name,
        cancelled_at: new Date(),
        refund_info: "Tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc"
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('❌ Error cancelling guest booking:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi hủy booking',
      error: error.message
    });
  }
};

// 📋 LẤY THÔNG TIN BOOKING CHO TRANG HỦY TOUR
const getBookingForCancel = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findByPk(bookingId, {
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
          model: InformationBookingTour, 
          as: "guests",
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy booking' 
      });
    }

    // Kiểm tra chỉ guest mới có thể xem
    if (booking.user_id !== GUEST_USER_ID) {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền truy cập booking này' 
      });
    }

    // Kiểm tra thời gian còn lại để hủy
    const departureTime = new Date(booking.departureDate.departure_date);
    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    const canCancel = hoursDiff >= 24 && booking.status !== 'cancelled' && booking.status !== 'completed';

    return res.json({
      success: true,
      data: {
        ...booking.toJSON(),
        can_cancel: canCancel,
        hours_until_departure: Math.round(hoursDiff),
        cancellation_deadline: hoursDiff >= 24 ? "Có thể hủy" : "Quá hạn hủy (< 24h)"
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting booking for cancel:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống',
      error: error.message
    });
  }
};

module.exports = {
  cancelGuestBooking,
  getBookingForCancel
};
