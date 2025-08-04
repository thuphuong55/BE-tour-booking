const axios = require('axios');

async function testToggleLock() {
  const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU0Mjk4MDY1LCJleHAiOjE3NTQzODQ0NjV9.snn2CaYCbp80OMLihQqbZBG0isutLa9PMsEhhPoEm4Q';
  const agencyId = '487ef622-57b5-43a1-8d40-e02792bcc1d4';
  
  try {
    console.log('1️⃣ Unlock agency...');
    const unlockResp = await axios.put(
      `http://localhost:5000/api/agencies/toggle-lock/${agencyId}`,
      { action: 'unlock' },
      { headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Unlock result:', unlockResp.data.message);
    
    console.log('2️⃣ Lock agency again (will invalidate tokens)...');
    const lockResp = await axios.put(
      `http://localhost:5000/api/agencies/toggle-lock/${agencyId}`,
      { action: 'lock' },
      { headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Lock result:', lockResp.data.message);
    console.log('🔑 Tokens should now be invalidated');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testToggleLock();
