const { smartTransformForUpdate, transformTourForUpdate, extractRelationshipArrays } = require('../utils/tourDataTransformer');

// Sample FE data (response format with relationship objects)
const sampleResponseData = {
  "id": "aa291292-e341-4fff-a58a-7eac340287e7",
  "agency_id": "d3a463c7-fa0f-486c-8b89-8429c5640186",
  "name": "Tour nghỉ dưỡng Phú Quốc cao cấp",
  "description": " Thư giãn tại resort 5 sao với biển xanh và cát trắng",
  "location": "",
  "destination": "",
  "departure_location": "TP. Hồ Chí Minh",
  "price": 11000000,
  "tour_type": "Trong nước",
  "max_participants": 20,
  "min_participants": 1,
  "status": "Chờ duyệt",
  "created_at": "2025-07-20T21:20:45.000Z",
  "updated_at": "2025-07-20T21:20:45.000Z",
  
  "departureDates": [],
  
  "images": [
    {
      "id": "61fcee38-e89d-4c0c-a3f4-74c229a2ddae",
      "image_url": "https://res.cloudinary.com/dojbjbbjw/image/upload/v1753046427/PhuQuoc_ez5xxh.jpg",
      "is_main": false
    },
    {
      "id": "9124a96e-c6bb-4116-8c20-7fe32e11fc5d",
      "image_url": "https://res.cloudinary.com/dojbjbbjw/image/upload/v1753046428/PhuQuoc1_slmh07.jpg",
      "is_main": true
    }
  ],
  
  "includedServices": [
    {
      "id": "14a4c859-f91c-402c-8a7e-70762889355e",
      "name": "Hướng dẫn viên chuyên nghiệp"
    },
    {
      "id": "18f824a9-9475-446c-acd9-4327c2779969",
      "name": "Các bữa ăn theo lịch trình"
    },
    {
      "id": "inc-service-transport",
      "name": "Xe vận chuyển theo lịch trình"
    }
  ],
  
  "excludedServices": [
    {
      "id": "7489d0a8-d18c-4112-baec-46c128dccd1e",
      "name": "Chi phí cá nhân"
    },
    {
      "id": "8d6e99ef-bfa1-4820-acda-0a6f5a67e99f",
      "name": "Đồ uống có cồn"
    }
  ],
  
  "categories": [
    {
      "id": "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb",
      "name": "Nghỉ Dưỡng"
    },
    {
      "id": "category-culture",
      "name": "Văn Hóa"
    },
    {
      "id": "fe71f141-295e-4410-b066-19264a63a266",
      "name": "Ẩm Thực"
    }
  ],
  
  "hotels": [
    {
      "id_hotel": "0464923a-7683-4d5b-a7b6-714efb98b81b",
      "ten_khach_san": "Vinpearl Resort & Spa Phú Quốc",
      "star_rating": 4
    },
    {
      "id_hotel": "1cb02878-e547-477e-a29a-0bcca522ce9a",
      "ten_khach_san": "InterContinental Phu Quoc Long Beach Resort",
      "star_rating": 5
    }
  ]
};

// Sample direct array data (request format)
const sampleRequestData = {
  "name": "Tour Updated via Arrays",
  "description": "Updated description",
  "price": 12000000,
  "category_ids": ["cat-1", "cat-2"],
  "hotel_ids": ["hotel-1", "hotel-2"],
  "included_service_ids": ["service-1", "service-2"],
  "excluded_service_ids": ["exc-service-1"],
  "departureDates": [
    {
      "departure_date": "2025-09-01",
      "end_date": "2025-09-03",
      "number_of_days": 3,
      "number_of_nights": 2
    }
  ]
};

function testTransformers() {
  console.log('=== TEST TOUR DATA TRANSFORMERS ===\n');

  // Test 1: Transform response format to request format
  console.log('🧪 Test 1: Transform response data (with relationship objects)');
  try {
    const transformed = transformTourForUpdate(sampleResponseData);
    
    console.log('✅ Transformation successful');
    console.log('Core fields preserved:', {
      id: transformed.id,
      name: transformed.name,
      price: transformed.price
    });
    
    console.log('Arrays extracted:');
    console.log('- included_service_ids:', transformed.included_service_ids);
    console.log('- excluded_service_ids:', transformed.excluded_service_ids);
    console.log('- category_ids:', transformed.category_ids);
    console.log('- hotel_ids:', transformed.hotel_ids);
    console.log('- images count:', transformed.images?.length || 0);
    console.log('- departureDates count:', transformed.departureDates?.length || 0);
    
  } catch (error) {
    console.log('❌ Transformation failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Extract direct arrays
  console.log('🧪 Test 2: Extract direct arrays from request data');
  try {
    const extracted = extractRelationshipArrays(sampleRequestData);
    
    console.log('✅ Extraction successful');
    console.log('Direct arrays found:', extracted);
    
  } catch (error) {
    console.log('❌ Extraction failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Smart transform (response format)
  console.log('🧪 Test 3: Smart transform on response format data');
  try {
    const smartTransformed = smartTransformForUpdate(sampleResponseData);
    
    console.log('✅ Smart transform successful');
    console.log('Final arrays:');
    console.log('- included_service_ids:', smartTransformed.included_service_ids?.length || 0, 'items');
    console.log('- excluded_service_ids:', smartTransformed.excluded_service_ids?.length || 0, 'items');
    console.log('- category_ids:', smartTransformed.category_ids?.length || 0, 'items');
    console.log('- hotel_ids:', smartTransformed.hotel_ids?.length || 0, 'items');
    
    console.log('Sample IDs:');
    console.log('- First included service:', smartTransformed.included_service_ids?.[0]);
    console.log('- First excluded service:', smartTransformed.excluded_service_ids?.[0]);
    console.log('- First category:', smartTransformed.category_ids?.[0]);
    console.log('- First hotel:', smartTransformed.hotel_ids?.[0]);
    
  } catch (error) {
    console.log('❌ Smart transform failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Smart transform (request format)
  console.log('🧪 Test 4: Smart transform on request format data');
  try {
    const smartTransformed = smartTransformForUpdate(sampleRequestData);
    
    console.log('✅ Smart transform successful (passthrough)');
    console.log('Arrays preserved:');
    console.log('- category_ids:', smartTransformed.category_ids);
    console.log('- hotel_ids:', smartTransformed.hotel_ids);
    console.log('- included_service_ids:', smartTransformed.included_service_ids);
    console.log('- excluded_service_ids:', smartTransformed.excluded_service_ids);
    
  } catch (error) {
    console.log('❌ Smart transform failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Mixed data (some arrays, some objects)
  console.log('🧪 Test 5: Mixed data format');
  try {
    const mixedData = {
      ...sampleResponseData,
      // Override with direct arrays (should take priority)
      category_ids: ["override-cat-1", "override-cat-2"],
      hotel_ids: ["override-hotel-1"]
    };
    
    const smartTransformed = smartTransformForUpdate(mixedData);
    
    console.log('✅ Mixed transform successful');
    console.log('Priority check (direct arrays should override):');
    console.log('- category_ids:', smartTransformed.category_ids);
    console.log('- hotel_ids:', smartTransformed.hotel_ids);
    console.log('- included_service_ids (from objects):', smartTransformed.included_service_ids?.slice(0,2));
    
  } catch (error) {
    console.log('❌ Mixed transform failed:', error.message);
  }
}

function showTransformerDocumentation() {
  console.log('\n' + '='.repeat(70));
  console.log('📚 TOUR DATA TRANSFORMER DOCUMENTATION');
  console.log('='.repeat(70));
  
  console.log('\n🔄 PROBLEM SOLVED:');
  console.log('FE sends response data (with relationship objects) to UPDATE endpoint');
  console.log('BE expects request data (with ID arrays)');
  console.log('Transformer converts between formats automatically');
  
  console.log('\n📥 INPUT FORMATS SUPPORTED:');
  
  console.log('\n1️⃣ Response Format (from GET /tours/:id/complete):');
  console.log(JSON.stringify({
    id: "tour-id",
    name: "Tour Name",
    includedServices: [
      { id: "service-1", name: "Service 1" },
      { id: "service-2", name: "Service 2" }
    ],
    categories: [
      { id: "cat-1", name: "Category 1" }
    ],
    hotels: [
      { id_hotel: "hotel-1", ten_khach_san: "Hotel Name" }
    ]
  }, null, 2));
  
  console.log('\n2️⃣ Request Format (direct arrays):');
  console.log(JSON.stringify({
    name: "Tour Name",
    included_service_ids: ["service-1", "service-2"],
    category_ids: ["cat-1"],
    hotel_ids: ["hotel-1"]
  }, null, 2));
  
  console.log('\n📤 OUTPUT FORMAT (for BE processing):');
  console.log(JSON.stringify({
    name: "Tour Name",
    included_service_ids: ["service-1", "service-2"],
    excluded_service_ids: ["exc-1", "exc-2"],
    category_ids: ["cat-1"],
    hotel_ids: ["hotel-1"],
    departureDates: [
      { departure_date: "2025-08-15", end_date: "2025-08-17" }
    ],
    images: [
      { id: "img-1", image_url: "url", is_main: true }
    ]
  }, null, 2));
  
  console.log('\n🔧 TRANSFORMATION RULES:');
  console.log('- includedServices → included_service_ids (extract .id)');
  console.log('- excludedServices → excluded_service_ids (extract .id)');
  console.log('- categories → category_ids (extract .id)');
  console.log('- hotels → hotel_ids (extract .id_hotel or .id)');
  console.log('- departureDates → departureDates (preserve structure)');
  console.log('- images → images (preserve structure)');
  console.log('- Direct arrays take priority over objects');
  console.log('- Core fields preserved as-is');
  
  console.log('\n✅ USAGE IN CONTROLLER:');
  console.log('const transformedData = smartTransformForUpdate(req.body);');
  console.log('// Now transformedData has arrays in the format BE expects');
  
  console.log('\n🎯 BENEFITS:');
  console.log('✅ FE can send either format (response or request)');
  console.log('✅ BE handles both formats automatically');
  console.log('✅ No breaking changes to existing FE code');
  console.log('✅ Backward compatibility maintained');
  console.log('✅ Clear logging for debugging');
}

// Run tests
if (require.main === module) {
  console.log('🚀 RUNNING TOUR DATA TRANSFORMER TESTS\n');
  
  testTransformers();
  showTransformerDocumentation();
  
  console.log('\n✅ All transformer tests completed!');
}

module.exports = { 
  testTransformers,
  showTransformerDocumentation,
  sampleResponseData,
  sampleRequestData
};
