const testAPI = async () => {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test 1: Login
    console.log('1️⃣ Testing admin login...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log(`   Admin: ${loginData.user?.email} (${loginData.user?.role})`);
      
      const token = loginData.token;
      
      // Test 2: Dashboard Overview
      console.log('\n2️⃣ Testing dashboard overview...');
      const dashResponse = await fetch('http://localhost:5001/api/dashboard/commissions/admin/overview?period=month', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (dashResponse.status === 200) {
        const dashData = await dashResponse.json();
        console.log('✅ Dashboard overview successful!');
        console.log(`   Total Bookings: ${dashData.data?.overview?.total_bookings || 0}`);
        console.log(`   Total Revenue: ${dashData.data?.overview?.total_revenue?.toLocaleString() || 0} VNĐ`);
        console.log(`   Admin Commission: ${dashData.data?.overview?.total_admin_commission?.toLocaleString() || 0} VNĐ`);
        console.log(`   Top Agencies: ${dashData.data?.top_agencies?.length || 0} agencies`);
      } else {
        const dashError = await dashResponse.json();
        console.log('❌ Dashboard failed:', dashResponse.status);
        console.log('   Error:', dashError);
      }
      
      // Test 3: Pending Commissions
      console.log('\n3️⃣ Testing pending commissions...');
      const pendingResponse = await fetch('http://localhost:5001/api/dashboard/commissions/admin/pending?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (pendingResponse.status === 200) {
        const pendingData = await pendingResponse.json();
        console.log('✅ Pending commissions successful!');
        console.log(`   Pending Count: ${pendingData.data?.pending_count || 0}`);
        console.log(`   Bookings Returned: ${pendingData.data?.bookings?.length || 0}`);
      } else {
        const pendingError = await pendingResponse.json();
        console.log('❌ Pending commissions failed:', pendingResponse.status);
        console.log('   Error:', pendingError);
      }
      
    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Login failed:', loginResponse.status);
      console.log('   Error:', loginError);
      
      console.log('\n🔄 Trying existing admin credentials...');
      const passwords = ['123456', 'admin123', 'password', 'admin', 'admin12'];
      
      for (const password of passwords) {
        console.log(`   Trying: admin12@gmail.com with password "${password}"`);
        const tryResponse = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin12@gmail.com',
            password: password
          })
        });
        
        if (tryResponse.status === 200) {
          const tryData = await tryResponse.json();
          console.log('✅ Found working credentials!');
          console.log(`   Admin: ${tryData.user?.email}`);
          
          const token = tryData.token;
          
          // Test dashboard with working token
          console.log('\n🎯 Testing dashboard with valid token...');
          const dashResponse = await fetch('http://localhost:5001/api/dashboard/commissions/admin/overview?period=month', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (dashResponse.status === 200) {
            const dashData = await dashResponse.json();
            console.log('🎉 Dashboard API working perfectly!');
            console.log(`   Success: ${dashData.success}`);
            if (dashData.data?.overview) {
              console.log(`   Total Bookings: ${dashData.data.overview.total_bookings}`);
              console.log(`   Total Revenue: ${dashData.data.overview.total_revenue?.toLocaleString()} VNĐ`);
              console.log(`   Admin Commission: ${dashData.data.overview.total_admin_commission?.toLocaleString()} VNĐ`);
            }
          } else {
            const dashError = await dashResponse.json();
            console.log('❌ Dashboard failed but login worked:', dashError);
          }
          
          return; // Exit if successful
        } else {
          console.log(`   ❌ Failed with ${password}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testAPI();
