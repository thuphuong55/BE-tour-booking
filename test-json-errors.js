const axios = require('axios');

const testJSONErrors = async () => {
  try {
    console.log('🧪 Testing JSON Parsing Issues...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // Test scenarios that might cause JSON parsing errors
    const testCases = [
      {
        name: 'Valid JSON',
        data: { name: 'Test Tour', description: 'Valid JSON' },
        contentType: 'application/json'
      },
      {
        name: 'Empty body',
        data: '',
        contentType: 'application/json',
        raw: true
      },
      {
        name: 'Invalid JSON - missing quotes',
        data: '{name: "test"}',
        contentType: 'application/json',
        raw: true
      },
      {
        name: 'Invalid JSON - trailing comma',
        data: '{"name": "test",}',
        contentType: 'application/json', 
        raw: true
      },
      {
        name: 'Missing Content-Type',
        data: { name: 'Test' },
        contentType: null
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Test: ${testCase.name}`);
      
      try {
        const config = {
          method: 'POST',
          url: `${baseURL}/tours`,
          timeout: 5000
        };
        
        if (testCase.contentType) {
          config.headers = { 'Content-Type': testCase.contentType };
        }
        
        if (testCase.raw) {
          config.data = testCase.data;
        } else {
          config.data = testCase.data;
        }
        
        const response = await axios(config);
        console.log('✅ Unexpected success:', response.status);
        
      } catch (error) {
        if (error.response) {
          console.log('❌ HTTP Error:', error.response.status, error.response.data?.message || 'No message');
        } else if (error.code === 'ECONNABORTED') {
          console.log('❌ Timeout error');
        } else {
          console.log('❌ Network/Other error:', error.message);
        }
      }
    }
    
    // Test tour image endpoint with various JSON issues
    console.log('\n📝 Testing tour-images endpoint...');
    
    const imageTestCases = [
      {
        name: 'Valid image data',
        data: {
          tour_id: '1', 
          image_url: 'https://example.com/image.jpg',
          is_main: false
        }
      },
      {
        name: 'Missing required fields',
        data: {}
      },
      {
        name: 'Null values',
        data: {
          tour_id: null,
          image_url: null,
          is_main: null
        }
      }
    ];
    
    for (const testCase of imageTestCases) {
      console.log(`\n📝 Image Test: ${testCase.name}`);
      
      try {
        const response = await axios.post(`${baseURL}/tour-images`, testCase.data);
        console.log('✅ Success:', response.status);
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 JSON parsing tests completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

testJSONErrors();
