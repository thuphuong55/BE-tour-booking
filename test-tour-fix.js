const axios = require('axios');

const testTourComplete = async () => {
  try {
    console.log('🧪 Testing Tour Complete API...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // Get existing tours first
    console.log('\n1️⃣ Getting existing tours...');
    const toursResponse = await axios.get(`${baseURL}/tours`);
    const tours = toursResponse.data?.data || toursResponse.data?.tours || toursResponse.data || [];
    
    if (tours.length === 0) {
      console.log('❌ No tours found');
      return;
    }
    
    const tour_id = tours[0].id;
    console.log('✅ Using tour ID:', tour_id);
    
    // Test getTourComplete
    console.log('\n2️⃣ Testing getTourComplete...');
    try {
      const completeResponse = await axios.get(`${baseURL}/tours/${tour_id}/complete`);
      console.log('✅ Tour Complete Success');
      console.log('📊 Tour data:');
      console.log('  - Name:', completeResponse.data.name);
      console.log('  - Hotels:', completeResponse.data.hotels?.length || 0, 'hotels');
      console.log('  - Images:', completeResponse.data.images?.length || 0, 'images');
      console.log('  - Itineraries:', completeResponse.data.itineraries?.length || 0, 'days');
      
      if (completeResponse.data.hotels?.length > 0) {
        console.log('🏨 Hotel details:');
        completeResponse.data.hotels.forEach((hotel, index) => {
          console.log(`  ${index + 1}. ${hotel.ten_khach_san} - ${hotel.ten_phong} (${hotel.star_rating || 'No rating'} stars)`);
        });
      }
      
    } catch (error) {
      console.log('❌ Tour Complete Error:', error.response?.data?.message || error.message);
    }
    
    // Test getTourWithHotels  
    console.log('\n3️⃣ Testing getTourWithHotels...');
    try {
      const hotelsResponse = await axios.get(`${baseURL}/tours/${tour_id}/hotels`);
      console.log('✅ Tour Hotels Success');
      console.log('🏨 Hotels found:', hotelsResponse.data.hotels?.length || 0);
      
      if (hotelsResponse.data.hotels?.length > 0) {
        hotelsResponse.data.hotels.forEach((hotel, index) => {
          console.log(`  ${index + 1}. ${hotel.ten_khach_san} - ${hotel.star_rating || 'No rating'} stars`);
        });
      }
      
    } catch (error) {
      console.log('❌ Tour Hotels Error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Tour API tests completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testTourComplete();
