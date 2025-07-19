const http = require('http');

// Test tạo booking mới với original_price
async function testBookingCreation() {
  console.log('🧪 Testing booking creation with original_price...\n');
  
  try {
    // 1. Admin login để lấy token
    console.log('1️⃣ Admin login...');
    const loginData = JSON.stringify({
      email: 'admin12@gmail.com',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const loginResult = await makeRequest(loginOptions, loginData);
    
    if (loginResult.status !== 200 || !loginResult.data.token) {
      throw new Error('Login failed: ' + JSON.stringify(loginResult.data));
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login successful');
    
    // 2. Tạo booking test
    console.log('\n2️⃣ Creating test booking...');
    const bookingData = JSON.stringify({
      user_id: "cef03e0b-05a6-40b2-9119-eb15456d28db", // Admin user ID
      tour_id: "bd8f05b7-7b65-4b1a-8f6a-4a8f5c9d1e2f", // Sample tour ID
      departure_date_id: "sample-departure-id",
      total_price: 2500000,
      number_of_adults: 2,
      number_of_children: 1,
      status: "pending",
      guests: [
        {
          name: "Nguyễn Văn A",
          email: "test@gmail.com",
          phone: "0123456789",
          id_number: "123456789",
          birth_date: "1990-01-01",
          gender: "male"
        },
        {
          name: "Nguyễn Thị B",
          email: "",
          phone: "",
          id_number: "987654321",
          birth_date: "1992-05-15",
          gender: "female"
        },
        {
          name: "Nguyễn Văn C",
          email: "",
          phone: "",
          id_number: "456789123",
          birth_date: "2015-03-20",
          gender: "male"
        }
      ]
    });
    
    const bookingOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/bookings',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const bookingResult = await makeRequest(bookingOptions, bookingData);
    
    console.log('📋 Booking creation result:');
    console.log(`   Status: ${bookingResult.status}`);
    
    if (bookingResult.status === 201) {
      console.log('✅ Booking created successfully!');
      console.log(`   Booking ID: ${bookingResult.data.id}`);
      console.log(`   Original Price: ${bookingResult.data.original_price?.toLocaleString()} VNĐ`);
      console.log(`   Total Price: ${bookingResult.data.total_price?.toLocaleString()} VNĐ`);
      console.log(`   Discount: ${bookingResult.data.discount_amount?.toLocaleString()} VNĐ`);
      console.log(`   Status: ${bookingResult.data.status}`);
      console.log(`   Guests: ${bookingResult.data.InformationBookingTours?.length || 0} people`);
    } else {
      console.log('❌ Booking creation failed:');
      console.log('   Error:', bookingResult.data);
      
      // Kiểm tra xem có phải lỗi original_price không
      if (JSON.stringify(bookingResult.data).includes('original_price')) {
        console.log('   🔍 This appears to be the original_price validation error we\'re trying to fix');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    if (error.code) console.error('   Error code:', error.code);
  }
  
  console.log('\n🎯 Booking creation test completed!');
}

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

testBookingCreation();
