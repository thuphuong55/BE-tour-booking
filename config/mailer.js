const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // TLS cho cổng 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

// 📧 Template email booking responsive cho smartphone
const createBookingEmailTemplate = (bookingData) => {
  const {
    booking_id,
    tour_name,
    departure_date,
    total_price,
    number_of_adults,
    number_of_children,
    guests,
    booking_type,
    user_id
  } = bookingData;

  // Luôn hiển thị link hủy tour cho mọi loại user
  const isGuest = user_id === "3ca8bb89-a406-4deb-96a7-dab4d9be3cc1";
  const cancelUrl = `http://localhost:3000/cancel-tour/${booking_id}`;
  const representative = guests && guests[0];

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đặt tour</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          padding: 10px;
        }
        
        .container {
          max-width: 100%;
          width: 100%;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .success-icon {
          width: 50px;
          height: 50px;
          background: #4CAF50;
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .header h1 {
          font-size: 20px;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .content {
          padding: 20px;
        }
        
        .booking-id {
          background: #f8f9ff;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          text-align: center;
        }
        
        .booking-id h3 {
          color: #667eea;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        
        .booking-id span {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          word-break: break-all;
        }
        
        .tour-info {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin: 15px 0;
          overflow: hidden;
        }
        
        .tour-header {
          background: #667eea;
          color: white;
          padding: 12px 15px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .tour-details {
          padding: 15px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f3f4;
          font-size: 14px;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          color: #666;
          font-weight: 500;
        }
        
        .detail-value {
          font-weight: 600;
          color: #333;
          text-align: right;
        }
        
        .price-highlight {
          color: #e74c3c;
          font-size: 16px;
        }
        
        .guests-section {
          margin: 20px 0;
        }
        
        .guest-item {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 12px;
          margin: 8px 0;
          border-left: 4px solid #667eea;
        }
        
        .guest-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        
        .guest-details {
          font-size: 12px;
          color: #666;
        }
        
        .payment-section {
          background: #e8f5e8;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          border-left: 4px solid #4CAF50;
        }
        
        .payment-title {
          color: #2e7d32;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .cancel-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }
        
        .cancel-title {
          color: #856404;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .cancel-btn {
          background: #dc3545;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          font-weight: 600;
          font-size: 14px;
          margin-top: 8px;
        }
        
        .cancel-btn:hover {
          background: #c82333;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        .note {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 6px;
          padding: 10px;
          margin: 15px 0;
          font-size: 12px;
          color: #0c5460;
        }
        
        @media (max-width: 480px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .detail-value {
            text-align: left;
          }
          
          .booking-id span {
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <h1>Đặt Tour Thành Công!</h1>
          <p>Cảm ơn bạn đã tin tướng và lựa chọn dịch vụ của chúng tôi</p>
        </div>
        
        <div class="content">
          <div class="booking-id">
            <h3>Mã đặt tour</h3>
            <span>${booking_id}</span>
          </div>
          
          <div class="tour-info">
            <div class="tour-header">
              📍 ${tour_name}
            </div>
            <div class="tour-details">
              <div class="detail-row">
                <span class="detail-label">🗓️ Ngày khởi hành</span>
                <span class="detail-value">${departure_date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">👥 Số lượng khách</span>
                <span class="detail-value">${number_of_adults} người lớn${number_of_children > 0 ? `, ${number_of_children} trẻ em` : ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💰 Tổng thanh toán</span>
                <span class="detail-value price-highlight">${new Intl.NumberFormat('vi-VN').format(total_price)} VNĐ</span>
              </div>
            </div>
          </div>
          
          <div class="payment-section">
            <div class="payment-title">✅ Chi tiết thanh toán</div>
            <div style="font-size: 13px; color: #2e7d32;">
              Đã thanh toán thành công qua VNPay<br>
              Mã giao dịch: ${booking_id}<br>
              Trạng thái: <strong>Đã xác nhận</strong>
            </div>
          </div>
          
          ${guests && guests.length > 0 ? `
          <div class="guests-section">
            <h3 style="color: #333; margin-bottom: 12px; font-size: 16px;">👥 Danh sách khách tham gia</h3>
            ${guests.map((guest, index) => `
              <div class="guest-item">
                <div class="guest-name">${index + 1}. ${guest.name || guest.username}${index === 0 ? ' (Người đại diện)' : ''}</div>
                <div class="guest-details">
                  📧 ${guest.email} • 📱 ${guest.phone || 'Chưa cập nhật'} • 🆔 ${guest.cccd || 'Chưa cập nhật'}
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="cancel-section">
            <div class="cancel-title">⚠️ Hủy đặt tour</div>
            <div style="font-size: 13px; color: #856404; margin-bottom: 10px;">
              Vui lòng hủy ít nhất 24 giờ trước ngày khởi hành.<br>
              Phí hủy tour có thể được áp dụng theo chính sách.
            </div>
            <a href="${cancelUrl}" class="cancel-btn">HỦY TOUR NÀY</a>
          </div>
          
          <div class="note">
            <strong>📌 Lưu ý quan trọng:</strong><br>
            • Vui lòng có mặt tại điểm tập trung đúng giờ<br>
            • Mang theo giấy tờ tùy thân và passport (nếu cần)<br>
            • Liên hệ hotline nếu có thắc mắc: 1900 1234
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Du lịch ABC</strong> - Đồng hành cùng hạnh phúc</p>
          <p>📞 Hotline: 1900 1234 | 📧 support@dulichabc.com</p>
          <p style="margin-top: 10px; opacity: 0.7;">Email này được gửi tự động, vui lòng không reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 📧 Hàm gửi email booking với template đẹp
const sendBookingEmail = async (to, bookingData) => {
  const subject = `✈️ Xác nhận đặt tour - Mã: ${bookingData.booking_id}`;
  const html = createBookingEmailTemplate(bookingData);
  
  await sendEmail(to, subject, html);
  console.log(`📧 Booking email sent to: ${to} for booking: ${bookingData.booking_id}`);
};

module.exports = { 
  sendEmail, 
  sendBookingEmail,
  createBookingEmailTemplate 
};
