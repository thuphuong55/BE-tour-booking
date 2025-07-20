const axios = require('axios');

// Test data với location và destination
const testTourData = {
  name: "Test Tour Location/Destination",
  description: "Tour test để kiểm tra location và destination có được lưu",
  location: "Đà Lạt, Lâm Đồng",
  destination: "Thác Datanla, Chợ Đà Lạt, Crazy House, Hồ Xuân Hương",
  departure_location: "TP. Hồ Chí Minh",
  price: 2500000,
  tour_type: "Trong nước",
  max_participants: 15,
  min_participants: 2,
  
  // Test với departure dates
  departureDates: [
    {
      departure_date: "2025-08-20",
      end_date: "2025-08-22", 
      number_of_days: 3,
      number_of_nights: 2
    }
  ],
  
  // Test với images
  images: [
    {
      image_url: "https://example.com/dalat1.jpg",
      is_main: true
    },
    {
      image_url: "https://example.com/dalat2.jpg", 
      is_main: false
    }
  ]
};

async function testCreateTour() {
  try {
    console.log("🚀 Testing tour creation with location/destination...");
    console.log("📝 Data gửi đi:", JSON.stringify(testTourData, null, 2));
    
    // Thay đổi URL và token theo môi trường của bạn
    const response = await axios.post('http://localhost:5001/api/tours', testTourData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AGENCY_TOKEN_HERE' // Cần thay bằng token thật
      }
    });
    
    console.log("✅ Tour created successfully!");
    console.log("📊 Response data:", JSON.stringify(response.data, null, 2));
    
    const tourId = response.data.id;
    
    // Test debug endpoint
    console.log("\n🔍 Testing debug endpoint...");
    const debugResponse = await axios.get(`http://localhost:5001/api/tours/${tourId}/debug`);
    console.log("🧪 Debug result:", JSON.stringify(debugResponse.data, null, 2));
    
    return tourId;
    
  } catch (error) {
    console.error("❌ Error creating tour:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
}

async function testUpdateTour(tourId) {
  try {
    console.log("\n🔄 Testing tour update...");
    
    const updateData = {
      name: "Updated Test Tour",
      location: "Nha Trang, Khánh Hòa", // Thay đổi location
      destination: "Bãi biển Nha Trang, Vinpearl Land, Tháp Bà Ponagar", // Thay đổi destination
      price: 3000000
    };
    
    console.log("📝 Update data:", JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(`http://localhost:5001/api/tours/${tourId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_AGENCY_TOKEN_HERE' // Cần thay bằng token thật
      }
    });
    
    console.log("✅ Tour updated successfully!");
    console.log("📊 Updated data:", JSON.stringify(response.data, null, 2));
    
    // Test debug endpoint sau update
    console.log("\n🔍 Testing debug endpoint after update...");
    const debugResponse = await axios.get(`http://localhost:5001/api/tours/${tourId}/debug`);
    console.log("🧪 Debug result after update:", JSON.stringify(debugResponse.data, null, 2));
    
  } catch (error) {
    console.error("❌ Error updating tour:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

async function runTests() {
  console.log("🧪 Starting location/destination tests...\n");
  
  const tourId = await testCreateTour();
  
  if (tourId) {
    await testUpdateTour(tourId);
  }
  
  console.log("\n🏁 Tests completed!");
}

// Chạy test nếu file được execute directly
if (require.main === module) {
  runTests();
}

module.exports = { testCreateTour, testUpdateTour, runTests };
