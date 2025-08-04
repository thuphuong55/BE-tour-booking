const axios = require('axios');

async function testFullCycle() {
  const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU0Mjk4MDY1LCJleHAiOjE3NTQzODQ0NjV9.snn2CaYCbp80OMLihQqbZBG0isutLa9PMsEhhPoEm4Q';
  const agencyId = '487ef622-57b5-43a1-8d40-e02792bcc1d4';
  const agencyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNkZGQ2ZDAzLWVjMjctNDM1NC05YTRlLTkwNGZhNDVhMDEzYiIsImVtYWlsIjoidGh1dGh1MDYwNDAzQGdtYWlsLmNvbSIsInJvbGUiOiJhZ2VuY3kiLCJhZ2VuY3lJZCI6IjQ4N2VmNjIyLTU3YjUtNDNhMS04ZDQwLWUwMjc5MmJjYzFkNCIsImlhdCI6MTc1NDI5OTk4OSwiZXhwIjoxNzU0Mzg2Mzg5fQ.40RWu_hcL-YISXND7x5VDkVauMmeo6WqXaE0Q7GVS4M';
  
  try {
    console.log('1️⃣ Unlock agency...');
    const unlockResp = await axios.put(
      `http://localhost:5000/api/agencies/toggle-lock/${agencyId}`,
      { action: 'unlock' },
      { headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Unlock result:', unlockResp.data.message);
    
    console.log('2️⃣ Test agency token works when unlocked...');
    try {
      const response = await axios.get(
        'http://localhost:5000/api/agency/bookings',
        { headers: { 'Authorization': `Bearer ${agencyToken}` } }
      );
      console.log('✅ Agency token works! Can access bookings');
    } catch (error) {
      console.log('❌ Agency token failed:', error.response?.data?.message);
    }
    
    console.log('3️⃣ Lock agency again...');
    const lockResp = await axios.put(
      `http://localhost:5000/api/agencies/toggle-lock/${agencyId}`,
      { action: 'lock' },
      { headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Lock result:', lockResp.data.message);
    
    console.log('4️⃣ Test agency token is blocked when locked...');
    try {
      const response = await axios.get(
        'http://localhost:5000/api/agency/bookings',
        { headers: { 'Authorization': `Bearer ${agencyToken}` } }
      );
      console.log('❌ Token still works! Security issue!');
    } catch (error) {
      if (error.response?.data?.action === 'FORCE_LOGOUT') {
        console.log('✅ Perfect! Token invalidated with FORCE_LOGOUT signal');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFullCycle();
