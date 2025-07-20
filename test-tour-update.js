const axios = require('axios');

const testTourUpdate = async () => {
  try {
    console.log('🧪 Testing Tour Update API...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // Get the tour that was updated
    const tourId = '7ecdae58-fa8c-44fc-84a6-14f50338350a'; // From the log
    
    console.log('\n1️⃣ Getting tour details...');
    try {
      const tourResponse = await axios.get(`${baseURL}/tours/${tourId}/complete`);
      const tour = tourResponse.data;
      
      console.log('✅ Tour found:');
      console.log('  - ID:', tour.id);
      console.log('  - Name:', tour.name);
      console.log('  - Location:', tour.location);
      console.log('  - Destination:', tour.destination);
      console.log('  - Price:', tour.price?.toLocaleString(), 'VND');
      console.log('  - Status:', tour.status);
      console.log('  - Images:', tour.images?.length || 0);
      console.log('  - Departure Dates:', tour.departureDates?.length || 0);
      console.log('  - Hotels:', tour.hotels?.length || 0);
      console.log('  - Included Services:', tour.includedServices?.length || 0);
      console.log('  - Excluded Services:', tour.excludedServices?.length || 0);
      console.log('  - Categories:', tour.categories?.length || 0);
      
      // Check if images are empty (as mentioned in the log)
      if (!tour.images || tour.images.length === 0) {
        console.log('\n⚠️  Note: Tour has no images. This might be the issue.');
        
        // Test adding an image to this tour
        console.log('\n2️⃣ Adding test image to tour...');
        try {
          const imageData = {
            tour_id: tourId,
            image_url: 'https://images.unsplash.com/photo-1534612899740-55c821a90129?w=800',
            is_main: true
          };
          
          const imageResponse = await axios.post(`${baseURL}/tour-images`, imageData);
          console.log('✅ Image added successfully:', imageResponse.data.id);
          
          // Get updated tour
          const updatedTourResponse = await axios.get(`${baseURL}/tours/${tourId}/complete`);
          console.log('✅ Updated tour now has', updatedTourResponse.data.images?.length || 0, 'images');
          
        } catch (error) {
          console.log('❌ Error adding image:', error.response?.data?.message || error.message);
        }
      }
      
      // Check departure dates
      if (!tour.departureDates || tour.departureDates.length === 0) {
        console.log('\n⚠️  Note: Tour has no departure dates. This is required for booking.');
      }
      
    } catch (error) {
      console.log('❌ Error getting tour:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Tour update test completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testTourUpdate();
