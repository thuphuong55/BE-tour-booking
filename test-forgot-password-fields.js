const axios = require('axios');

const testForgotPasswordFields = async () => {
  try {
    console.log('🧪 Testing Forgot Password with different field names...');
    
    const baseURL = 'http://localhost:5001/api/auth';
    
    const testCases = [
      {
        name: 'Using email field',
        data: {
          email: 'dh52106342@student.stu.edu.vn'
        }
      },
      {
        name: 'Using emailOrUsername field',
        data: {
          emailOrUsername: 'dh52106342@student.stu.edu.vn'
        }
      },
      {
        name: 'Using both fields (should prioritize email)',
        data: {
          email: 'dh52106342@student.stu.edu.vn',
          emailOrUsername: 'other@example.com'
        }
      },
      {
        name: 'Missing both fields',
        data: {}
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Test: ${testCase.name}`);
      console.log(`📤 Data:`, testCase.data);
      
      try {
        const response = await axios.post(`${baseURL}/forgot-password`, testCase.data);
        console.log('✅ Success:', response.data.message);
        
        if (response.data.debug?.otp) {
          console.log('🔢 Debug OTP:', response.data.debug.otp);
        }
        
      } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 Forgot password field tests completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testForgotPasswordFields();
