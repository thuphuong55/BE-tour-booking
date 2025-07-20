const axios = require('axios');

async function checkBackendServer() {
  try {
    console.log('=== CHECKING BACKEND SERVER ===');
    
    // Test 1: Check if backend is responding on different possible ports
    const ports = [3000, 3001, 5000, 8000];
    
    for (const port of ports) {
      try {
        console.log(`\nTesting port ${port}...`);
        const healthResponse = await axios.get(`http://localhost:${port}/health`, {
          timeout: 2000
        });
        console.log(`✅ Port ${port} - Health check successful:`, healthResponse.data);
      } catch (error) {
        console.log(`❌ Port ${port} - Failed:`, error.message);
      }
    }
    
    // Test 2: Try different base URLs
    const baseUrls = [
      'http://localhost:3000/api',
      'http://localhost:3001/api', 
      'http://localhost:5000/api',
      'http://localhost:8000/api'
    ];
    
    for (const baseUrl of baseUrls) {
      try {
        console.log(`\nTesting ${baseUrl}/tours...`);
        const response = await axios.get(`${baseUrl}/tours`, {
          timeout: 2000
        });
        console.log(`✅ ${baseUrl} - API responding, tours count:`, response.data.length || 'Unknown');
      } catch (error) {
        if (error.response) {
          console.log(`⚠️  ${baseUrl} - Server responded with:`, error.response.status);
        } else {
          console.log(`❌ ${baseUrl} - Connection failed:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Chạy test
checkBackendServer();
