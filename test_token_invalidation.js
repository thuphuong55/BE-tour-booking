const axios = require('axios');

async function testTokenInvalidation() {
  // Fresh token for the locked agency - should be invalidated by our system
  const agencyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ4N2VmNjIyLTU3YjUtNDNhMS04ZDQwLWUwMjc5MmJjYzFkNCIsImVtYWlsIjoidGVzdGFnZW5jeUBleGFtcGxlLmNvbSIsInJvbGUiOiJhZ2VuY3kiLCJhZ2VuY3lJZCI6IjQ4N2VmNjIyLTU3YjUtNDNhMS04ZDQwLWUwMjc5MmJjYzFkNCIsImlhdCI6MTc1NDI5OTcxOSwiZXhwIjoxNzU0Mzg2MTE5fQ.hEM2kgDh-Ru6PcACmvNmb_cEg4q7fl-5rbku5_uvhuM';
  
  try {
    console.log('🔒 Testing invalidated token on protected endpoint...');
    const response = await axios.get(
      'http://localhost:5000/api/agency/bookings',
      { headers: { 'Authorization': `Bearer ${agencyToken}` } }
    );
    console.log('❌ Token still works! Response:', response.data);
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Token invalidated! Agency cannot access protected endpoints');
      console.log('Response:', error.response.data);
      
      // Check if it has FORCE_LOGOUT action
      if (error.response.data.action === 'FORCE_LOGOUT') {
        console.log('🚀 Perfect! Frontend will receive FORCE_LOGOUT signal');
      }
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

testTokenInvalidation();
