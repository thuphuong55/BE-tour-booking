// Quick endpoint verification script
console.log('🔍 Verifying Admin Tour Approval Endpoint Setup');
console.log('='.repeat(60));

// Check route registration
console.log('📋 Route Registration Check:');
try {
  const app = require('./app');
  console.log('✅ App loaded successfully');
  
  // Check if admin routes are registered
  const routeStack = app._router.stack;
  const adminTourRoute = routeStack.find(layer => 
    layer.regexp.source.includes('admin.*tours')
  );
  
  if (adminTourRoute) {
    console.log('✅ Admin tour routes registered at /api/admin/tours');
  } else {
    console.log('❌ Admin tour routes not found');
  }
  
} catch (error) {
  console.log('❌ Error loading app:', error.message);
}

// Check controller method exists
console.log('\n📋 Controller Method Check:');
try {
  const adminTourController = require('./controllers/adminTourController');
  
  if (typeof adminTourController.approveTour === 'function') {
    console.log('✅ approveTour method exists in controller');
  } else {
    console.log('❌ approveTour method not found');
  }
  
  if (typeof adminTourController.rejectTour === 'function') {
    console.log('✅ rejectTour method exists in controller');
  } else {
    console.log('❌ rejectTour method not found');
  }
  
} catch (error) {
  console.log('❌ Error loading controller:', error.message);
}

// Check route file
console.log('\n📋 Routes File Check:');
try {
  const fs = require('fs');
  const routeContent = fs.readFileSync('./routes/adminTourRoutes.js', 'utf8');
  
  if (routeContent.includes('put("/:id/approve"')) {
    console.log('✅ PUT /approve route exists');
  } else {
    console.log('❌ PUT /approve route not found');
  }
  
  if (routeContent.includes('put("/:id/reject"')) {
    console.log('✅ PUT /reject route exists');
  } else {
    console.log('❌ PUT /reject route not found');
  }
  
  if (routeContent.includes('patch("/:id/approve"')) {
    console.log('✅ PATCH /approve route exists');
  } else {
    console.log('❌ PATCH /approve route not found');
  }
  
} catch (error) {
  console.log('❌ Error reading routes file:', error.message);
}

// Check data transformer
console.log('\n📋 Data Transformer Check:');
try {
  const transformer = require('./utils/tourDataTransformer');
  
  if (typeof transformer.smartTransformForUpdate === 'function') {
    console.log('✅ smartTransformForUpdate function exists');
    
    // Quick test
    const testData = {
      name: 'Test',
      includedServices: [{id: 'test-1', name: 'Test Service'}]
    };
    
    const result = transformer.smartTransformForUpdate(testData);
    if (result.included_service_ids && result.included_service_ids.includes('test-1')) {
      console.log('✅ Data transformer working correctly');
    } else {
      console.log('❌ Data transformer not working properly');
    }
  } else {
    console.log('❌ smartTransformForUpdate function not found');
  }
  
} catch (error) {
  console.log('❌ Error loading transformer:', error.message);
}

console.log('\n🎯 Summary:');
console.log('- Admin tour approval endpoint should be available at:');
console.log('  PUT  /api/admin/tours/:id/approve');
console.log('  PATCH /api/admin/tours/:id/approve');
console.log('- Authentication required: Admin role');
console.log('- Data transformation: FE relationship objects → BE ID arrays');

console.log('\n✅ Verification completed!');
