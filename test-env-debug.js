const axios = require('axios');

const testEnvironmentAndForgotPassword = async () => {
  try {
    console.log('🔍 Checking environment variables...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    console.log('\n🧪 Testing forgot password with debug info...');
    
    const baseURL = 'http://localhost:5001/api/auth';
    
    try {
      const response = await axios.post(`${baseURL}/forgot-password`, {
        email: 'forgotpasstest@example.com'
      });
      
      console.log('✅ Full Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.debug) {
        console.log('🔢 Debug OTP:', response.data.debug.otp);
      } else {
        console.log('❌ No debug info returned');
        console.log('Server might not be in development mode');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testEnvironmentAndForgotPassword();
