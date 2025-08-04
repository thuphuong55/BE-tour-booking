const axios = require('axios');

// Test authentication and permission system
async function testAgencyPermissions() {
  console.log('🧪 Testing Agency Permission System...\n');

  // Agency credentials
  const agencies = [
    {
      id: 'd3a463c7-fa0f-486c-8b89-8429c5640186',
      name: 'Agency 1',
      // You need to provide the actual login credentials for this agency
      email: 'tranthingoctuyen.3393@gmail.com', // Placeholder
      password: 'password123' // Placeholder - replace with actual
    },
    {
      id: '855ff6be-bed7-497c-84e0-4230faa2c61a', 
      name: 'Agency 2',
      // You need to provide the actual login credentials for this agency
      email: 'agency2@example.com', // Placeholder  
      password: 'password123' // Placeholder - replace with actual
    }
  ];

  for (const agency of agencies) {
    console.log(`\n🏢 Testing ${agency.name} (${agency.id})`);
    console.log('=' .repeat(60));
    
    try {
      // 1. Login to get token
      console.log('1️⃣ Logging in...');
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: agency.email,
        password: agency.password
      });
      
      const token = loginResponse.data.token;
      const headers = { 'Authorization': `Bearer ${token}` };
      console.log('✅ Login successful, token received');

      // 2. Test departure dates
      console.log('2️⃣ Fetching departure dates...');
      try {
        const departureResponse = await axios.get('http://localhost:5000/api/departure-dates', { headers });
        console.log(`✅ Departure dates count: ${departureResponse.data.length}`);
        if (departureResponse.data.length > 0) {
          console.log(`   First departure date tour_id: ${departureResponse.data[0].tour_id}`);
        }
      } catch (error) {
        console.log(`❌ Departure dates error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

      // 3. Test itineraries
      console.log('3️⃣ Fetching itineraries...');
      try {
        const itineraryResponse = await axios.get('http://localhost:5000/api/itineraries', { headers });
        console.log(`✅ Itineraries count: ${itineraryResponse.data.length}`);
        if (itineraryResponse.data.length > 0) {
          console.log(`   First itinerary tour_id: ${itineraryResponse.data[0].tour_id}`);
        }
      } catch (error) {
        console.log(`❌ Itineraries error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

      // 4. Test tours
      console.log('4️⃣ Fetching tours...');
      try {
        const tourResponse = await axios.get('http://localhost:5000/api/tours', { headers });
        console.log(`✅ Tours count: ${tourResponse.data.length}`);
        if (tourResponse.data.length > 0) {
          console.log(`   First tour agency_id: ${tourResponse.data[0].agency_id}`);
        }
      } catch (error) {
        console.log(`❌ Tours error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }

    } catch (error) {
      console.log(`❌ ${agency.name} login failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n🏁 Test completed!');
  console.log('\n📝 Expected behavior:');
  console.log('   - Different agencies should see different data');
  console.log('   - Each agency should only see their own tours, departure dates, and itineraries');
  console.log('   - If both agencies see the same data, there is still a permission issue');
}

// Run the test
testAgencyPermissions().catch(console.error);
