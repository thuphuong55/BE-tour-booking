const axios = require('axios');

async function testToggleLock() {
  try {
    console.log('🧪 Testing toggle-lock API...');
    
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU0Mjk4MDY1LCJleHAiOjE3NTQzODQ0NjV9.snn2CaYCbp80OMLihQqbZBG0isutLa9PMsEhhPoEm4Q';
    const agencyId = '487ef622-57b5-43a1-8d40-e02792bcc1d4';
    
    const response = await axios.put(
      `http://localhost:5000/api/agencies/toggle-lock/${agencyId}`,
      { action: 'lock' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    
    console.log('✅ SUCCESS:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testToggleLock();
