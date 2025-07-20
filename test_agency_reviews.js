const axios = require('axios');

async function testAgencyReviews() {
  try {
    console.log('=== TEST AGENCY REVIEWS ENDPOINT ===');
    
    // 1. Login để lấy token
    console.log('1. Đăng nhập agency...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'agency12@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, Agency ID:', loginResponse.data.user.agency_id);
    
    // 2. Test reviews endpoint
    console.log('\n2. Gọi API /api/agency/reviews...');
    const response = await axios.get('http://localhost:5001/api/agency/reviews?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Reviews data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testAgencyReviews();
