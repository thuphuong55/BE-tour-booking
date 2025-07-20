const axios = require('axios');

const simpleTest = async () => {
  try {
    console.log('🧪 Simple Auth Test...');
    
    // Test register
    const registerData = {
      username: 'simpletest',
      email: 'simpletest@example.com',
      password: 'password123'
    };

    console.log('Testing register with data:', registerData);
    
    const registerResponse = await axios.post('http://localhost:5001/api/auth/register', registerData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log('Register response:', registerResponse.data);
    
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Server không phản hồi - có thể server chưa chạy hoặc sai port');
    }
  }
};

simpleTest();
