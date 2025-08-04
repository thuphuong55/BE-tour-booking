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

    // Tạo HTML email với thiết kế cải tiến
    const emailHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt tour thành công</title>
  <style>
    /* Reset CSS */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px 10px;
      min-height: 100vh;
      margin: 0;
    }
    
    .email-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px);
      background-size: 40px 40px;
      animation: float 25s infinite linear;
    }
    
    @keyframes float {
      0% { transform: translateX(-50px) translateY(-50px); }
      100% { transform: translateX(0px) translateY(0px); }
    }
    
    .header-content {
      position: relative;
      z-index: 2;
    }
    
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 15px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .header p {
      font-size: 20px;
      opacity: 0.95;
      font-weight: 300;
    }
    
    .success-icon {
      width: 90px;
      height: 90px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    
    .main-content {
      padding: 60px 50px;
    }
    
    .booking-summary {
      background: linear-gradient(145deg, #f8f9ff, #e8f0fe);
      padding: 40px;
      border-radius: 20px;
      margin-bottom: 40px;
      border: 1px solid rgba(102, 126, 234, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .booking-summary::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }
    
    .booking-id {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 15px;
      border: 2px dashed #667eea;
    }
    
    .booking-id-label {
      font-size: 16px;
      color: #667eea;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }
    
    .booking-id-value {
      font-size: 28px;
      font-weight: 700;
      color: #333;
      margin-top: 8px;
    }
    
    .tour-info {
      margin-bottom: 35px;
    }
    
    .tour-name {
      font-size: 30px;
      font-weight: 700;
      color: #333;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    
    .tour-destination {
      font-size: 20px;
      color: #667eea;
      font-weight: 500;
      margin-bottom: 20px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin: 35px 0;
    }
    
    .info-item {
      background: white;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .info-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.12);
    }
    
    .info-icon {
      font-size: 24px;
      margin-bottom: 10px;
      display: block;
    }
    
    .info-label {
      font-size: 14px;
      color: #888;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      line-height: 1.4;
    }
    
    .status-badge {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 10px 25px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: inline-block;
    }
    
    .price-section {
      background: linear-gradient(145deg, #ecfdf5, #d1fae5);
      padding: 40px;
      border-radius: 20px;
      margin: 40px 0;
      border-left: 6px solid #10b981;
    }
    
    .price-title {
      font-size: 24px;
      font-weight: 700;
      color: #333;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
    }
    
    .price-title::before {
      content: '💰';
      margin-right: 12px;
      font-size: 28px;
    }
    
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px 0;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    .price-row:last-child {
      border-bottom: none;
      font-size: 22px;
      font-weight: 700;
      color: #059669;
      border-top: 2px solid #10b981;
      padding-top: 25px;
      margin-top: 25px;
    }
    
    .original-price {
      text-decoration: line-through;
      color: #888;
      font-size: 16px;
    }
    
    .savings {
      color: #dc2626;
      font-weight: 700;
    }
    
    .guests-section {
      margin: 50px 0;
    }
    
    .section-title {
      font-size: 26px;
      font-weight: 700;
      color: #333;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
    }
    
    .section-title::before {
      content: '👥';
      margin-right: 12px;
      font-size: 30px;
    }
    
    .guests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
    }
    
    .guest-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.08);
      border-left: 5px solid #667eea;
      transition: transform 0.3s ease;
    }
    
    .guest-card:hover {
      transform: translateY(-3px);
    }
    
    .guest-name {
      font-size: 20px;
      font-weight: 700;
      color: #333;
      margin-bottom: 15px;
    }
    
    .guest-info {
      font-size: 16px;
      color: #666;
      margin: 10px 0;
      display: flex;
      align-items: center;
    }
    
    .guest-info .icon {
      margin-right: 10px;
      width: 22px;
    }
    
    .actions-section {
      text-align: center;
      margin: 60px 0;
    }
    
    .btn {
      display: inline-block;
      padding: 18px 40px;
      margin: 10px 15px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
    
    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
      color: #374151;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .btn-secondary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    
    .important-notes {
      background: linear-gradient(145deg, #fef3c7, #fde68a);
      padding: 40px;
      border-radius: 20px;
      margin: 40px 0;
      border-left: 6px solid #f59e0b;
    }
    
    .notes-title {
      font-size: 24px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
    }
    
    .notes-title::before {
      content: '⚠️';
      margin-right: 12px;
      font-size: 28px;
    }
    
    .notes-list {
      list-style: none;
      padding: 0;
    }
    
    .notes-list li {
      padding: 15px 0;
      font-size: 18px;
      color: #78350f;
      position: relative;
      padding-left: 35px;
    }
    
    .notes-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #f59e0b;
      font-weight: bold;
      font-size: 20px;
    }
    
    .footer {
      background: linear-gradient(135deg, #1f2937, #111827);
      color: white;
      padding: 60px 40px;
      text-align: center;
    }
    
    .company-logo {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 25px;
      color: #667eea;
    }
    
    .contact-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 25px;
      margin: 35px 0;
    }
    
    .contact-item {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .contact-item strong {
      display: block;
      margin-bottom: 6px;
      color: #667eea;
    }
    
    .footer-message {
      margin-top: 35px;
      font-style: italic;
      opacity: 0.8;
      font-size: 18px;
    }
    
    /* Responsive Design */
    @media (max-width: 600px) {
      body { padding: 10px 5px; }
      .email-container { border-radius: 10px; }
      .header, .main-content, .footer { padding: 40px 20px; }
      .header h1 { font-size: 28px; }
      .tour-name { font-size: 24px; }
      .info-grid { grid-template-columns: 1fr; gap: 20px; }
      .guests-grid { grid-template-columns: 1fr; }
      .btn { padding: 15px 30px; margin: 10px; display: block; }
      .price-row { flex-direction: column; text-align: center; gap: 8px; }
      .contact-info { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Section -->
    <div class="header">
      <div class="header-content">
        <div class="success-icon">✅</div>
        <h1>Đặt Tour Thành Công!</h1>
        <p>Cảm ơn bạn đã tin tưởng và lựa chọn dịch vụ của chúng tôi</p>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Booking Summary -->
      <div class="booking-summary">
        <div class="booking-id">
          <div class="booking-id-label">Mã đặt tour</div>
          <div class="booking-id-value">${booking.id}</div>
        </div>
        
        <div class="tour-info">
          <div class="tour-name">${booking.tour.name}</div>
          <div class="tour-destination">📍 ${booking.tour.destination}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-icon">📅</span>
            <div class="info-label">Ngày khởi hành</div>
            <div class="info-value">${formattedDate}</div>
          </div>
          
          <div class="info-item">
            <span class="info-icon">⏰</span>
            <div class="info-label">Thời gian tour</div>
            <div class="info-value">${booking.departureDate.number_of_days} ngày ${booking.departureDate.number_of_days - 1} đêm</div>
          </div>
          
          <div class="info-item">
            <span class="info-icon">👥</span>
            <div class="info-label">Số lượng khách</div>
            <div class="info-value">${booking.number_of_adults} người lớn${booking.number_of_children > 0 ? `, ${booking.number_of_children} trẻ em` : ''}</div>
          </div>
          
          <div class="info-item">
            <span class="info-icon">💳</span>
            <div class="info-label">Thanh toán</div>
            <div class="info-value">${paymentMethod}<br><small>${orderId}</small></div>
          </div>
          
          <div class="info-item">
            <span class="info-icon">📊</span>
            <div class="info-label">Trạng thái</div>
            <div class="info-value"><span class="status-badge">Đã xác nhận</span></div>
          </div>
        </div>
      </div>

      <!-- Price Section -->
      ${savings > 0 ? `
      <div class="price-section">
        <div class="price-title">Chi tiết thanh toán</div>
        <div class="price-row">
          <span>Giá gốc:</span>
          <span class="original-price">${originalPrice.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div class="price-row">
          <span>Khuyến mãi (${booking.promotion.code}):</span>
          <span class="savings">-${savings.toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div class="price-row">
          <span>Tổng thanh toán:</span>
          <span>${finalPrice.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>
      ` : `
      <div class="price-section">
        <div class="price-title">Chi tiết thanh toán</div>
        <div class="price-row">
          <span>Tổng thanh toán:</span>
          <span>${finalPrice.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>
      `}

      <!-- Guests Section -->
      <div class="guests-section">
        <div class="section-title">Danh sách khách tham gia</div>
        <div class="guests-grid">
          ${booking.guests.map((guest, index) => `
          <div class="guest-card">
            <div class="guest-name">${index + 1}. ${guest.name}</div>
            <div class="guest-info">
              <span class="icon">📧</span>${guest.email}
            </div>
            <div class="guest-info">
              <span class="icon">📱</span>${guest.phone}
            </div>
            ${guest.cccd ? `<div class="guest-info"><span class="icon">🆔</span>CCCD: ${guest.cccd}</div>` : ''}
          </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-section">
        <a href="http://localhost:3000/my-bookings" class="btn btn-primary">Xem booking của tôi</a>
        <a href="http://localhost:3000/tours" class="btn btn-secondary">Khám phá thêm tour</a>
        <a href="http://localhost:3000/cancel-tour/${booking.id}" class="btn btn-danger" style="background: #dc3545; color: #fff; margin-top: 10px;">HỦY TOUR NÀY</a>
      </div>

      <!-- Important Notes -->
      <div class="important-notes">
        <div class="notes-title">Lưu ý quan trọng</div>
        <ul class="notes-list">
          <li>Vui lòng có mặt tại điểm tập trung <strong>30 phút trước giờ khởi hành</strong></li>
          <li>Mang theo CCCD/Passport và các giấy tờ cần thiết</li>
          <li>Liên hệ hotline nếu cần thay đổi hoặc hủy tour</li>
          <li>Kiểm tra kỹ thông tin cá nhân và liên hệ nếu có sai sót</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="company-logo">🏢 CÔNG TY DU LỊCH ABC</div>
      <div class="contact-info">
        <div class="contact-item">
          <strong>📞 Hotline</strong>
          1900-xxxx
        </div>
        <div class="contact-item">
          <strong>📧 Email</strong>
          support@tour.com
        </div>
        <div class="contact-item">
          <strong>🌐 Website</strong>
          www.tour.com
        </div>
        <div class="contact-item">
          <strong>📍 Địa chỉ</strong>
          123 Đường ABC, TP.HCM
        </div>
      </div>
      <div class="footer-message">
        Cảm ơn bạn đã chọn chúng tôi cho chuyến du lịch của mình! 🌟
      </div>
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
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanh toán không thành công</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 20px 10px;
      min-height: 100vh;
    }
    
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px);
      background-size: 40px 40px;
      animation: float 25s infinite linear;
    }
    
    @keyframes float {
      0% { transform: translateX(-50px) translateY(-50px); }
      100% { transform: translateX(0px) translateY(0px); }
    }
    
    .error-icon {
      width: 90px;
      height: 90px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 15px;
    }
    
    .header p {
      font-size: 18px;
      opacity: 0.95;
    }
    
    .main-content {
      padding: 60px 50px;
    }
    
    .booking-info {
      background: linear-gradient(145deg, #fef2f2, #fee2e2);
      padding: 40px;
      border-radius: 15px;
      border-left: 5px solid #ef4444;
      margin-bottom: 40px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid rgba(239, 68, 68, 0.1);
    }
    
    .info-item:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 600;
      color: #7f1d1d;
      font-size: 16px;
    }
    
    .info-value {
      color: #991b1b;
      font-size: 16px;
    }
    
    .retry-section {
      background: linear-gradient(145deg, #fff7ed, #fed7aa);
      padding: 40px;
      border-radius: 15px;
      border-left: 5px solid #f97316;
      margin: 40px 0;
      text-align: center;
    }
    
    .retry-title {
      font-size: 24px;
      font-weight: 700;
      color: #9a3412;
      margin-bottom: 20px;
    }
    
    .retry-message {
      color: #a16207;
      margin-bottom: 30px;
      line-height: 1.6;
      font-size: 16px;
    }
    
    .btn {
      display: inline-block;
      padding: 18px 40px;
      margin: 10px 15px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    
    .btn-retry {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
    }
    
    .btn-retry:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(249, 115, 22, 0.4);
    }
    
    .btn-support {
      background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
      color: #374151;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .btn-support:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    
    /* Responsive Design */
    @media (max-width: 600px) {
      body { padding: 10px 5px; }
      .email-container { border-radius: 10px; }
      .header, .main-content { padding: 40px 20px; }
      .header h1 { font-size: 24px; }
      .header p { font-size: 16px; }
      .info-item { flex-direction: column; text-align: center; gap: 5px; }
      .btn { padding: 15px 30px; margin: 10px; display: block; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Section -->
    <div class="header">
      <div class="error-icon">❌</div>
      <h1>Thanh Toán Không Thành Công</h1>
      <p>Rất tiếc, giao dịch của bạn đã không được hoàn tất</p>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Booking Info -->
      <div class="booking-info">
        <div class="info-item">
          <span class="info-label">Mã booking:</span>
          <span class="info-value">${booking.id}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tour:</span>
          <span class="info-value">${booking.tour.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Phương thức:</span>
          <span class="info-value">${paymentMethod}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Mã giao dịch:</span>
          <span class="info-value">${orderId}</span>
        </div>
      </div>

      <!-- Retry Section -->
      <div class="retry-section">
        <div class="retry-title">Thử lại thanh toán</div>
        <div class="retry-message">
          Booking của bạn vẫn được giữ chỗ. Bạn có thể thử thanh toán lại trong vòng 15 phút.
        </div>
        <a href="http://localhost:3000/booking/${booking.id}/payment" class="btn btn-retry">🔄 Thanh toán lại</a>
        <a href="http://localhost:3000/support" class="btn btn-support">💬 Liên hệ hỗ trợ</a>
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

/**
 * Gửi email thông báo hoàn tiền thủ công cho guest khi booking bị hủy
 * @param {string} bookingId - ID của booking
 * @param {number} refundAmount - Số tiền hoàn
 * @param {number} refundRate - Tỷ lệ hoàn tiền
 * @param {string} refundStatus - Trạng thái hoàn tiền (manual_required)
 */
const sendManualRefundEmail = async (bookingId, refundAmount, refundRate, refundStatus) => {
  try {
    console.log(`📧 Sending manual refund email for booking: ${bookingId}`);
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
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo hoàn tiền thủ công</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fef3c7; padding: 20px; }
    .email-container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #fff; padding: 40px 30px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
    .header p { font-size: 18px; }
    .main-content { padding: 40px 30px; }
    .refund-info { background: #fffbea; border-left: 5px solid #f59e0b; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .info-row { margin-bottom: 18px; font-size: 16px; }
    .info-label { font-weight: 600; color: #92400e; }
    .info-value { color: #78350f; }
    .manual-section { background: #fff3cd; border-left: 5px solid #fbbf24; padding: 25px; border-radius: 10px; margin-bottom: 30px; }
    .manual-title { font-size: 20px; font-weight: 700; color: #92400e; margin-bottom: 10px; }
    .manual-message { font-size: 16px; color: #78350f; }
    .footer { background: #f59e0b; color: #fff; padding: 30px; text-align: center; border-radius: 0 0 16px 16px; }
    .footer-message { font-size: 16px; opacity: 0.85; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Yêu cầu hoàn tiền thủ công</h1>
      <p>Đơn đặt tour của bạn đã được hủy thành công</p>
    </div>
    <div class="main-content">
      <div class="refund-info">
        <div class="info-row"><span class="info-label">Mã booking:</span> <span class="info-value">${booking.id}</span></div>
        <div class="info-row"><span class="info-label">Tour:</span> <span class="info-value">${booking.tour.name}</span></div>
        <div class="info-row"><span class="info-label">Số tiền hoàn dự kiến:</span> <span class="info-value">${refundAmount.toLocaleString('vi-VN')} VNĐ</span></div>
        <div class="info-row"><span class="info-label">Tỷ lệ hoàn tiền:</span> <span class="info-value">${refundRate * 100}%</span></div>
        <div class="info-row"><span class="info-label">Trạng thái hoàn tiền:</span> <span class="info-value">${refundStatus === 'manual_required' ? 'Cần liên hệ CSKH để hoàn tiền' : refundStatus}</span></div>
      </div>
      <div class="manual-section">
        <div class="manual-title">Hướng dẫn hoàn tiền</div>
        <div class="manual-message">Hệ thống chưa thể hoàn tiền tự động cho booking này. Vui lòng liên hệ bộ phận Chăm Sóc Khách Hàng (CSKH) qua hotline <strong>1900-xxxx</strong> hoặc email <strong>support@tour.com</strong> để được hỗ trợ hoàn tiền.</div>
      </div>
    </div>
    <div class="footer">
      <div>🏢 CÔNG TY DU LỊCH ABC</div>
      <div class="footer-message">Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi!</div>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(
      recipientEmail,
      `Thông báo hoàn tiền thủ công - ${booking.tour.name}`,
      emailHTML
    );
    console.log(`✅ Manual refund email sent to: ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending manual refund email:', error);
    return false;
  }
};

/**
 * Gửi email thông báo hủy tour do agency hủy
 * @param {string} bookingId - ID của booking
 * @param {string} tourName - Tên tour
 * @param {string} destination - Điểm đến
 * @param {string} reason - Lý do hủy
 * @param {string} recipientEmail - Email người nhận
 * @param {string} recipientName - Tên người nhận
 */
const sendAgencyCancelTourEmail = async (bookingId, tourName, destination, reason, recipientEmail, recipientName) => {
  try {
    console.log(`📧 Sending agency cancel tour email for booking: ${bookingId} to: ${recipientEmail}`);

    const emailHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo hủy tour & hoàn tiền</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; padding: 0; margin: 0; }
    .email-container { max-width: 700px; margin: 30px auto; background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.10); overflow: hidden; }
    .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; padding: 50px 40px 30px 40px; text-align: center; }
    .header h1 { font-size: 32px; font-weight: 800; margin-bottom: 10px; letter-spacing: 1px; }
    .header p { font-size: 18px; opacity: 0.95; margin-bottom: 0; }
    .icon-success { font-size: 60px; margin-bottom: 18px; }
    .main-content { padding: 40px 40px 30px 40px; }
    .tour-info { background: #f8fafc; border-left: 6px solid #dc2626; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .info-row { margin-bottom: 18px; font-size: 17px; display: flex; gap: 10px; }
    .info-label { font-weight: 700; color: #1f2937; min-width: 120px; }
    .info-value { color: #374151; font-weight: 500; }
    .refund-section { background: #ecfdf5; border-left: 6px solid #10b981; padding: 30px; border-radius: 12px; margin: 30px 0; }
    .refund-title { font-size: 22px; font-weight: 800; color: #065f46; margin-bottom: 15px; display: flex; align-items: center; }
    .refund-title::before { content: '�'; margin-right: 10px; font-size: 26px; }
    .refund-message { font-size: 17px; color: #047857; line-height: 1.7; }
    .contact-section { background: #fff3cd; border-left: 6px solid #f59e0b; padding: 30px; border-radius: 12px; margin: 30px 0; }
    .contact-title { font-size: 20px; font-weight: 800; color: #92400e; margin-bottom: 15px; display: flex; align-items: center; }
    .contact-title::before { content: '📞'; margin-right: 10px; font-size: 24px; }
    .contact-info { font-size: 17px; color: #78350f; }
    .contact-info strong { color: #92400e; }
    .apology-section { text-align: center; margin: 35px 0; padding: 22px; background: #f9fafb; border-radius: 12px; }
    .apology-text { font-size: 17px; color: #6b7280; line-height: 1.7; font-style: italic; }
    .footer { background: #1f2937; color: #fff; padding: 32px; text-align: center; }
    .footer-logo { font-size: 26px; font-weight: 800; margin-bottom: 10px; }
    .footer-message { font-size: 15px; opacity: 0.85; }
    @media (max-width: 600px) {
      body { padding: 0; }
      .email-container { border-radius: 10px; }
      .header, .main-content { padding: 30px 15px; }
      .header h1 { font-size: 22px; }
      .header p { font-size: 15px; }
      .info-label { min-width: auto; display: block; margin-bottom: 5px; }
      .info-row { flex-direction: column; gap: 2px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="icon-success">🎉</div>
      <h1>Tour đã bị hủy & hoàn tiền thành công</h1>
      <p>Chúng tôi xin lỗi vì sự bất tiện này và đã hoàn tiền cho bạn.</p>
    </div>
    <div class="main-content">
      <p style="font-size: 17px; margin-bottom: 25px;">Xin chào <strong>${recipientName || 'Quý khách'}</strong>,</p>
      <div class="tour-info">
        <h3 style="margin-top: 0; color: #1f2937; margin-bottom: 20px;">Thông tin booking:</h3>
        <div class="info-row">
          <span class="info-label">Mã booking:</span>
          <span class="info-value"><strong>${bookingId}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Tour:</span>
          <span class="info-value"><strong>${tourName}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Điểm đến:</span>
          <span class="info-value"><strong>${destination}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Lý do hủy:</span>
          <span class="info-value"><strong>${reason || 'Agency xóa ngày khởi hành, hoàn tiền cho user.'}</strong></span>
        </div>
      </div>
      <div class="refund-section">
        <div class="refund-title">Hoàn tiền</div>
        <div class="refund-message">
          Bạn sẽ được hoàn lại <strong>100% số tiền đã thanh toán</strong>.<br>
          Chúng tôi sẽ xử lý hoàn tiền trong vòng <strong>7-14 ngày làm việc</strong>.<br>
          Nếu có thắc mắc, vui lòng liên hệ bộ phận CSKH.
        </div>
      </div>
      <div class="contact-section">
        <div class="contact-title">Liên hệ hỗ trợ</div>
        <div class="contact-info">
          Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:<br>
          <strong>• Hotline:</strong> 1900-xxxx<br>
          <strong>• Email:</strong> support@tour.com
        </div>
      </div>
      <div class="apology-section">
        <div class="apology-text">
          Chúng tôi chân thành xin lỗi vì sự bất tiện này và hy vọng có cơ hội phục vụ bạn trong tương lai.
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-logo">🏢 CÔNG TY DU LỊCH ABC</div>
      <div class="footer-message">Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi!</div>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(
      recipientEmail,
      `⚠️ Thông báo hủy tour - ${tourName}`,
      emailHTML
    );
    
    console.log(`✅ Agency cancel tour email sent to: ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending agency cancel tour email:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendPaymentFailedEmail,
  sendManualRefundEmail,
  sendAgencyCancelTourEmail
};

/**
 * Gửi email thông báo tài khoản agency vừa được admin tạo thành công
 * @param {Object} params - Thông tin tài khoản
 * @param {string} params.email - Email agency
 * @param {string} params.username - Username
 * @param {string} params.tempPassword - Mật khẩu tạm
 * @param {string} params.name - Tên agency
 * @param {string} params.id - ID user
 */
const sendAgencyAccountCreatedEmail = async ({ email, username, tempPassword, name, id }) => {
  try {
    console.log(`📧 Starting to send agency account created email to: ${email}`);
    console.log(`📧 Agency details:`, { email, username, name, id });
    
    const loginUrl = 'http://localhost:3001/';
    const emailHTML = `
    <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background:#f8fafc;padding:32px;max-width:600px;margin:auto;border-radius:16px;box-shadow:0 8px 32px rgba(102,126,234,0.08)">
      <h2 style="color:#667eea">🎉 Tài khoản Agency đã được tạo thành công!</h2>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Tài khoản agency của bạn đã được admin tạo thành công trên hệ thống.</p>
      <div style="background:#fff;padding:20px;border-radius:10px;margin:24px 0;border:1px solid #e5e7eb">
        <h3>📋 Thông tin đăng nhập:</h3>
        <ul style="font-size:16px;line-height:1.7">
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Username:</strong> ${username}</li>
          <li><strong>Mật khẩu tạm:</strong> ${tempPassword}</li>
          <li><strong>ID:</strong> ${id}</li>
        </ul>
      </div>
      <p><strong>Trạng thái:</strong> Đã duyệt và kích hoạt</p>
      <p>Bạn có thể đăng nhập và quản lý tour tại:</p>
      <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;background:#667eea;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:12px 0">Đăng nhập ngay</a>
      <p style="margin-top:24px;font-size:15px;color:#374151">🔐 Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu để bảo mật.<br>📞 Liên hệ admin nếu cần hỗ trợ.</p>
    </div>
  `;
  
    console.log(`📧 Calling sendEmail function...`);
    await sendEmail(
      email,
      '🎉 Tài khoản Agency đã được tạo thành công',
      emailHTML
    );
    console.log(`✅ Agency account created email sent successfully to: ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Error in sendAgencyAccountCreatedEmail:', err);
    console.error('❌ Stack trace:', err.stack);
    return false;
  }
};

module.exports.sendAgencyAccountCreatedEmail = sendAgencyAccountCreatedEmail;