const axios = require('axios');

// Test data
const adminTourData = {
  "agency_id": "d3a463c7-fa0f-486c-8b89-8429c5640186", // Required for admin
  "name": "Tour Hạ Long Bay (Admin Created)",
  "description": "Khám phá Vịnh Hạ Long tuyệt đẹp với du thuyền 5 sao.",
  "location": "Hạ Long",
  "destination": "Vịnh Hạ Long",
  "departure_location": "Hà Nội",
  "price": 2500000,
  "tour_type": "Trong nước",
  "max_participants": 30,
  "min_participants": 2,
  "images": [
    { "image_url": "https://example.com/halong1.jpg", "is_main": true },
    { "image_url": "https://example.com/halong2.jpg", "is_main": false }
  ],
  "departureDates": [
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  "category_ids": [1, 2],
  "hotel_ids": [1, 2],
  "included_service_ids": [1, 2, 3],
  "excluded_service_ids": [1, 2]
};

const agencyTourData = {
  // No agency_id - will be auto-assigned from user's agency
  "name": "Tour Hạ Long Bay (Agency Created)",
  "description": "Khám phá Vịnh Hạ Long tuyệt đẹp với du thuyền 5 sao.",
  "location": "Hạ Long",
  "destination": "Vịnh Hạ Long",
  "departure_location": "Hà Nội",
  "price": 2500000,
  "tour_type": "Trong nước",
  "max_participants": 30,
  "min_participants": 2,
  "images": [
    { "image_url": "https://example.com/halong1.jpg", "is_main": true },
    { "image_url": "https://example.com/halong2.jpg", "is_main": false }
  ],
  "departureDates": [
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  "category_ids": [1, 2],
  "hotel_ids": [1, 2],
  "included_service_ids": [1, 2, 3],
  "excluded_service_ids": [1, 2]
};

async function testTourCreation() {
  console.log('=== TEST TOUR CREATION LOGIC ===\n');

  // Test 1: Admin creates tour without agency_id (should fail)
  console.log('🧪 Test 1: Admin without agency_id (should fail)');
  try {
    const adminDataWithoutAgencyId = { ...adminTourData };
    delete adminDataWithoutAgencyId.agency_id;
    
    const response = await axios.post('http://localhost:5001/api/tours', 
      adminDataWithoutAgencyId,
      {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('❌ Unexpected success:', response.status);
  } catch (error) {
    console.log('✅ Expected error:', error.response?.data?.message || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Admin creates tour with agency_id (should success)
  console.log('🧪 Test 2: Admin with agency_id (should success)');
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      adminTourData,
      {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Success:', response.status);
    console.log('Tour ID:', response.data.id);
    console.log('Agency ID:', response.data.agency_id);
  } catch (error) {
    console.log('❌ Unexpected error:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Agency creates tour (should success with auto agency_id)
  console.log('🧪 Test 3: Agency creates tour (should success)');
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      agencyTourData,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Success:', response.status);
    console.log('Tour ID:', response.data.id);
    console.log('Agency ID (auto-assigned):', response.data.agency_id);
  } catch (error) {
    console.log('❌ Unexpected error:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Agency tries to create tour with different agency_id (should ignore and use own)
  console.log('🧪 Test 4: Agency with wrong agency_id (should ignore and use own)');
  try {
    const agencyDataWithWrongId = { 
      ...agencyTourData, 
      agency_id: "wrong-agency-id-should-be-ignored",
      name: "Tour with Wrong Agency ID"
    };
    
    const response = await axios.post('http://localhost:5001/api/tours', 
      agencyDataWithWrongId,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Success:', response.status);
    console.log('Requested agency_id:', "wrong-agency-id-should-be-ignored");
    console.log('Actual agency_id (corrected):', response.data.agency_id);
  } catch (error) {
    console.log('❌ Unexpected error:', error.response?.data || error.message);
  }
}

// Run tests only if called directly
if (require.main === module) {
  console.log('⚠️  NOTE: Replace ADMIN_TOKEN_HERE and AGENCY_TOKEN_HERE with real tokens');
  console.log('⚠️  Make sure server is running on localhost:5001\n');
  
  // Uncomment to run tests
  // testTourCreation();
  
  console.log('🔧 To run tests:');
  console.log('1. Get real admin and agency tokens');
  console.log('2. Replace token placeholders');
  console.log('3. Uncomment testTourCreation() call');
  console.log('4. Run: node test_tour_creation_logic.js');
}

module.exports = { testTourCreation, adminTourData, agencyTourData };
