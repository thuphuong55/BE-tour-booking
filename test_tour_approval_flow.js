const axios = require('axios');

// Mock data cho test
const adminTourData = {
  "agency_id": "d3a463c7-fa0f-486c-8b89-8429c5640186",
  "name": "Tour Hạ Long Bay (Admin)",
  "description": "Tour được tạo bởi Admin - tự động duyệt",
  "location": "Hạ Long",
  "destination": "Vịnh Hạ Long", 
  "departure_location": "Hà Nội",
  "price": 2500000,
  "tour_type": "Trong nước",
  "max_participants": 30,
  "min_participants": 2,
  "category_ids": [1],
  "hotel_ids": [1]
};

const agencyTourData = {
  "name": "Tour Sapa (Agency)",
  "description": "Tour được tạo bởi Agency - cần duyệt",
  "location": "Sapa",
  "destination": "Núi Fansipan",
  "departure_location": "Hà Nội", 
  "price": 1800000,
  "tour_type": "Trong nước",
  "max_participants": 20,
  "min_participants": 2,
  "category_ids": [2],
  "hotel_ids": [2]
};

async function testTourApprovalFlow() {
  console.log('=== TEST TOUR APPROVAL FLOW ===\n');

  // Test 1: Admin tạo tour (auto-approved)
  console.log('🧪 Test 1: Admin tạo tour (should be auto-approved)');
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      adminTourData,
      {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Admin tour created successfully');
    console.log('Tour ID:', response.data.id);
    console.log('Status:', response.data.status); // Should be "Đang hoạt động"
    console.log('Agency ID:', response.data.agency_id);
    
    // Store for later use
    const adminTourId = response.data.id;
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Agency tạo tour (pending approval)
  console.log('🧪 Test 2: Agency tạo tour (should be pending)');
  let agencyTourId = null;
  try {
    const response = await axios.post('http://localhost:5001/api/tours', 
      agencyTourData,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Agency tour created successfully');
    console.log('Tour ID:', response.data.id);
    console.log('Status:', response.data.status); // Should be "Chờ duyệt"
    console.log('Agency ID:', response.data.agency_id);
    
    agencyTourId = response.data.id;
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Admin duyệt tour của agency
  if (agencyTourId) {
    console.log('🧪 Test 3: Admin duyệt tour của agency');
    try {
      const response = await axios.patch(
        `http://localhost:5001/api/tours/${agencyTourId}/status`,
        {
          status: "Đang hoạt động",
          reason: "Tour đạt tiêu chuẩn và được phê duyệt"
        },
        {
          headers: {
            'Authorization': 'Bearer ADMIN_TOKEN_HERE',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Tour approved successfully');
      console.log('Status changed to:', response.data.status);
      
    } catch (error) {
      console.log('❌ Failed:', error.response?.data || error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Admin từ chối tour của agency  
  console.log('🧪 Test 4: Agency tạo tour khác để test từ chối');
  let rejectTourId = null;
  try {
    const rejectTourData = {
      ...agencyTourData,
      name: "Tour Đà Lạt (To be rejected)",
      description: "Tour này sẽ bị từ chối"
    };
    
    const response = await axios.post('http://localhost:5001/api/tours', 
      rejectTourData,
      {
        headers: {
          'Authorization': 'Bearer AGENCY_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Second agency tour created');
    console.log('Tour ID:', response.data.id);
    rejectTourId = response.data.id;
    
    // Từ chối tour này
    console.log('\n🔴 Admin từ chối tour này...');
    const rejectResponse = await axios.patch(
      `http://localhost:5001/api/tours/${rejectTourId}/status`,
      {
        status: "Đã hủy",
        reason: "Tour không đạt tiêu chuẩn chất lượng"
      },
      {
        headers: {
          'Authorization': 'Bearer ADMIN_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Tour rejected successfully');
    console.log('Status changed to:', rejectResponse.data.status);
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Lấy danh sách tour với filter status
  console.log('🧪 Test 5: Lấy tours theo status');
  
  const statusTests = ['Chờ duyệt', 'Đang hoạt động', 'Đã hủy'];
  
  for (const status of statusTests) {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/tours?status=${encodeURIComponent(status)}`,
        {
          headers: {
            'Authorization': 'Bearer ADMIN_TOKEN_HERE'
          }
        }
      );
      console.log(`📊 Tours with status "${status}":`, response.data.data?.length || 0);
      
    } catch (error) {
      console.log(`❌ Failed to get tours with status "${status}":`, error.message);
    }
  }
}

// Documentation và examples
function showAPIDocumentation() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 TOUR APPROVAL SYSTEM - API DOCUMENTATION');
  console.log('='.repeat(60));
  
  console.log('\n🎯 STATUS FLOW:');
  console.log('Admin tạo tour: status = "Đang hoạt động" (auto-approved)');
  console.log('Agency tạo tour: status = "Chờ duyệt" (pending approval)');
  
  console.log('\n📝 TOUR CREATION API:');
  console.log('POST /api/tours');
  console.log('Headers: Authorization: Bearer <token>');
  console.log('\nAdmin Request:');
  console.log(JSON.stringify({
    agency_id: "uuid-required-for-admin",
    name: "Tour Name",
    status: "auto-set-to-Đang hoạt động"
  }, null, 2));
  
  console.log('\nAgency Request:');
  console.log(JSON.stringify({
    name: "Tour Name", 
    // agency_id auto-assigned
    // status auto-set to "Chờ duyệt"
  }, null, 2));
  
  console.log('\n🔄 STATUS UPDATE API:');
  console.log('PATCH /api/tours/:id/status');
  console.log('Headers: Authorization: Bearer <admin_token>');
  console.log('Body:', JSON.stringify({
    status: "Đang hoạt động", // or "Đã hủy"
    reason: "Lý do duyệt/từ chối"
  }, null, 2));
  
  console.log('\n📊 VALID STATUSES:');
  console.log('- "Chờ duyệt" (Agency default)');
  console.log('- "Đang hoạt động" (Admin default, Approved)');
  console.log('- "Ngừng hoạt động" (Paused)');
  console.log('- "Đã hủy" (Rejected)');
  
  console.log('\n🔐 PERMISSIONS:');
  console.log('Admin: Can change any status');
  console.log('Agency: Limited status changes (cannot approve self)');
}

// Run tests
if (require.main === module) {
  console.log('⚠️  SETUP REQUIRED:');
  console.log('1. Replace ADMIN_TOKEN_HERE and AGENCY_TOKEN_HERE with real tokens');
  console.log('2. Make sure server is running on localhost:5001');
  console.log('3. Update agency_id and other IDs to match your database\n');
  
  showAPIDocumentation();
  
  console.log('\n🚀 To run tests, uncomment the line below:');
  console.log('// testTourApprovalFlow();');
  
  // Uncomment to run actual tests:
  // testTourApprovalFlow();
}

module.exports = { 
  testTourApprovalFlow, 
  adminTourData, 
  agencyTourData,
  showAPIDocumentation 
};
