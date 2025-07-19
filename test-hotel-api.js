const axios = require('axios');

async function testHotelLocationAPI() {
  try {
    const baseURL = 'http://localhost:5001/api';
    
    console.log('🏨 Test Hotel-Location API endpoints...\n');
    
    // 1. Test lấy tất cả khách sạn với địa điểm
    console.log('1. GET /api/hotel-locations - Lấy tất cả khách sạn với địa điểm');
    const allHotelsResponse = await axios.get(`${baseURL}/hotel-locations`);
    
    console.log(`   Status: ${allHotelsResponse.status}`);
    console.log(`   Tìm thấy ${allHotelsResponse.data.data.length} khách sạn`);
    
    allHotelsResponse.data.data.slice(0, 2).forEach(hotel => {
      const locationName = hotel.location ? hotel.location.name : 'Chưa gán địa điểm';
      console.log(`   - ${hotel.ten_khach_san} tại ${locationName}`);
    });
    
    // 2. Test lọc khách sạn theo địa điểm
    const locationId = '1cc63272-da3f-48b8-b197-199d6ec8a996'; // Phú Quốc
    console.log(`\n2. GET /api/hotel-locations/location/${locationId} - Lọc khách sạn theo địa điểm`);
    
    const hotelsByLocationResponse = await axios.get(`${baseURL}/hotel-locations/location/${locationId}`);
    
    console.log(`   Status: ${hotelsByLocationResponse.status}`);
    console.log(`   Message: ${hotelsByLocationResponse.data.message}`);
    console.log(`   Địa điểm: ${hotelsByLocationResponse.data.data.location.name}`);
    console.log(`   Số khách sạn: ${hotelsByLocationResponse.data.data.hotels.length}`);
    
    hotelsByLocationResponse.data.data.hotels.forEach(hotel => {
      console.log(`   - ${hotel.ten_khach_san}`);
    });
    
    // 3. Test update location cho khách sạn
    const hotelId = 'hotel-dalat-a'; // ID của một khách sạn
    const newLocationId = '61d461a7-c081-4585-869e-063f09cdb60e'; // Đà Lạt
    
    console.log(`\n3. PUT /api/hotel-locations/${hotelId}/location - Gán khách sạn vào Đà Lạt`);
    
    const updateResponse = await axios.put(`${baseURL}/hotel-locations/${hotelId}/location`, {
      location_id: newLocationId
    });
    
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Message: ${updateResponse.data.message}`);
    console.log(`   Khách sạn: ${updateResponse.data.data.ten_khach_san}`);
    console.log(`   Địa điểm mới: ${updateResponse.data.data.location ? updateResponse.data.data.location.name : 'Không có'}`);
    
    console.log('\n✅ Test API hoàn thành! Tất cả endpoints hoạt động tốt.');
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  } finally {
    process.exit();
  }
}

testHotelLocationAPI();
