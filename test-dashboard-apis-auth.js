// Test Dashboard Commission APIs with real authentication
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001';

async function testDashboardAPIs() {
  console.log('🧪 Testing Dashboard Commission APIs...\n');

  try {
    // 1. Test without authentication (should fail)
    console.log('1️⃣ Testing without authentication...');
    const noAuthResponse = await fetch(`${BASE_URL}/api/dashboard/commissions/admin/overview`);
    const noAuthResult = await noAuthResponse.json();
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
      console.log(`   Status: ${noAuthResponse.status}`);
      console.log(`   Message: ${noAuthResult.message}\n`);
    } else {
      console.log('❌ Should have rejected unauthorized request\n');
    }

    // 2. Test with fake token (should fail)
    console.log('2️⃣ Testing with fake token...');
    const fakeTokenResponse = await fetch(`${BASE_URL}/api/dashboard/commissions/admin/overview`, {
      headers: { 'Authorization': 'Bearer fake-token' }
    });
    const fakeTokenResult = await fakeTokenResponse.json();
    
    if (fakeTokenResponse.status === 401) {
      console.log('✅ Correctly rejected fake token');
      console.log(`   Status: ${fakeTokenResponse.status}`);
      console.log(`   Message: ${fakeTokenResult.message}\n`);
    } else {
      console.log('❌ Should have rejected fake token\n');
    }

    // 3. Get real admin token
    console.log('3️⃣ Attempting to get admin token...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123' // Thử password phổ biến
      })
    });
    
    if (loginResponse.status === 200) {
      const loginResult = await loginResponse.json();
      const adminToken = loginResult.token;
      console.log('✅ Successfully logged in as admin');
      console.log(`   Token: ${adminToken.substring(0, 20)}...`);
      
      // 4. Test admin dashboard overview
      console.log('\n4️⃣ Testing admin dashboard overview...');
      const overviewResponse = await fetch(`${BASE_URL}/api/dashboard/commissions/admin/overview?period=month`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (overviewResponse.status === 200) {
        const overviewData = await overviewResponse.json();
        console.log('✅ Admin overview API successful!');
        console.log(`   Success: ${overviewData.success}`);
        console.log(`   Total Bookings: ${overviewData.data?.overview?.total_bookings || 0}`);
        console.log(`   Total Revenue: ${overviewData.data?.overview?.total_revenue?.toLocaleString() || 0} VNĐ`);
        console.log(`   Admin Commission: ${overviewData.data?.overview?.total_admin_commission?.toLocaleString() || 0} VNĐ`);
      } else {
        const errorData = await overviewResponse.json();
        console.log('❌ Admin overview API failed');
        console.log(`   Status: ${overviewResponse.status}`);
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      }

      // 5. Test pending commissions
      console.log('\n5️⃣ Testing pending commissions...');
      const pendingResponse = await fetch(`${BASE_URL}/api/dashboard/commissions/admin/pending?limit=5`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (pendingResponse.status === 200) {
        const pendingData = await pendingResponse.json();
        console.log('✅ Pending commissions API successful!');
        console.log(`   Success: ${pendingData.success}`);
        console.log(`   Pending Count: ${pendingData.data?.pending_count || 0}`);
        console.log(`   Bookings Returned: ${pendingData.data?.bookings?.length || 0}`);
      } else {
        const errorData = await pendingResponse.json();
        console.log('❌ Pending commissions API failed');
        console.log(`   Status: ${pendingResponse.status}`);
        console.log(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      }
      
    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Failed to login as admin');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Error: ${JSON.stringify(loginError, null, 2)}`);
      console.log('\n💡 Try different admin credentials in the login attempt');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 Dashboard API testing completed!');
}

testDashboardAPIs();
