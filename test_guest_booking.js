const fetch = require('node-fetch');

async function testGuestBooking() {
  try {
    console.log('🧪 Testing guest booking endpoint...');
    
    // Test data for guest booking
    const bookingData = {
      tour_id: "tour-test-id", // Replace with actual tour ID
      departure_date_id: "departure-test-id", // Replace with actual departure ID
      total_price: 2900000,
      number_of_adults: 2,
      number_of_children: 0,
      guests: [
        {
          name: "Test Guest User",
          email: "testguest@example.com",
          phone: "0123456789",
          cccd: "089303009999"
        }
      ]
    };

    const response = await fetch('http://localhost:5001/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Không có Authorization header = guest booking
      },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📝 Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Guest booking test PASSED');
    } else {
      console.log('❌ Guest booking test FAILED');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test guest-id endpoint first
async function testGuestIdEndpoint() {
  try {
    console.log('🧪 Testing guest-id endpoint...');
    
    const response = await fetch('http://localhost:5001/api/users/guest-id');
    const result = await response.json();
    
    console.log('📊 Guest ID Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Guest ID endpoint working');
      return result.data.guest_user_id;
    } else {
      console.log('❌ Guest ID endpoint failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Guest ID test error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Guest Booking Tests\n');
  
  // Test 1: Guest ID endpoint
  const guestId = await testGuestIdEndpoint();
  console.log('\n');
  
  // Test 2: Guest booking (simplified - will fail due to invalid tour/departure IDs)
  await testGuestBooking();
  
  console.log('\n🏁 Tests completed');
}

runTests();
