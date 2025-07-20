const axios = require('axios');

const createTestTourAndImages = async () => {
  try {
    console.log('🧪 Creating Test Tour and Testing Image Creation...');
    
    const baseURL = 'http://localhost:5001/api';
    
    // First login as admin/agency to create tour
    console.log('\n1️⃣ Login as admin...');
    let authToken = '';
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'admin@tourbooking.com',
        password: 'admin123'
      });
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (error) {
      console.log('❌ Login failed, trying to create admin...');
      
      // Try to create admin user
      try {
        await axios.post(`${baseURL}/auth/register`, {
          username: 'admin',
          email: 'admin@tourbooking.com',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin'
        });
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
          email: 'admin@tourbooking.com',
          password: 'admin123'
        });
        authToken = loginResponse.data.token;
        console.log('✅ Admin created and logged in');
      } catch (createError) {
        console.log('❌ Could not create/login admin:', createError.response?.data || createError.message);
        return;
      }
    }
    
    // Get auth headers
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // Create a test tour
    console.log('\n2️⃣ Creating test tour...');
    let tour_id = '';
    try {
      const tourData = {
        title: 'Test Tour for Image Upload',
        description: 'This is a test tour for testing image upload functionality',
        price: 1000000,
        duration: '3 ngày 2 đêm',
        max_participants: 20,
        location: 'Hà Nội',
        destination: 'Sapa',
        category_id: null
      };
      
      const tourResponse = await axios.post(`${baseURL}/tours`, tourData, { headers: authHeaders });
      tour_id = tourResponse.data.id;
      console.log('✅ Test tour created with ID:', tour_id);
    } catch (error) {
      console.log('❌ Error creating tour:', error.response?.data || error.message);
      return;
    }
    
    // Now test image creation
    console.log('\n3️⃣ Testing tour image creation...');
    
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
    
    for (const testCase of testCases) {
      console.log(`\n📝 Test: ${testCase.name}`);
      
      try {
        const response = await axios.post(`${baseURL}/tour-images`, testCase.data, { headers: authHeaders });
        
        if (testCase.expectedSuccess) {
          console.log('✅ Success:', {
            id: response.data.id,
            image_url: response.data.image_url,
            is_main: response.data.is_main
          });
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
    
    // Get tour images
    console.log('\n4️⃣ Getting tour images...');
    try {
      const imagesResponse = await axios.get(`${baseURL}/tour-images/tour/${tour_id}`);
      console.log('✅ Tour images:', imagesResponse.data);
    } catch (error) {
      console.log('❌ Error getting images:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
};

createTestTourAndImages();
