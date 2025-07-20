const axios = require('axios');

async function testCommissionEndpoint() {
  try {
    // Test không cần authentication trước
    const response = await axios.get('http://localhost:5000/api/commissions', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('❌ Status:', error.response.status);
      console.log('📄 Error data:', error.response.data);
    } else {
      console.log('💥 Error:', error.message);
    }
  }
}

testCommissionEndpoint();
