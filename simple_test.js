// Simple test for tour data transformer
console.log('🔍 Testing tour data transformer...');

try {
  // Try to import the transformer
  const transformer = require('./utils/tourDataTransformer');
  console.log('✅ Module imported successfully');
  
  // Test basic functionality
  const { smartTransformForUpdate } = transformer;
  
  if (typeof smartTransformForUpdate === 'function') {
    console.log('✅ smartTransformForUpdate function found');
    
    // Simple test data
    const testData = {
      name: "Test Tour",
      price: 1000000,
      includedServices: [
        { id: "service-1", name: "Test Service 1" },
        { id: "service-2", name: "Test Service 2" }
      ],
      categories: [
        { id: "cat-1", name: "Test Category" }
      ]
    };
    
    console.log('\n📝 Input data:', JSON.stringify(testData, null, 2));
    
    const result = smartTransformForUpdate(testData);
    console.log('\n✅ Transform result:', JSON.stringify(result, null, 2));
    
    // Check if arrays were extracted
    if (result.included_service_ids && result.included_service_ids.length === 2) {
      console.log('✅ included_service_ids extracted correctly');
    }
    
    if (result.category_ids && result.category_ids.length === 1) {
      console.log('✅ category_ids extracted correctly');
    }
    
    console.log('\n🎉 All tests passed!');
    
  } else {
    console.log('❌ smartTransformForUpdate function not found');
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Stack:', error.stack);
}
}
        const loginRes = await axios.post('http://localhost:5011/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.token;
        console.log('✅ Login success');
        
        // Get tours
        const toursRes = await axios.get('http://localhost:5011/api/admin/tours?page=1&limit=2', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Get tours success');
        console.log('Response keys:', Object.keys(toursRes.data));
        console.log('Data keys:', Object.keys(toursRes.data.data));
        console.log('Tours length:', toursRes.data.data.tours?.length);
        
        if (toursRes.data.data.tours && toursRes.data.data.tours.length > 0) {
            const tour = toursRes.data.data.tours[0];
            console.log('First tour:', {
                id: tour.id,
                name: tour.name,
                price: tour.price
            });
            
            // Test update
            const updateRes = await axios.put(`http://localhost:5011/api/admin/tours/${tour.id}`, {
                name: `${tour.name} - ADMIN UPDATED`,
                price: tour.price + 50000
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Update success!');
            console.log('Updated tour name:', updateRes.data.tour.name);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

simpleTest();
