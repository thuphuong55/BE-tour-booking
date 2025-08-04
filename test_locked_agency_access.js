const axios = require('axios');

async function testLockedAgencyAccess() {
  try {
    console.log('🧪 Testing locked agency access...');
    
    // Đây là token của agency có user_id = cddd6d03-ec27-4354-9a4e-904fa45a013b
    // User này đã bị set status = 'inactive'
    const lockedAgencyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNkZGQ2ZDAzLWVjMjctNDM1NC05YTRlLTkwNGZhNDVhMDEzYiIsImVtYWlsIjoidGh1dGh1MDYwNDAzQGdtYWlsLmNvbSIsInJvbGUiOiJhZ2VuY3kiLCJpYXQiOjE3NTQyOTg2MDcsImV4cCI6MTc1NDM4NTAwN30.kpPlCap_JU54p3UnxVRk_EY9HScZYL4ggvBxWSkGiZk';
    
    // Test multiple endpoints
    const endpoints = [
      '/api/agency/bookings',
      '/api/departure-dates', 
      '/api/tours'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint}...`);
      try {
        const response = await axios.get(
          `http://localhost:5000${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${lockedAgencyToken}`
            }
          }
        );
        
        console.log(`❌ PROBLEM: ${endpoint} allowed access!`);
        console.log('Status:', response.status);
        
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`✅ GOOD: ${endpoint} denied access`);
          console.log('Message:', error.response.data.message);
        } else {
          console.log(`⚠️  Unexpected response from ${endpoint}:`);
          console.log('Status:', error.response?.status);
          console.log('Message:', error.response?.data?.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testLockedAgencyAccess();
