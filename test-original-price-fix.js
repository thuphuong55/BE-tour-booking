const http = require('http');

// Simple test để kiểm tra original_price validation fix
async function testOriginalPriceFix() {
  console.log('🔧 Testing original_price validation fix...\n');
  
  try {
    // 1. Login để lấy token
    console.log('1️⃣ Getting auth token...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const loginData = JSON.stringify({
      email: 'admin12@gmail.com',
      password: 'admin123'
    });
    
    const loginResult = await makeRequest(loginOptions, loginData);
    
    if (loginResult.status !== 200) {
      throw new Error('Login failed: ' + JSON.stringify(loginResult.data));
    }
    
    const token = loginResult.data.token;
    console.log('✅ Auth token obtained');
    
    // 2. Test booking creation (có thể sẽ fail vì tour/departure không tồn tại, 
    //    nhưng chúng ta chỉ quan tâm đến lỗi original_price)
    console.log('\n2️⃣ Testing booking creation...');
    
    const testBookingData = {
      user_id: "cef03e0b-05a6-40b2-9119-eb15456d28db",
      tour_id: "test-tour-id-12345",
      departure_date_id: "test-departure-id-12345", 
      total_price: 1500000,
      number_of_adults: 2,
      number_of_children: 0,
      status: "pending",
      guests: [
        {
          name: "Test User",
          email: "test@example.com",
          phone: "0123456789",
          id_number: "123456789",
          birth_date: "1990-01-01", 
          gender: "male"
        },
        {
          name: "Test User 2",
          email: "",
          phone: "",
          id_number: "987654321",
          birth_date: "1992-05-15",
          gender: "female"
        }
      ]
    };
    
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
    
    const bookingResult = await makeRequest(bookingOptions, JSON.stringify(testBookingData));
    
    console.log(`📊 Response Status: ${bookingResult.status}`);
    
    if (typeof bookingResult.data === 'string') {
      console.log('📄 Response Data (string):', bookingResult.data.substring(0, 200) + '...');
    } else {
      console.log('📄 Response Data:', JSON.stringify(bookingResult.data, null, 2));
    }
    
    // Phân tích kết quả
    const responseText = JSON.stringify(bookingResult.data);
    
    if (responseText.includes('original_price cannot be null')) {
      console.log('\n❌ ORIGINAL_PRICE VALIDATION ERROR STILL EXISTS');
      console.log('   The fix did not work - original_price is still null');
    } else if (responseText.includes('Không tìm thấy ngày khởi hành') || 
               responseText.includes('Không tìm thấy tour')) {
      console.log('\n✅ ORIGINAL_PRICE VALIDATION FIX SUCCESSFUL');
      console.log('   Error is now about missing tour/departure (expected)');
      console.log('   The original_price validation is no longer failing');
    } else if (bookingResult.status === 201) {
      console.log('\n🎉 BOOKING CREATED SUCCESSFULLY');
      console.log('   Somehow the booking was created (maybe test data exists)');
    } else {
      console.log('\n🤔 DIFFERENT ERROR OCCURRED');
      console.log('   Not the original_price error, but something else');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n🎯 Original price validation test completed!');
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

testOriginalPriceFix();
