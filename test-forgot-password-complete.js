const axios = require('axios');

const createTestUserAndTestForgotPassword = async () => {
  try {
    console.log('🧪 Create Test User and Test Forgot Password...');
    
    const baseURL = 'http://localhost:5001/api/auth';
    
    // Create test user first
    const testUser = {
      username: 'forgotpasstest',
      email: 'forgotpasstest@example.com',
      password: 'oldpassword123'
    };

    console.log('\n0️⃣ Creating test user...');
    try {
      await axios.post(`${baseURL}/register`, testUser);
      console.log('✅ Test user created successfully');
    } catch (error) {
      if (error.response?.data?.message?.includes('Email đã tồn tại')) {
        console.log('⚠️ Test user already exists, continuing...');
      } else {
        console.log('❌ Create user error:', error.response?.data || error.message);
        return;
      }
    }

    // Test forgot password flow
    console.log('\n1️⃣ Test POST /api/auth/forgot-password');
    let otpFromEmail = '';
    try {
      const response = await axios.post(`${baseURL}/forgot-password`, {
        email: testUser.email
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
      console.log('⚠️ Development mode OTP not available. Check email for real OTP.');
      
      // Thử với OTP giả để test error handling
      console.log('\n🧪 Testing error scenarios with fake OTP...');
      try {
        await axios.post(`${baseURL}/verify-otp`, {
          email: testUser.email,
          otp: '123456'
        });
      } catch (error) {
        console.log('✅ Fake OTP correctly rejected:', error.response?.data || error.message);
      }
      return;
    }

    // Continue with full test if OTP available
    console.log('\n2️⃣ Test POST /api/auth/verify-otp');
    let resetToken = '';
    try {
      const response = await axios.post(`${baseURL}/verify-otp`, {
        email: testUser.email,
        otp: otpFromEmail
      });
      console.log('✅ Verify OTP Success:', response.data);
      resetToken = response.data.resetToken;
    } catch (error) {
      console.log('❌ Verify OTP Error:', error.response?.data || error.message);
      return;
    }

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

    console.log('\n4️⃣ Test login with new password');
    try {
      const response = await axios.post(`${baseURL}/login`, {
        email: testUser.email,
        password: 'newPassword123'
      });
      console.log('✅ Login with new password Success:', response.data);
    } catch (error) {
      console.log('❌ Login with new password Error:', error.response?.data || error.message);
    }

    console.log('\n🎉 Complete Forgot Password Flow Test finished!');

  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error.message);
  }
};

createTestUserAndTestForgotPassword();
