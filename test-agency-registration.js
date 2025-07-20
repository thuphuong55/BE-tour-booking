const axios = require('axios');

const testAgencyRegistration = async () => {
  try {
    console.log('🧪 Test đăng ký agency...');
    
    const testData = {
      name: 'Công ty Du lịch Test Agency',
      email: 'newagency2025@example.com',
      phone: '0123456789',
      address: '123 Test Street, Test City',
      tax_code: 'TEST123456',
      business_license: 'BL123456',
      website: 'https://testagency.com',
      captchaToken: 'fake-captcha-token-for-testing'
    };

    const response = await axios.post('http://localhost:5001/api/agencies/public-request-test', testData);
    
    console.log('✅ Đăng ký thành công!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Lỗi đăng ký:', error.response?.data || error.message);
  }
};

testAgencyRegistration();
