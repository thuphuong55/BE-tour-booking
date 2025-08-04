const { sendEmail } = require('./config/mailer');
require('dotenv').config();

async function testEmail() {
  try {
    console.log('🧪 Testing email functionality...');
    
    // Test với email thử nghiệm
    await sendEmail(
      'thuthu060403@gmail.com',
      'Test Email - Kiểm tra gửi email',
      '<h1>Test Email</h1><p>Đây là email test để kiểm tra cấu hình SMTP.</p>'
    );
    
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
}

testEmail();
