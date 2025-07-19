const axios = require('axios');

async function testBookingEndpoint() {
  try {
    console.log('Testing booking endpoint...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // Test the agency bookings endpoint
    console.log('Testing GET /api/agency/bookings');
    
    const response = await axios.get(`${baseURL}/agency/bookings`, {
      timeout: 10000,
      headers: {
        'Authorization': 'Bearer test-token' // You might need a real token
      }
    });
    
    console.log('Booking response status:', response.status);
    console.log('Booking response data keys:', Object.keys(response.data));
    
  } catch (error) {
    if (error.response) {
      console.log('API Response Error:', error.response.status);
      if (error.response.status === 401) {
        console.log('✅ Authentication required (expected behavior)');
      } else {
        console.log('Response data:', error.response.data);
      }
    } else {
      console.error('Request Error:', error.message);
    }
  } finally {
    process.exit();
  }
}

testBookingEndpoint();
