const axios = require('axios');

const testTourImageCreation = async () => {
  try {
    console.log('🧪 Testing Tour Image Creation...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // First, get a valid tour_id
    console.log('\n1️⃣ Getting valid tour ID...');
    try {
      const toursResponse = await axios.get(`${baseURL}/tours?limit=1`);
      const tours = toursResponse.data?.data || toursResponse.data?.tours || [];
      
      if (tours.length === 0) {
        console.log('❌ No tours found. Please create a tour first.');
        return;
      }
      
      const tour_id = tours[0].id;
      console.log('✅ Found tour ID:', tour_id);
      
      // Test scenarios
      const testCases = [
        {
          name: 'Missing tour_id',
          data: {
            image_url: 'https://example.com/image.jpg',
            is_main: false
          },
          expectedError: 'tour_id là bắt buộc'
        },
        {
          name: 'Missing image_url',
          data: {
            tour_id: tour_id,
            is_main: false
          },
          expectedError: 'image_url là bắt buộc'
        },
        {
          name: 'Invalid URL format',
          data: {
            tour_id: tour_id,
            image_url: 'invalid-url',
            is_main: false
          },
          expectedError: 'image_url phải là URL hợp lệ'
        },
        {
          name: 'Valid image creation',
          data: {
            tour_id: tour_id,
            image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
            is_main: false
          },
          expectedSuccess: true
        },
        {
          name: 'Valid main image creation',
          data: {
            tour_id: tour_id,
            image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            is_main: true
          },
          expectedSuccess: true
        }
      ];
      
      console.log('\n2️⃣ Testing different scenarios...');
      
      for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        
        try {
          const response = await axios.post(`${baseURL}/tour-images`, testCase.data);
          
          if (testCase.expectedSuccess) {
            console.log('✅ Success:', response.data);
          } else {
            console.log('❌ Expected error but got success:', response.data);
          }
          
        } catch (error) {
          if (testCase.expectedError) {
            console.log('✅ Expected error:', error.response?.data?.message);
          } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
          }
        }
      }
      
      // Test getting tour images
      console.log('\n3️⃣ Getting tour images...');
      try {
        const imagesResponse = await axios.get(`${baseURL}/tour-images/tour/${tour_id}`);
        console.log('✅ Tour images:', imagesResponse.data);
      } catch (error) {
        console.log('❌ Error getting images:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Error getting tours:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testTourImageCreation();
