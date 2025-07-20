const axios = require('axios');

const testTourImageSimple = async () => {
  try {
    console.log('🧪 Testing Tour Image API - Simple Test...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // Get existing tours first
    console.log('\n1️⃣ Getting existing tours...');
    try {
      const toursResponse = await axios.get(`${baseURL}/tours`);
      const tours = toursResponse.data?.data || toursResponse.data?.tours || toursResponse.data || [];
      
      console.log(`Found ${tours.length} tours`);
      
      if (tours.length > 0) {
        const tour_id = tours[0].id;
        console.log('✅ Using tour ID:', tour_id);
        
        // Test creating tour images
        console.log('\n2️⃣ Creating tour images...');
        
        const imagesToCreate = [
          {
            tour_id: tour_id,
            image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
            is_main: false
          },
          {
            tour_id: tour_id,
            image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            is_main: true
          }
        ];
        
        for (const imageData of imagesToCreate) {
          console.log(`\n📝 Creating image: ${imageData.is_main ? 'MAIN' : 'NORMAL'}`);
          try {
            const response = await axios.post(`${baseURL}/tour-images`, imageData);
            console.log('✅ Image created:', {
              id: response.data.id,
              url: response.data.image_url,
              is_main: response.data.is_main
            });
          } catch (error) {
            console.log('❌ Error creating image:', error.response?.data?.message || error.message);
          }
        }
        
        // Get tour images
        console.log('\n3️⃣ Getting tour images...');
        try {
          const imagesResponse = await axios.get(`${baseURL}/tour-images/tour/${tour_id}`);
          const images = imagesResponse.data?.data || [];
          console.log('✅ Tour images:', images.length, 'images found');
          images.forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.is_main ? '[MAIN]' : '[NORMAL]'} ${img.image_url}`);
          });
        } catch (error) {
          console.log('❌ Error getting images:', error.response?.data || error.message);
        }
        
      } else {
        console.log('❌ No tours available for testing. Create a tour first.');
      }
      
    } catch (error) {
      console.log('❌ Error getting tours:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Tour image test completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testTourImageSimple();
