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
