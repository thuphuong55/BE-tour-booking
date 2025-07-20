const axios = require('axios');

const testTourImageAPI = async () => {
  try {
    console.log('🧪 Testing Tour Image API...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // Test với fake tour_id trước để test validation
    console.log('\n1️⃣ Test validation errors...');
    
    const testCases = [
      {
        name: 'Missing tour_id',
        data: {
          image_url: 'https://example.com/image.jpg',
          is_main: false
        }
      },
      {
        name: 'Missing image_url',
        data: {
          tour_id: '123e4567-e89b-12d3-a456-426614174000',
          is_main: false
        }
      },
      {
        name: 'Empty image_url',
        data: {
          tour_id: '123e4567-e89b-12d3-a456-426614174000',
          image_url: '',
          is_main: false
        }
      },
      {
        name: 'Null image_url',
        data: {
          tour_id: '123e4567-e89b-12d3-a456-426614174000',
          image_url: null,
          is_main: false
        }
      },
      {
        name: 'Invalid URL format',
        data: {
          tour_id: '123e4567-e89b-12d3-a456-426614174000',
          image_url: 'invalid-url',
          is_main: false
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Test: ${testCase.name}`);
      console.log(`📤 Data:`, testCase.data);
      
      try {
        const response = await axios.post(`${baseURL}/tour-images`, testCase.data);
        console.log('❌ Unexpected success:', response.data);
      } catch (error) {
        console.log('✅ Expected error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 Validation tests completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testTourImageAPI();
