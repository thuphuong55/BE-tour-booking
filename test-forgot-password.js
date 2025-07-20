const axios = require('axios');

const testForgotPasswordFlow = async () => {
  try {
    console.log('🧪 Test Forgot Password Flow...');
    
    const baseURL = 'http://localhost:5001/api/auth';
    
    // Test email (sử dụng email có sẵn trong system)
    const testEmail = 'test123@example.com'; // Thay bằng email thật có trong database
    
    // Step 1: Request OTP
    console.log('\n1️⃣ Test POST /api/auth/forgot-password');
    let otpFromEmail = '';
    try {
      const response = await axios.post(`${baseURL}/forgot-password`, {
        email: testEmail
      });
      console.log('✅ Forgot Password Success:', response.data);
      
      // Trong development mode, OTP sẽ được trả về để test
      if (response.data.debug && response.data.debug.otp) {
        otpFromEmail = response.data.debug.otp;
        console.log('🔢 OTP for testing:', otpFromEmail);
      }
    } catch (error) {
      console.log('❌ Forgot Password Error:', error.response?.data || error.message);
      return;
    }

    if (!otpFromEmail) {
      console.log('⚠️ Không có OTP để test tiếp. Kiểm tra email hoặc dùng email có sẵn trong database.');
      return;
    }

    // Step 2: Verify OTP
    console.log('\n2️⃣ Test POST /api/auth/verify-otp');
    let resetToken = '';
    try {
      const response = await axios.post(`${baseURL}/verify-otp`, {
        email: testEmail,
        otp: otpFromEmail
      });
      console.log('✅ Verify OTP Success:', response.data);
      resetToken = response.data.resetToken;
    } catch (error) {
      console.log('❌ Verify OTP Error:', error.response?.data || error.message);
      return;
    }

    // Step 3: Reset Password với token
    console.log('\n3️⃣ Test POST /api/auth/reset-password-with-token');
    try {
      const response = await axios.post(`${baseURL}/reset-password-with-token`, {
        resetToken: resetToken,
        password: 'newPassword123',
        confirmPassword: 'newPassword123'
      });
      console.log('✅ Reset Password Success:', response.data);
    } catch (error) {
      console.log('❌ Reset Password Error:', error.response?.data || error.message);
      return;
    }

    // Step 4: Test login với password mới
    console.log('\n4️⃣ Test login with new password');
    try {
      const response = await axios.post(`${baseURL}/login`, {
        email: testEmail,
        password: 'newPassword123'
      });
      console.log('✅ Login with new password Success:', response.data);
    } catch (error) {
      console.log('❌ Login with new password Error:', error.response?.data || error.message);
    }

    // Test các edge cases
    console.log('\n🧪 Testing Edge Cases...');

    // Test wrong OTP
    console.log('\n5️⃣ Test verify wrong OTP (should fail)');
    try {
      const response = await axios.post(`${baseURL}/verify-otp`, {
        email: testEmail,
        otp: '123456' // Wrong OTP
      });
      console.log('❌ Wrong OTP should have failed:', response.data);
    } catch (error) {
      console.log('✅ Wrong OTP correctly failed:', error.response?.data || error.message);
    }

    // Test forgot password with non-existent email
    console.log('\n6️⃣ Test forgot password with non-existent email');
    try {
      const response = await axios.post(`${baseURL}/forgot-password`, {
        email: 'nonexistent@example.com'
      });
      console.log('✅ Non-existent email response:', response.data);
    } catch (error) {
      console.log('❌ Non-existent email error:', error.response?.data || error.message);
    }

    console.log('\n🎉 Forgot Password Flow Test hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error.message);
  }
};

testForgotPasswordFlow();
