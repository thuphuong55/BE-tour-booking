const axios = require('axios');

// Test data với destination_id và location_id
const tourDataWithIDs = {
  "name": "Tour Vịnh Hạ Long Premium",
  "description": "Khám phá Vịnh Hạ Long với destination_id và location_id",
  "destination_id": "destination-uuid-here", // Will auto-populate destination name
  "location_id": "location-uuid-here",       // Will auto-populate location name 
  "departure_location": "Hà Nội",
  "price": 2800000,
  "tour_type": "Trong nước",
  "max_participants": 25,
  "min_participants": 2,
  "images": [
    { "image_url": "https://example.com/halong-premium.jpg", "is_main": true }
  ],
  "departureDates": [
    {
      "departure_date": "2025-09-01",
      "end_date": "2025-09-03",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  "category_ids": [1],
  "hotel_ids": [1]
};

const tourDataTraditional = {
  "name": "Tour Sapa Traditional",
  "description": "Sử dụng text trực tiếp cho destination và location",
  "destination": "Thị trấn Sapa",      // Traditional text input
  "location": "Lào Cai",              // Traditional text input
  "departure_location": "Hà Nội",
  "price": 1600000,
  "tour_type": "Trong nước",
  "max_participants": 20,
  "min_participants": 2,
  "category_ids": [2]
};

async function testDestinationLocationEndpoints() {
  console.log('=== TEST DESTINATION & LOCATION ENDPOINTS ===\n');

  // Test 1: Lấy tất cả destinations
  console.log('🧪 Test 1: GET /api/destination-location/destinations');
  try {
    const response = await axios.get('http://localhost:5001/api/destination-location/destinations');
    console.log('✅ Destinations loaded successfully');
    console.log('Total destinations:', response.data.total);
    console.log('Sample destinations:', response.data.data.slice(0, 3));
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Lấy tất cả locations
  console.log('🧪 Test 2: GET /api/destination-location/locations');
  try {
    const response = await axios.get('http://localhost:5001/api/destination-location/locations');
    console.log('✅ Locations loaded successfully');
    console.log('Total locations:', response.data.total);
    console.log('Sample locations:', response.data.data.slice(0, 3));
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Tìm kiếm destinations
  console.log('🧪 Test 3: Search destinations');
  try {
    const response = await axios.get('http://localhost:5001/api/destination-location/destinations/search?q=hạ long');
    console.log('✅ Destination search successful');
    console.log('Found:', response.data.total, 'destinations');
    console.log('Results:', response.data.data);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Tìm kiếm locations
  console.log('🧪 Test 4: Search locations');
  try {
    const response = await axios.get('http://localhost:5001/api/destination-location/locations/search?q=sapa');
    console.log('✅ Location search successful');
    console.log('Found:', response.data.total, 'locations');
    console.log('Results:', response.data.data);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
}

async function testTourCreationWithIDs() {
  console.log('\n' + '='.repeat(60));
  console.log('=== TEST TOUR CREATION WITH DESTINATION/LOCATION IDs ===');
  console.log('='.repeat(60) + '\n');

  // Test 5: Tạo tour với destination_id và location_id (Agency)
  console.log('🧪 Test 5: Agency creates tour with destination_id & location_id');
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      tourDataWithIDs,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Tour created with IDs successfully');
    console.log('Tour ID:', response.data.id);
    console.log('Auto-populated destination:', response.data.destination);
    console.log('Auto-populated location:', response.data.location);
    console.log('Status:', response.data.status);
    
    return response.data.id; // Return for update test
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testTourCreationTraditional() {
  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Tạo tour với text trực tiếp (traditional)
  console.log('🧪 Test 6: Agency creates tour with traditional text fields');
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      tourDataTraditional,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Traditional tour created successfully');
    console.log('Tour ID:', response.data.id);
    console.log('Destination (text):', response.data.destination);
    console.log('Location (text):', response.data.location);
    
    return response.data.id;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testTourUpdate(tourId) {
  if (!tourId) {
    console.log('⏩ Skipping update test - no tour ID available');
    return;
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 7: Cập nhật tour với IDs mới
  console.log('🧪 Test 7: Update tour with new destination_id & location_id');
  try {
    const updateData = {
      name: "Tour Vịnh Hạ Long Premium (Updated)",
      destination_id: "new-destination-uuid",
      location_id: "new-location-uuid",
      price: 3000000
    };

    const response = await axios.put(`http://localhost:5001/api/tours/${tourId}`, 
      updateData,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Tour updated successfully');
    console.log('Updated destination:', response.data.destination);
    console.log('Updated location:', response.data.location);
    console.log('Updated price:', response.data.price);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE DESTINATION/LOCATION TESTS\n');
  
  // Test endpoints first
  await testDestinationLocationEndpoints();
  
  // Test tour creation with IDs
  const tourId = await testTourCreationWithIDs();
  
  // Test traditional tour creation
  await testTourCreationTraditional();
  
  // Test tour update
  await testTourUpdate(tourId);
}

function showAPIDocumentation() {
  console.log('\n' + '='.repeat(70));
  console.log('📚 DESTINATION & LOCATION API DOCUMENTATION');
  console.log('='.repeat(70));
  
  console.log('\n🔍 GET DESTINATIONS & LOCATIONS:');
  console.log('GET /api/destination-location/destinations         - Lấy tất cả destinations');
  console.log('GET /api/destination-location/locations            - Lấy tất cả locations');
  console.log('GET /api/destination-location/destinations/search  - Tìm kiếm destinations');
  console.log('GET /api/destination-location/locations/search     - Tìm kiếm locations');
  
  console.log('\n📝 TOUR CREATION OPTIONS:');
  console.log('\n1️⃣ OPTION 1: Using IDs (Auto-populate names)');
  console.log(JSON.stringify({
    name: "Tour Name",
    destination_id: "uuid-from-destinations-api",
    location_id: "uuid-from-locations-api",
    // destination & location names will be auto-populated
  }, null, 2));
  
  console.log('\n2️⃣ OPTION 2: Traditional text fields');
  console.log(JSON.stringify({
    name: "Tour Name", 
    destination: "Destination Name (text)",
    location: "Location Name (text)"
  }, null, 2));
  
  console.log('\n✅ BENEFITS OF USING IDs:');
  console.log('- Consistent naming across tours');
  console.log('- Auto-validation (ID must exist)');
  console.log('- Easier for dropdowns/selects in frontend');
  console.log('- Database referential integrity');
  
  console.log('\n📋 RESPONSE EXAMPLES:');
  console.log('\nDestinations API Response:');
  console.log(JSON.stringify({
    success: true,
    data: [
      {
        id: "dest-uuid",
        name: "Vịnh Hạ Long",
        location_id: "loc-uuid",
        image: "url",
        location: {
          id: "loc-uuid",
          name: "Quảng Ninh",
          description: "Tỉnh Quảng Ninh"
        }
      }
    ],
    total: 50
  }, null, 2));
  
  console.log('\n🎯 SETUP NOTES:');
  console.log('1. Replace AGENCY_TOKEN_HERE with real token');
  console.log('2. Update destination-uuid-here and location-uuid-here with real UUIDs');
  console.log('3. Make sure server is running on localhost:5001');
  console.log('4. Ensure destinations and locations tables have data');
}

// Run tests
if (require.main === module) {
  console.log('⚠️  SETUP REQUIRED:');
  console.log('1. Replace AGENCY_TOKEN_HERE with real token');
  console.log('2. Update UUIDs in test data to match your database');
  console.log('3. Make sure server is running on localhost:5001\n');
  
  showAPIDocumentation();
  
  console.log('\n🚀 To run tests, uncomment the line below:');
  console.log('// runAllTests();');
  
  // Uncomment to run actual tests:
  // runAllTests();
}

module.exports = { 
  runAllTests, 
  testDestinationLocationEndpoints,
  testTourCreationWithIDs,
  testTourCreationTraditional,
  tourDataWithIDs,
  tourDataTraditional,
  showAPIDocumentation
};
