const jwt = require('jsonwebtoken');
const axios = require('axios');

(async () => {
  try {
    // Tạo token cho user bị lock
    const payload = {
      id: 'cddd6d03-ec27-4354-9a4e-904fa45a013b',
      email: 'thuthu060403@gmail.com', 
      role: 'agency'
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });
    console.log('📝 Token created for locked user:', token.substring(0, 50) + '...');
    
    // Test API call
    console.log('🧪 Testing API access...');
    
    try {
      const response = await axios.get('http://localhost:5000/api/agency/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ PROBLEM: API allowed access!');
      console.log('Status:', response.status);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ GOOD: API blocked access');
        console.log('Message:', error.response.data.message);
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
