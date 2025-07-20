const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCreateTourWithHotelsAndServices() {
  console.log("=== TEST CREATE TOUR WITH HOTELS & SERVICES ===");
  
  try {
    // Đầu tiên, lấy token admin
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin12@gmail.com',
      password: 'admin123'
    }); require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testCreateTourWithHotelsAndServices() {
  console.log("=== TEST CREATE TOUR WITH HOTELS & SERVICES ===");
  
  try {
    // Đầu tiên, lấy token admin
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin@example.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log("✅ Admin login successful");

    // Lấy danh sách hotels
    const hotelsResponse = await axios.get(`${BASE_URL}/hotels`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`📊 Found ${hotelsResponse.data.length} hotels`);
    const firstHotel = hotelsResponse.data[0];
    if (firstHotel) {
      console.log(`🏨 First hotel: ID=${firstHotel.id_hotel}, Name=${firstHotel.ten_khach_san}`);
    }

    // Lấy danh sách included services
    const servicesResponse = await axios.get(`${BASE_URL}/included-services`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`📊 Found ${servicesResponse.data.length} included services`);
    const firstService = servicesResponse.data[0];
    if (firstService) {
      console.log(`🛎️ First service: ID=${firstService.id}, Name=${firstService.name || firstService.service_name}`);
    }

    // Tạo tour mới với hotels và services
    const tourData = {
      name: "Test Tour with Hotels & Services",
      description: "Test tour để kiểm tra hotels và services",
      price: 1500000,
      start_date: "2024-12-01",
      end_date: "2024-12-05",
      location: "Hà Nội",
      destination: "Đà Nẵng",
      departure_location: "Sân bay Nội Bài",
      max_people: 20,
      current_people: 0,
      hotel_ids: firstHotel ? [firstHotel.id_hotel] : [],
      service: firstService ? [firstService.id] : [],
      category_ids: []
    };

    console.log("📝 Creating tour with data:", JSON.stringify(tourData, null, 2));

    const createResponse = await axios.post(`${BASE_URL}/tours`, tourData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Tour created:", {
      id: createResponse.data.id,
      name: createResponse.data.name,
      location: createResponse.data.location,
      destination: createResponse.data.destination
    });

    const tourId = createResponse.data.id;

    // Kiểm tra relations của tour vừa tạo
    console.log("\n=== CHECKING TOUR RELATIONS ===");
    const debugResponse = await axios.get(`${BASE_URL}/tours/${tourId}/debug-relations`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("🔍 Debug relations result:", JSON.stringify(debugResponse.data, null, 2));

  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.data) {
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Chạy test
testCreateTourWithHotelsAndServices();
