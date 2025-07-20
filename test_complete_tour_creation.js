const axios = require('axios');

// Sample data với đầy đủ fields
const completeTourData = {
  "name": "Tour Vịnh Hạ Long Complete Test",
  "description": "Test tour với đầy đủ departureDates và excludedServices",
  "destination_id": "dest-uuid-here",  // Optional: auto-populate destination
  "location_id": "loc-uuid-here",      // Optional: auto-populate location
  "departure_location": "Hà Nội",
  "price": 2800000,
  "tour_type": "Trong nước",
  "max_participants": 30,
  "min_participants": 2,
  
  // ✅ Images
  "images": [
    { "image_url": "https://example.com/halong1.jpg", "is_main": true },
    { "image_url": "https://example.com/halong2.jpg", "is_main": false }
  ],
  
  // 📅 Departure Dates
  "departureDates": [
    {
      "departure_date": "2025-08-15",
      "end_date": "2025-08-17",
      "number_of_days": 3,
      "number_of_nights": 2
    },
    {
      "departure_date": "2025-09-01",
      "end_date": "2025-09-03",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ],
  
  // 📂 Categories
  "category_ids": [1, 2],
  
  // 🏨 Hotels
  "hotel_ids": [1, 2],
  
  // ✅ Included Services
  "included_service_ids": [1, 2, 3],
  
  // 🚫 Excluded Services (NEW!)
  "excluded_service_ids": [1, 2]
};

const updateTourData = {
  "name": "Tour Vịnh Hạ Long Updated",
  "price": 3200000,
  
  // Update departure dates
  "departureDates": [
    {
      "departure_date": "2025-10-15",
      "end_date": "2025-10-18",
      "number_of_days": 4,
      "number_of_nights": 3
    }
  ],
  
  // Update excluded services
  "excluded_service_ids": [3, 4, 5],
  
  // Update included services
  "included_service_ids": [1, 3, 5]
};

async function testTourWithDepartureDatesAndExcludedServices() {
  console.log('=== TEST TOUR WITH DEPARTURE DATES & EXCLUDED SERVICES ===\n');

  // Test 1: Create tour with complete data
  console.log('🧪 Test 1: Create tour with departureDates & excludedServices');
  let tourId = null;
  
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      completeTourData,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Tour created successfully');
    console.log('Tour ID:', response.data.id);
    console.log('Tour name:', response.data.name);
    console.log('Status:', response.data.status);
    console.log('Destination:', response.data.destination);
    console.log('Location:', response.data.location);
    
    tourId = response.data.id;
    
  } catch (error) {
    console.log('❌ Failed to create tour:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Get complete tour data to verify relations
  if (tourId) {
    console.log('🧪 Test 2: Get complete tour data');
    try {
      const response = await axios.get(`http://localhost:5001/api/tours/${tourId}/complete`);
      
      console.log('✅ Complete tour data retrieved');
      console.log('Tour name:', response.data.name);
      console.log('Departure dates count:', response.data.departureDates?.length || 0);
      console.log('Included services count:', response.data.includedServices?.length || 0);
      console.log('Excluded services count:', response.data.excludedServices?.length || 0);
      console.log('Categories count:', response.data.categories?.length || 0);
      console.log('Hotels count:', response.data.hotels?.length || 0);
      console.log('Images count:', response.data.images?.length || 0);
      
      // Log sample data
      if (response.data.departureDates?.length > 0) {
        console.log('Sample departure date:', response.data.departureDates[0]);
      }
      
      if (response.data.excludedServices?.length > 0) {
        console.log('Sample excluded service:', response.data.excludedServices[0]);
      }
      
    } catch (error) {
      console.log('❌ Failed to get complete tour:', error.response?.data || error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Update tour with new departureDates and excludedServices
  if (tourId) {
    console.log('🧪 Test 3: Update tour with new data');
    try {
      const response = await axios.put(`http://localhost:5001/api/tours/${tourId}`, 
        updateTourData,
        {
          headers: {
            'Authorization': 'Bearer AGENCY_TOKEN_HERE',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Tour updated successfully');
      console.log('Updated name:', response.data.name);
      console.log('Updated price:', response.data.price);
      
    } catch (error) {
      console.log('❌ Failed to update tour:', error.response?.data || error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Get updated tour data to verify changes
  if (tourId) {
    console.log('🧪 Test 4: Verify updated tour data');
    try {
      const response = await axios.get(`http://localhost:5001/api/tours/${tourId}/complete`);
      
      console.log('✅ Updated tour data verified');
      console.log('Current name:', response.data.name);
      console.log('Current price:', response.data.price);
      console.log('Updated departure dates count:', response.data.departureDates?.length || 0);
      console.log('Updated excluded services count:', response.data.excludedServices?.length || 0);
      console.log('Updated included services count:', response.data.includedServices?.length || 0);
      
      // Show updated departure dates
      if (response.data.departureDates?.length > 0) {
        console.log('Updated departure dates:');
        response.data.departureDates.forEach((date, index) => {
          console.log(`  ${index + 1}. ${date.departure_date} to ${date.end_date} (${date.number_of_days} days)`);
        });
      }
      
      // Show updated excluded services
      if (response.data.excludedServices?.length > 0) {
        console.log('Updated excluded services:');
        response.data.excludedServices.forEach((service, index) => {
          console.log(`  ${index + 1}. ${service.name || service.id}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Failed to verify updated tour:', error.response?.data || error.message);
    }
  }

  return tourId;
}

async function testEmptyArraysHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('=== TEST EMPTY ARRAYS HANDLING ===');
  console.log('='.repeat(60) + '\n');

  // Test 5: Create tour with empty arrays
  console.log('🧪 Test 5: Create tour with empty arrays');
  try {
    const emptyArraysData = {
      "name": "Tour with Empty Arrays",
      "description": "Test empty arrays handling",
      "destination": "Test Destination",
      "location": "Test Location",
      "departure_location": "Hà Nội",
      "price": 1500000,
      "tour_type": "Trong nước",
      "max_participants": 20,
      "min_participants": 2,
      "departureDates": [],           // Empty array
      "excluded_service_ids": [],     // Empty array
      "included_service_ids": [],     // Empty array
      "category_ids": [],             // Empty array
      "hotel_ids": []                 // Empty array
    };

    const response = await axios.post('http://localhost:5001/api/tours', 
      emptyArraysData,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Tour with empty arrays created successfully');
    console.log('Tour ID:', response.data.id);
    console.log('Name:', response.data.name);
    
  } catch (error) {
    console.log('❌ Failed to create tour with empty arrays:', error.response?.data || error.message);
  }
}

function showAPIDocumentation() {
  console.log('\n' + '='.repeat(70));
  console.log('📚 COMPLETE TOUR CREATION API DOCUMENTATION');
  console.log('='.repeat(70));
  
  console.log('\n📝 FULL TOUR REQUEST STRUCTURE:');
  console.log(JSON.stringify({
    // Basic tour info
    name: "Tour Name",
    description: "Tour description",
    destination_id: "uuid-optional",        // Auto-populate destination
    location_id: "uuid-optional",           // Auto-populate location  
    destination: "Destination Name",        // OR direct text
    location: "Location Name",              // OR direct text
    departure_location: "Departure City",
    price: 2500000,
    tour_type: "Trong nước",
    max_participants: 30,
    min_participants: 2,
    
    // Relations arrays
    images: [
      { image_url: "url1", is_main: true },
      { image_url: "url2", is_main: false }
    ],
    
    departureDates: [                       // ✅ NOW SUPPORTED
      {
        departure_date: "2025-08-15",
        end_date: "2025-08-17", 
        number_of_days: 3,
        number_of_nights: 2
      }
    ],
    
    category_ids: [1, 2],                   // Tour categories
    hotel_ids: [1, 2],                      // Hotels
    included_service_ids: [1, 2, 3],        // Included services
    excluded_service_ids: [1, 2]            // ✅ NOW SUPPORTED - Excluded services
  }, null, 2));
  
  console.log('\n🔄 UPDATE TOUR REQUEST:');
  console.log(JSON.stringify({
    name: "Updated Tour Name",
    price: 3000000,
    
    // Update departure dates (replaces all)
    departureDates: [
      {
        departure_date: "2025-10-01",
        end_date: "2025-10-04",
        number_of_days: 4,
        number_of_nights: 3
      }
    ],
    
    // Update excluded services (replaces all)
    excluded_service_ids: [3, 4, 5],
    
    // Update included services (replaces all)  
    included_service_ids: [1, 5, 7]
  }, null, 2));
  
  console.log('\n🔍 SUPPORTED FIELD VARIATIONS:');
  console.log('excluded_service_ids: [1, 2, 3]     // Primary field');
  console.log('excludedServices: [1, 2, 3]         // Alternative field');
  console.log('included_service_ids: [1, 2, 3]     // Primary field');
  console.log('selectedIncludedServices: [1, 2, 3] // Alternative field');
  
  console.log('\n📊 EMPTY ARRAYS HANDLING:');
  console.log('departureDates: []           // Creates tour with no departure dates');
  console.log('excluded_service_ids: []     // Creates tour with no excluded services');
  console.log('included_service_ids: []     // Creates tour with no included services');
  
  console.log('\n✅ NEW CAPABILITIES:');
  console.log('1. ✅ Create tour with departureDates array');
  console.log('2. ✅ Create tour with excluded_service_ids array');
  console.log('3. ✅ Update tour departureDates (replace all)');
  console.log('4. ✅ Update tour excluded services (replace all)');
  console.log('5. ✅ Handle empty arrays properly');
  console.log('6. ✅ Support multiple field name variations');
  
  console.log('\n🎯 BACKEND PROCESSING:');
  console.log('- Validates all service IDs exist before assignment');
  console.log('- Creates DepartureDate records linked to tour');
  console.log('- Creates many-to-many relationships for services');
  console.log('- Provides detailed debug logging');
  console.log('- Handles both create and update operations');
}

// Run tests
if (require.main === module) {
  console.log('⚠️  SETUP REQUIRED:');
  console.log('1. Replace AGENCY_TOKEN_HERE with real token');
  console.log('2. Update UUIDs and IDs to match your database');
  console.log('3. Make sure server is running on localhost:5001');
  console.log('4. Ensure required data exists (services, categories, hotels)\n');
  
  showAPIDocumentation();
  
  console.log('\n🚀 To run tests, uncomment the lines below:');
  console.log('// testTourWithDepartureDatesAndExcludedServices();');
  console.log('// testEmptyArraysHandling();');
  
  // Uncomment to run actual tests:
  // testTourWithDepartureDatesAndExcludedServices();
  // testEmptyArraysHandling();
}

module.exports = { 
  testTourWithDepartureDatesAndExcludedServices,
  testEmptyArraysHandling,
  completeTourData,
  updateTourData,
  showAPIDocumentation
};
