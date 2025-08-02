const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testMultipleLocations() {
  try {
    console.log('🧪 Testing Multiple Locations Feature...\n');
    
    // 1. Lấy danh sách locations
    console.log('📍 Fetching available locations...');
    const locationsResponse = await axios.get(`${API_BASE}/locations`);
    const locations = locationsResponse.data;
    console.log(`Found ${locations.length} locations`);
    
    // Lấy 3 locations đầu tiên để test
    const testLocationIds = locations.slice(0, 3).map(loc => loc.id);
    console.log('Test location IDs:', testLocationIds);
    console.log('Test location names:', locations.slice(0, 3).map(loc => loc.name));
    
    // 2. Lấy danh sách tours hiện tại
    console.log('\n🎯 Fetching existing tours...');
    const toursResponse = await axios.get(`${API_BASE}/tours`);
    const tours = toursResponse.data.data || toursResponse.data;
    console.log(`Found ${tours.length} existing tours`);
    
    // 3. Test lấy chi tiết tour đầu tiên
    if (tours.length > 0) {
      console.log(`\n🔍 Testing tour details for: ${tours[0].name}`);
      try {
        const tourDetailResponse = await axios.get(`${API_BASE}/tours/${tours[0].id}`);
        const tourDetail = tourDetailResponse.data;
        console.log('✅ Tour detail API works');
        console.log('- Tour name:', tourDetail.name);
        console.log('- Has locations field:', !!tourDetail.locations);
        console.log('- Locations count:', tourDetail.locations ? tourDetail.locations.length : 0);
        if (tourDetail.locations && tourDetail.locations.length > 0) {
          console.log('- Location names:', tourDetail.locations.map(l => l.name).join(', '));
        }
      } catch (err) {
        console.log('❌ Tour detail API failed:', err.response?.data?.message || err.message);
      }
    }
    
    // 4. Test tạo tour mới với multiple locations (nếu có locations)
    if (testLocationIds.length >= 2) {
      console.log('\n🚀 Testing tour creation with multiple locations...');
      
      const newTourData = {
        name: `Test Multi-Location Tour ${Date.now()}`,
        description: 'Tour test với nhiều điểm đến',
        location_ids: testLocationIds.slice(0, 2), // Chỉ lấy 2 locations
        price: 1000000,
        max_participants: 20,
        tour_type: 'Trong nước',
        agency_id: '1' // Giả sử có agency với ID 1
      };
      
      console.log('Creating tour with data:', {
        name: newTourData.name,
        location_ids: newTourData.location_ids,
        location_names: locations.slice(0, 2).map(l => l.name)
      });
      
      try {
        // Cần token để tạo tour - bỏ qua bước này vì cần authentication
        console.log('⚠️ Skipping tour creation - requires authentication');
      } catch (err) {
        console.log('❌ Tour creation failed:', err.response?.data?.message || err.message);
      }
    }
    
    console.log('\n✅ Multiple Locations Feature Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Chạy test
testMultipleLocations();
