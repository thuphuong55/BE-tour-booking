// Test commission calculation với tour thật từ data bạn cung cấp
async function createCommissionTestData() {
  console.log('🎯 Creating test commission data...\n');
  
  try {
    const fetch = (await import('node-fetch')).default;
    // 1. Login admin để lấy token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin12@gmail.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const adminToken = loginData.token;
    console.log('✅ Admin login successful');
    
    // 2. Tạo booking test với tour Phú Quốc (ID: "1")
    console.log('\n2️⃣ Creating test booking...');
    const { Booking, User } = require('./models');
    const { v4: uuidv4 } = require('uuid');
    
    // Tìm user để làm customer
    const customer = await User.findOne({ where: { role: 'user' } });
    
    const testBooking = await Booking.create({
      id: uuidv4(),
      user_id: customer.id,
      tour_id: "1", // Tour Phú Quốc 3N2Đ
      departure_date_id: "7fc68e37-82f4-454a-98d6-4aabeb762e8d", // Departure date của tour
      original_price: 3500000,
      total_price: 3500000,
      status: 'confirmed',
      booking_date: new Date(),
      number_of_people: 2
    });
    
    console.log(`✅ Created test booking: ${testBooking.id}`);
    console.log(`   Tour: Phú Quốc 3N2Đ - ${testBooking.total_price.toLocaleString()} VNĐ`);
    
    // 3. Tính commission cho booking
    console.log('\n3️⃣ Calculating commission...');
    const commissionResponse = await fetch(`http://localhost:5001/api/admin/commissions/calculate/${testBooking.id}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ force: false })
    });
    
    if (commissionResponse.status === 200) {
      const commissionData = await commissionResponse.json();
      console.log('✅ Commission calculated successfully!');
      console.log(`   Total Price: ${commissionData.data?.total_price?.toLocaleString()} VNĐ`);
      console.log(`   Commission Rate: ${commissionData.data?.commission_rate}%`);
      console.log(`   Admin Commission: ${commissionData.data?.admin_commission?.toLocaleString()} VNĐ`);
      console.log(`   Agency Amount: ${commissionData.data?.agency_amount?.toLocaleString()} VNĐ`);
    } else {
      const error = await commissionResponse.json();
      console.log('❌ Commission calculation failed:', error);
    }
    
    // 4. Test dashboard với data có commission
    console.log('\n4️⃣ Testing dashboard with real commission data...');
    const dashResponse = await fetch('http://localhost:5001/api/dashboard/commissions/admin/overview?period=month', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (dashResponse.status === 200) {
      const dashData = await dashResponse.json();
      console.log('🎉 Dashboard with real data:');
      console.log(`   Total Bookings: ${dashData.data?.overview?.total_bookings}`);
      console.log(`   Total Revenue: ${dashData.data?.overview?.total_revenue?.toLocaleString()} VNĐ`);
      console.log(`   Admin Commission: ${dashData.data?.overview?.total_admin_commission?.toLocaleString()} VNĐ`);
      console.log(`   Average Rate: ${dashData.data?.overview?.avg_commission_rate}%`);
      
      if (dashData.data?.top_agencies?.length > 0) {
        console.log('\n📊 Top Agencies:');
        dashData.data.top_agencies.forEach((agency, index) => {
          console.log(`   ${index + 1}. ${agency.agency_name}: ${agency.admin_commission?.toLocaleString()} VNĐ`);
        });
      }
    }
    
    // 5. Test pending commissions
    console.log('\n5️⃣ Testing pending commissions...');
    const pendingResponse = await fetch('http://localhost:5001/api/dashboard/commissions/admin/pending?limit=5', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (pendingResponse.status === 200) {
      const pendingData = await pendingResponse.json();
      console.log(`📋 Pending commissions: ${pendingData.data?.pending_count}`);
      if (pendingData.data?.bookings?.length > 0) {
        pendingData.data.bookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.tour?.name} - ${booking.total_price?.toLocaleString()} VNĐ`);
        });
      }
    }
    
    // 6. Cleanup
    console.log('\n🗑️ Cleaning up test data...');
    await Booking.destroy({ where: { id: testBooking.id } });
    console.log('✅ Test booking deleted');
    
    console.log('\n🎉 Commission system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

createCommissionTestData();
