const http = require('http');

// Simple test without external dependencies
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testWithNativeHTTP() {
  console.log('🧪 Testing with native HTTP...\n');
  
  try {
    // Test login
    console.log('1️⃣ Testing admin login...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = JSON.stringify({
      email: 'admin12@gmail.com',
      password: 'admin123'
    });
    
    const loginResult = await makeRequest(loginOptions, loginData);
    
    if (loginResult.status === 200 && loginResult.data.token) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${loginResult.data.token.substring(0, 30)}...`);
      
      const token = loginResult.data.token;
      
      // Test dashboard
      console.log('\n2️⃣ Testing dashboard overview...');
      const dashOptions = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/dashboard/commissions/admin/overview?period=month',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const dashResult = await makeRequest(dashOptions);
      
      if (dashResult.status === 200) {
        console.log('✅ Dashboard API successful!');
        console.log(`   Success: ${dashResult.data.success}`);
        console.log(`   Total Bookings: ${dashResult.data.data?.overview?.total_bookings || 0}`);
        console.log(`   Total Revenue: ${(dashResult.data.data?.overview?.total_revenue || 0).toLocaleString()} VNĐ`);
        console.log(`   Admin Commission: ${(dashResult.data.data?.overview?.total_admin_commission || 0).toLocaleString()} VNĐ`);
        
        // Test pending
        console.log('\n3️⃣ Testing pending commissions...');
        const pendingOptions = {
          hostname: 'localhost',
          port: 5001,
          path: '/api/dashboard/commissions/admin/pending?limit=5',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const pendingResult = await makeRequest(pendingOptions);
        
        if (pendingResult.status === 200) {
          console.log('✅ Pending commissions API successful!');
          console.log(`   Pending Count: ${pendingResult.data.data?.pending_count || 0}`);
          console.log(`   Bookings: ${pendingResult.data.data?.bookings?.length || 0}`);
        } else {
          console.log('❌ Pending API failed:', pendingResult.status, pendingResult.data);
        }
        
      } else {
        console.log('❌ Dashboard API failed:', dashResult.status, dashResult.data);
      }
      
    } else {
      console.log('❌ Login failed:', loginResult.status, loginResult.data);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message || error.toString() || error);
    if (error.code) console.error('   Error code:', error.code);
    if (error.errno) console.error('   Error number:', error.errno);
    if (error.syscall) console.error('   Syscall:', error.syscall);
  }
  
  console.log('\n🎉 Native HTTP test completed!');
}

testWithNativeHTTP();
