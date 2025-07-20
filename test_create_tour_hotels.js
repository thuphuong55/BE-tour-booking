const axios = require('axios');

async function testCreateTourWithHotels() {
  try {
    console.log('=== TEST TẠO TOUR VỚI HOTELS ===\n');

    // 1. Login để lấy token agency
    console.log('🔐 Bước 1: Login agency...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'agency12@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login thành công!');

    // 2. Tạo tour với hotel IDs từ log trước
    console.log('\n🎯 Bước 2: Tạo tour với hotel IDs...');
    
    const tourData = {
      name: "Test Tour Phú Quốc - Debug Hotel Issue",
      description: "Test để fix lỗi hotel association",
      location: "Phú Quốc", 
      destination: "Biển Sao, Cáp Treo Hòn Thơm",
      departure_location: "TP. Hồ Chí Minh",
      price: 5000000,
      tour_type: "Trong nước",
      max_participants: 10,
      min_participants: 2,

      // Hotel IDs từ log error trước đó
      hotel_ids: [
        "1cb02878-e547-477e-a29a-0bcca522ce9a",
        "60f182b5-66a8-4fb7-a2a4-73d75301d52d",
        "0464923a-7683-4d5b-a7b6-714efb98b81b"
      ]
    };

    console.log('📝 Tour data:', JSON.stringify(tourData, null, 2));

    const createResponse = await axios.post('http://localhost:5001/api/tours', tourData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Tour tạo thành công!');
    console.log('📊 Response:', JSON.stringify(createResponse.data, null, 2));

  } catch (error) {
    console.log('\n❌ Test failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error:', error.message);
  }
}

testCreateTourWithHotels();
