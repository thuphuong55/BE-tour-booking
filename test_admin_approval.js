const axios = require('axios');

async function testAdminTourApproval() {
  try {
    console.log('🧪 Testing Admin Tour Approval Endpoint');
    
    // Test 1: Check if the endpoint responds (even without auth)
    const tourId = 'aa291292-e341-4fff-a58a-7eac340287e7';
    const url = `http://localhost:5000/api/admin/tours/${tourId}/approve`;
    
    console.log('📍 Testing endpoint:', url);
    
    try {
      const response = await axios.put(url, {
        reason: 'Test approval'
      });
      
      console.log('✅ Endpoint is accessible');
      console.log('Response:', response.data);
      
    } catch (error) {
      if (error.response) {
        console.log('📊 Endpoint responds with status:', error.response.status);
        console.log('📝 Response:', error.response.data);
        
        if (error.response.status === 401) {
          console.log('✅ Endpoint exists but requires authentication (expected)');
        } else if (error.response.status === 404) {
          console.log('❌ Endpoint not found - check route registration');
        } else {
          console.log('⚠️ Unexpected status code');
        }
      } else {
        console.log('❌ Cannot connect to server:', error.message);
        console.log('💡 Make sure server is running with: node server.js');
      }
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Test with both PUT and PATCH methods
async function testBothMethods() {
  const tourId = 'aa291292-e341-4fff-a58a-7eac340287e7';
  const baseUrl = `http://localhost:5000/api/admin/tours/${tourId}/approve`;
  
  console.log('\n🔄 Testing both HTTP methods:');
  
  // Test PUT
  try {
    await axios.put(baseUrl, { reason: 'Test PUT' });
  } catch (error) {
    console.log('PUT /approve:', error.response?.status || 'Connection failed');
  }
  
  // Test PATCH  
  try {
    await axios.patch(baseUrl, { reason: 'Test PATCH' });
  } catch (error) {
    console.log('PATCH /approve:', error.response?.status || 'Connection failed');
  }
}

if (require.main === module) {
  console.log('🚀 Starting Admin Tour Approval Tests\n');
  testAdminTourApproval().then(() => {
    return testBothMethods();
  }).then(() => {
    console.log('\n✅ Test completed!');
  });
}

module.exports = { testAdminTourApproval, testBothMethods };
