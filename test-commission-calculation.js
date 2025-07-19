const http = require('http');

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

async function testCommissionCalculation() {
  console.log('🧮 Testing Commission Calculation...\n');
  
  try {
    // 1. Admin login
    console.log('1️⃣ Admin login...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const loginResult = await makeRequest(loginOptions, JSON.stringify({
      email: 'admin12@gmail.com',
      password: 'admin123'
    }));
    
    if (loginResult.status !== 200 || !loginResult.data.token) {
      throw new Error('Login failed');
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login OK');
    
    // 2. Get booking list to work with
    console.log('\n2️⃣ Getting existing bookings...');
    const bookingOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/dashboard/commissions/admin/pending?limit=10',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    
    const bookingResult = await makeRequest(bookingOptions);
    
    if (bookingResult.status !== 200) {
      throw new Error('Failed to get bookings');
    }
    
    const bookings = bookingResult.data.data?.bookings || [];
    console.log(`✅ Found ${bookings.length} bookings`);
    
    if (bookings.length === 0) {
      console.log('⚠️ No bookings found to test commission calculation');
      return;
    }
    
    // 3. Test manual commission calculation
    console.log('\n3️⃣ Testing commission calculation for first booking...');
    const firstBooking = bookings[0];
    console.log(`   Booking ID: ${firstBooking.id_booking || firstBooking.id}`);
    console.log(`   Total Amount: ${(firstBooking.total_amount || firstBooking.price || 0).toLocaleString()} VNĐ`);
    console.log(`   Current Commission Rate: ${firstBooking.commission_rate || 'Not set'}%`);
    console.log(`   Admin Commission: ${(firstBooking.admin_commission || 0).toLocaleString()} VNĐ`);
    console.log(`   Agency Amount: ${(firstBooking.agency_amount || 0).toLocaleString()} VNĐ`);
    
    // 4. Test commission service endpoint
    console.log('\n4️⃣ Testing commission service endpoint...');
    const commissionOptions = {
      hostname: 'localhost',
      port: 5001,
      path: `/api/admin/commissions/calculate/${firstBooking.id_booking || firstBooking.id}`,
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const commissionData = JSON.stringify({
      force: true
    });
    
    const commissionResult = await makeRequest(commissionOptions, commissionData);
    
    if (commissionResult.status === 200) {
      console.log('✅ Commission calculation successful!');
      console.log(`   Success: ${commissionResult.data.success}`);
      const calc = commissionResult.data.data;
      if (calc) {
        console.log(`   Commission Rate: ${calc.commission_rate}%`);
        console.log(`   Admin Commission: ${(calc.admin_commission || 0).toLocaleString()} VNĐ`);
        console.log(`   Agency Amount: ${(calc.agency_amount || 0).toLocaleString()} VNĐ`);
        console.log(`   Total Amount: ${(calc.total_amount || 0).toLocaleString()} VNĐ`);
      }
    } else {
      console.log('❌ Commission calculation failed:', commissionResult.status, commissionResult.data);
    }
    
    // 5. Get updated dashboard overview
    console.log('\n5️⃣ Getting updated dashboard overview...');
    const overviewOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/dashboard/commissions/admin/overview?period=month',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    
    const overviewResult = await makeRequest(overviewOptions);
    
    if (overviewResult.status === 200) {
      console.log('✅ Updated overview retrieved!');
      const overview = overviewResult.data.data?.overview;
      if (overview) {
        console.log(`   Total Bookings: ${overview.total_bookings || 0}`);
        console.log(`   Total Revenue: ${(overview.total_revenue || 0).toLocaleString()} VNĐ`);
        console.log(`   Admin Commission: ${(overview.total_admin_commission || 0).toLocaleString()} VNĐ`);
        console.log(`   Agency Commission: ${(overview.total_agency_commission || 0).toLocaleString()} VNĐ`);
        console.log(`   Commission Rate: ${overview.avg_commission_rate || 0}%`);
        
        // Chart data
        if (overview.chart_data && overview.chart_data.length > 0) {
          console.log(`   Chart Months: ${overview.chart_data.length} data points`);
          console.log(`   Latest Month: ${overview.chart_data[overview.chart_data.length - 1]?.month || 'N/A'}`);
          console.log(`   Latest Revenue: ${(overview.chart_data[overview.chart_data.length - 1]?.revenue || 0).toLocaleString()} VNĐ`);
        }
      }
    } else {
      console.log('❌ Overview failed:', overviewResult.status, overviewResult.data);
    }
    
    // 6. Test commission history
    console.log('\n6️⃣ Testing commission history...');
    const historyOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/dashboard/commissions/admin/history?limit=5&sort=desc',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    
    const historyResult = await makeRequest(historyOptions);
    
    if (historyResult.status === 200) {
      console.log('✅ Commission history retrieved!');
      const history = historyResult.data.data;
      console.log(`   Total Records: ${history?.total || 0}`);
      console.log(`   Records Shown: ${history?.bookings?.length || 0}`);
      
      if (history?.bookings && history.bookings.length > 0) {
        console.log('\n   Recent Commission Records:');
        history.bookings.slice(0, 3).forEach((booking, index) => {
          console.log(`   ${index + 1}. Booking #${booking.id_booking || booking.id}`);
          console.log(`      Amount: ${(booking.total_amount || 0).toLocaleString()} VNĐ`);
          console.log(`      Admin: ${(booking.admin_commission || 0).toLocaleString()} VNĐ`);
          console.log(`      Agency: ${(booking.agency_amount || 0).toLocaleString()} VNĐ`);
          console.log(`      Rate: ${booking.commission_rate || 0}%`);
        });
      }
    } else {
      console.log('❌ History failed:', historyResult.status, historyResult.data);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message || error.toString());
    if (error.code) console.error('   Error code:', error.code);
  }
  
  console.log('\n🎯 Commission calculation test completed!');
}

testCommissionCalculation();
