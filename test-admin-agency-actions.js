const axios = require('axios');

const testAdminAgencyActions = async () => {
  try {
    console.log('🧪 Test Admin Agency Management...');
    
    const baseURL = 'http://localhost:5001/api/agencies';
    
    // Fake admin token - trong thực tế cần login admin trước
    const adminHeaders = {
      'Authorization': 'Bearer fake-admin-token',
      'Content-Type': 'application/json'
    };

    // 1. Test lấy danh sách agencies
    console.log('\n1️⃣ Test GET /api/agencies (danh sách)');
    try {
      const response = await axios.get(`${baseURL}?status=approved`, { 
        headers: adminHeaders 
      });
      console.log('✅ Danh sách agencies:', response.data);
    } catch (error) {
      console.log('❌ Lỗi lấy danh sách:', error.response?.data || error.message);
    }

    // 2. Test khóa agency 
    console.log('\n2️⃣ Test PUT /api/agencies/toggle-lock/:id (khóa)');
    const testAgencyId = 'test-agency-id'; // Thay bằng ID thật
    try {
      const response = await axios.put(`${baseURL}/toggle-lock/${testAgencyId}`, {
        action: 'lock'
      }, { headers: adminHeaders });
      console.log('✅ Khóa agency:', response.data);
    } catch (error) {
      console.log('❌ Lỗi khóa agency:', error.response?.data || error.message);
    }

    // 3. Test mở khóa agency
    console.log('\n3️⃣ Test PUT /api/agencies/toggle-lock/:id (mở khóa)');
    try {
      const response = await axios.put(`${baseURL}/toggle-lock/${testAgencyId}`, {
        action: 'unlock'
      }, { headers: adminHeaders });
      console.log('✅ Mở khóa agency:', response.data);
    } catch (error) {
      console.log('❌ Lỗi mở khóa agency:', error.response?.data || error.message);
    }

    // 4. Test xóa soft delete
    console.log('\n4️⃣ Test DELETE /api/agencies/:id (soft delete)');
    try {
      const response = await axios.delete(`${baseURL}/${testAgencyId}`, {
        headers: adminHeaders,
        data: { permanently: false }
      });
      console.log('✅ Soft delete agency:', response.data);
    } catch (error) {
      console.log('❌ Lỗi soft delete:', error.response?.data || error.message);
    }

    // 5. Test xóa vĩnh viễn (sẽ lỗi vì có ràng buộc)
    console.log('\n5️⃣ Test DELETE /api/agencies/:id (permanent delete)');
    try {
      const response = await axios.delete(`${baseURL}/${testAgencyId}`, {
        headers: adminHeaders,
        data: { permanently: true }
      });
      console.log('✅ Permanent delete agency:', response.data);
    } catch (error) {
      console.log('❌ Lỗi permanent delete (expected):', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error.message);
  }
};

testAdminAgencyActions();
