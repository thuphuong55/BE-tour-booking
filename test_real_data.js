const { smartTransformForUpdate } = require('./utils/tourDataTransformer');

// Real user data from the FE
const userFEData = {
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
      "name": "Hướng dẫn viên chuyên nghiệp",
      "TourIncludedService": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "included_service_id": "14a4c859-f91c-402c-8a7e-70762889355e"
      }
    },
    {
      "id": "18f824a9-9475-446c-acd9-4327c2779969",
      "name": "Các bữa ăn theo lịch trình",
      "TourIncludedService": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "included_service_id": "18f824a9-9475-446c-acd9-4327c2779969"
      }
    },
    {
      "id": "inc-service-transport",
      "name": "Xe vận chuyển theo lịch trình",
      "TourIncludedService": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "included_service_id": "inc-service-transport"
      }
    }
  ],
  
  "excludedServices": [
    {
      "id": "7489d0a8-d18c-4112-baec-46c128dccd1e",
      "name": "Chi phí cá nhân",
      "TourExcludedService": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "excluded_service_id": "7489d0a8-d18c-4112-baec-46c128dccd1e"
      }
    },
    {
      "id": "8d6e99ef-bfa1-4820-acda-0a6f5a67e99f",
      "name": "Đồ uống có cồn",
      "TourExcludedService": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "excluded_service_id": "8d6e99ef-bfa1-4820-acda-0a6f5a67e99f"
      }
    }
  ],
  
  "categories": [
    {
      "id": "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb",
      "name": "Nghỉ Dưỡng",
      "TourTourCategory": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "tour_category_id": "05c6eabf-14d2-45cc-bf8d-b0e4b4ff7beb"
      }
    },
    {
      "id": "category-culture",
      "name": "Văn Hóa",
      "TourTourCategory": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "tour_category_id": "category-culture"
      }
    },
    {
      "id": "fe71f141-295e-4410-b066-19264a63a266",
      "name": "Ẩm Thực",
      "TourTourCategory": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "tour_category_id": "fe71f141-295e-4410-b066-19264a63a266"
      }
    }
  ],
  
  "hotels": [
    {
      "id_hotel": "0464923a-7683-4d5b-a7b6-714efb98b81b",
      "ten_khach_san": "Vinpearl Resort & Spa Phú Quốc",
      "star_rating": 4,
      "TourHotel": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "hotel_id": "0464923a-7683-4d5b-a7b6-714efb98b81b"
      }
    },
    {
      "id_hotel": "1cb02878-e547-477e-a29a-0bcca522ce9a",
      "ten_khach_san": "InterContinental Phu Quoc Long Beach Resort",
      "star_rating": 5,
      "TourHotel": {
        "createdAt": "2025-01-20T21:20:46.000Z",
        "updatedAt": "2025-01-20T21:20:46.000Z",
        "tour_id": "aa291292-e341-4fff-a58a-7eac340287e7",
        "hotel_id": "1cb02878-e547-477e-a29a-0bcca522ce9a"
      }
    }
  ]
};

console.log('🧪 Testing Real User Data Transformation');
console.log('='.repeat(50));

console.log('📊 Input data summary:');
console.log('- includedServices count:', userFEData.includedServices?.length || 0);
console.log('- excludedServices count:', userFEData.excludedServices?.length || 0);
console.log('- categories count:', userFEData.categories?.length || 0);
console.log('- hotels count:', userFEData.hotels?.length || 0);
console.log('- images count:', userFEData.images?.length || 0);
console.log('- departureDates count:', userFEData.departureDates?.length || 0);

console.log('\n🔄 Transforming...');
const transformedData = smartTransformForUpdate(userFEData);

console.log('\n✅ Transformation Results:');
console.log('- included_service_ids:', transformedData.included_service_ids);
console.log('- excluded_service_ids:', transformedData.excluded_service_ids);
console.log('- category_ids:', transformedData.category_ids);
console.log('- hotel_ids:', transformedData.hotel_ids);
console.log('- images preserved:', transformedData.images?.length || 0);
console.log('- departureDates preserved:', transformedData.departureDates?.length || 0);

console.log('\n📋 Validation:');
console.log('✅ All included service IDs extracted:', 
  transformedData.included_service_ids?.length === userFEData.includedServices?.length);
console.log('✅ All excluded service IDs extracted:', 
  transformedData.excluded_service_ids?.length === userFEData.excludedServices?.length);
console.log('✅ All category IDs extracted:', 
  transformedData.category_ids?.length === userFEData.categories?.length);
console.log('✅ All hotel IDs extracted:', 
  transformedData.hotel_ids?.length === userFEData.hotels?.length);

console.log('\n🎯 Ready for Backend Update API!');
console.log('The data is now in the format the BE expects for tour updates.');
