const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing server connectivity...');
    const response = await axios.get('http://localhost:5001/api/departure-locations', { timeout: 3000 });
    console.log('✅ Server OK - got', response.data.count, 'departure locations');
    
    // Test auth
    const authTest = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'agency12@gmail.com', 
      password: '123456'
    }, { timeout: 3000 });
    console.log('✅ Auth OK - got token:', authTest.data.token ? 'YES' : 'NO');
    
  } catch (error) {
    console.log('❌ Error:', error.code || error.message);
  }
}

testServer();
