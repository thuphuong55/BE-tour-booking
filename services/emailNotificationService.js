const { sendEmail } = require('../config/mailer');
const { Booking, User, Tour, DepartureDate, InformationBookingTour, Promotion } = require('../models');

/**
 * Gửi email xác nhận booking sau khi thanh toán thành công
 * @param {string} bookingId - ID của booking
 * @param {string} paymentMethod - Phương thức thanh toán (VNPay, MoMo)
 * @param {string} orderId - Order ID từ payment gateway
 */
const sendBookingConfirmationEmail = async (bookingId, paymentMethod, orderId) => {
  try {
    console.log(`📧 Sending booking confirmation email for booking: ${bookingId}`);
    
    // Lấy thông tin booking đầy đủ
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'username']
        },
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name', 'destination', 'price', 'number_of_days']
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
    });

    if (!booking) {
      console.error(`❌ Booking ${bookingId} not found`);
      return false;
    }

    // Xác định email người nhận
    let recipientEmail, recipientName;
    
    if (booking.user_id === '3ca8bb89-a406-4deb-96a7-dab4d9be3cc1') {
      // Guest booking - gửi cho email người đại diện
      const representative = booking.guests.find(guest => guest.email) || booking.guests[0];
      recipientEmail = representative.email;
      recipientName = representative.name;
    } else {
      // Authenticated user booking - gửi cho user account
      recipientEmail = booking.user.email;
      recipientName = booking.user.name;
    }

    if (!recipientEmail) {
      console.error(`❌ No recipient email found for booking ${bookingId}`);
      return false;
    }

    // Format ngày tháng
    const departureDate = new Date(booking.departureDate.departure_date);
    const formattedDate = departureDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Tính toán giá
    const originalPrice = booking.total_price + (booking.promotion?.discount_amount || 0);
    const finalPrice = booking.total_price;
    const savings = booking.promotion?.discount_amount || 0;

    // Tạo HTML email
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { color: #333; }
    .guests-section { margin-top: 20px; }
    .guest-item { background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 5px; border-left: 4px solid #667eea; }
    .price-section { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .total-price { font-size: 18px; font-weight: bold; color: #2d8659; }
    .savings { color: #e74c3c; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }
    .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
    .status-badge { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 XÁC NHẬN ĐẶT TOUR THÀNH CÔNG!</h1>
      <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi</p>
    </div>
    
    <div class="content">
      <div class="booking-card">
        <h2>📋 Thông tin đặt tour</h2>
        
        <div class="info-row">
          <span class="info-label">🎫 Mã booking:</span>
          <span class="info-value"><strong>${booking.id}</strong></span>
        </div>
        
        <div class="info-row">
          <span class="info-label">🏷️ Tên tour:</span>
          <span class="info-value"><strong>${booking.tour.name}</strong></span>
        </div>
        
        <div class="info-row">
          <span class="info-label">📍 Điểm đến:</span>
          <span class="info-value">${booking.tour.destination}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">📅 Ngày khởi hành:</span>
          <span class="info-value"><strong>${formattedDate}</strong></span>
        </div>
        
        <div class="info-row">
          <span class="info-label">⏰ Số ngày:</span>
          <span class="info-value">${booking.tour.number_of_days} ngày ${booking.tour.number_of_days - 1} đêm</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">👥 Số khách:</span>
          <span class="info-value">${booking.number_of_adults} người lớn${booking.number_of_children > 0 ? `, ${booking.number_of_children} trẻ em` : ''}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">💳 Thanh toán qua:</span>
          <span class="info-value">${paymentMethod} - ${orderId}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">📊 Trạng thái:</span>
          <span class="info-value"><span class="status-badge">ĐÃ XÁC NHẬN</span></span>
        </div>
      </div>

      ${savings > 0 ? `
      <div class="price-section">
        <h3>💰 Chi tiết giá</h3>
        <div class="info-row">
          <span class="info-label">Giá gốc:</span>
          <span class="info-value">${originalPrice.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div class="info-row">
          <span class="info-label">Khuyến mãi (${booking.promotion.code}):</span>
          <span class="info-value savings">-${savings.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div class="info-row">
          <span class="info-label total-price">Tổng thanh toán:</span>
          <span class="info-value total-price">${finalPrice.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>
      ` : `
      <div class="price-section">
        <div class="info-row">
          <span class="info-label total-price">Tổng thanh toán:</span>
          <span class="info-value total-price">${finalPrice.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>
      `}

      <div class="guests-section">
        <h3>👥 Danh sách khách tham gia</h3>
        ${booking.guests.map((guest, index) => `
          <div class="guest-item">
            <strong>${index + 1}. ${guest.name}</strong>
            <br>📧 ${guest.email}
            <br>📱 ${guest.phone}
            ${guest.cccd ? `<br>🆔 CCCD: ${guest.cccd}` : ''}
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000/my-bookings" class="button">📱 Xem booking của tôi</a>
        <a href="http://localhost:3000/tours" class="button">🔍 Khám phá thêm tour</a>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h4>📋 Lưu ý quan trọng:</h4>
        <ul>
          <li>Vui lòng có mặt tại điểm tập trung <strong>30 phút trước giờ khởi hành</strong></li>
          <li>Mang theo CCCD/Passport và giấy tờ cần thiết</li>
          <li>Liên hệ hotline nếu cần thay đổi hoặc hủy tour</li>
          <li>Kiểm tra thông tin cá nhân và liên hệ nếu có sai sót</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>🏢 <strong>CÔNG TY DU LỊCH ABC</strong></p>
      <p>📞 Hotline: 1900-xxxx | 📧 Email: support@tour.com</p>
      <p>🌐 Website: www.tour.com | 📍 Địa chỉ: 123 Đường ABC, TP.HCM</p>
      <p><em>Cảm ơn bạn đã chọn chúng tôi cho chuyến du lịch của mình!</em></p>
    </div>
  </div>
</body>
</html>
    `;

    // Gửi email
    await sendEmail(
      recipientEmail,
      `✅ Xác nhận đặt tour thành công - ${booking.tour.name}`,
      emailHTML
    );

    console.log(`✅ Email confirmation sent successfully to: ${recipientEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return false;
  }
};

/**
 * Gửi email thông báo thanh toán thất bại
 * @param {string} bookingId - ID của booking
 * @param {string} paymentMethod - Phương thức thanh toán
 * @param {string} orderId - Order ID từ payment gateway
 */
const sendPaymentFailedEmail = async (bookingId, paymentMethod, orderId) => {
  try {
    console.log(`📧 Sending payment failed email for booking: ${bookingId}`);
    
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'name', 'destination']
        },
        {
          model: InformationBookingTour,
          as: 'guests',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) return false;

    // Xác định email người nhận
    let recipientEmail, recipientName;
    
    if (booking.user_id === '3ca8bb89-a406-4deb-96a7-dab4d9be3cc1') {
      const representative = booking.guests.find(guest => guest.email) || booking.guests[0];
      recipientEmail = representative.email;
      recipientName = representative.name;
    } else {
      recipientEmail = booking.user.email;
      recipientName = booking.user.name;
    }

    if (!recipientEmail) return false;

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .button { background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
    .retry-button { background: #e74c3c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ THANH TOÁN KHÔNG THÀNH CÔNG</h1>
      <p>Rất tiếc, giao dịch của bạn đã không được hoàn tất</p>
    </div>
    
    <div class="content">
      <div class="booking-card">
        <h2>🎫 Thông tin booking</h2>
        <p><strong>Mã booking:</strong> ${booking.id}</p>
        <p><strong>Tour:</strong> ${booking.tour.name}</p>
        <p><strong>Phương thức:</strong> ${paymentMethod}</p>
        <p><strong>Mã giao dịch:</strong> ${orderId}</p>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4>🔄 Thử lại thanh toán</h4>
        <p>Booking của bạn vẫn được giữ chỗ. Bạn có thể thử thanh toán lại trong vòng 15 phút.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000/booking/${booking.id}/payment" class="button retry-button">🔄 Thanh toán lại</a>
        <a href="http://localhost:3000/support" class="button">💬 Liên hệ hỗ trợ</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(
      recipientEmail,
      `❌ Thanh toán không thành công - ${booking.tour.name}`,
      emailHTML
    );

    console.log(`✅ Payment failed email sent to: ${recipientEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending payment failed email:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendPaymentFailedEmail
};
