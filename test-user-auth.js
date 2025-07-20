const axios = require('axios');

const testUserAuthEndpoints = async () => {
  try {
    console.log('🧪 Test User Authentication Endpoints...');
    
    const baseURL = 'http://localhost:5001/api/auth';
    let userToken = '';
    let userId = '';

    // Test data
    const testUser = {
      username: 'testuser2025',
      email: 'testuser2025@example.com',
      password: 'password123',
      role: 'user'
    };

    // 1. Test Register
    console.log('\n1️⃣ Test POST /api/auth/register');
    try {
      const response = await axios.post(`${baseURL}/register`, testUser);
      console.log('✅ Register Success:', response.data);
      userId = response.data.user.id;
    } catch (error) {
      console.log('❌ Register Error:', error.response?.data || error.message);
    }

    // 2. Test Login
    console.log('\n2️⃣ Test POST /api/auth/login');
    try {
      const response = await axios.post(`${baseURL}/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login Success:', response.data);
      userToken = response.data.token;
    } catch (error) {
      console.log('❌ Login Error:', error.response?.data || error.message);
    }

    if (!userToken) {
      console.log('❌ Không có token, dừng test');
      return;
    }

    const authHeaders = {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    };

    // 3. Test Get User Info
    console.log('\n3️⃣ Test GET /api/auth/me');
    try {
      const response = await axios.get(`${baseURL}/me`, { headers: authHeaders });
      console.log('✅ Get User Info Success:', response.data);
    } catch (error) {
      console.log('❌ Get User Info Error:', error.response?.data || error.message);
    }

    // 4. Test Update User Info
    console.log('\n4️⃣ Test PUT /api/auth/me');
    try {
      const response = await axios.put(`${baseURL}/me`, {
        name: 'Test User Updated',
        username: 'testuser2025_updated'
      }, { headers: authHeaders });
      console.log('✅ Update User Info Success:', response.data);
    } catch (error) {
      console.log('❌ Update User Info Error:', error.response?.data || error.message);
    }

    // 5. Test Update Password
    console.log('\n5️⃣ Test PUT /api/auth/me (change password)');
    try {
      const response = await axios.put(`${baseURL}/me`, {
        currentPassword: testUser.password,
        newPassword: 'newpassword123'
      }, { headers: authHeaders });
      console.log('✅ Change Password Success:', response.data);
    } catch (error) {
      console.log('❌ Change Password Error:', error.response?.data || error.message);
    }

    // 6. Test Login with new password
    console.log('\n6️⃣ Test Login with new password');
    try {
      const response = await axios.post(`${baseURL}/login`, {
        email: testUser.email,
        password: 'newpassword123'
      });
      console.log('✅ Login with new password Success:', response.data);
    } catch (error) {
      console.log('❌ Login with new password Error:', error.response?.data || error.message);
    }

    // 7. Test Logout
    console.log('\n7️⃣ Test POST /api/auth/logout');
    try {
      const response = await axios.post(`${baseURL}/logout`, {}, { headers: authHeaders });
      console.log('✅ Logout Success:', response.data);
    } catch (error) {
      console.log('❌ Logout Error:', error.response?.data || error.message);
    }

    // 8. Test Register with duplicate email (should fail)
    console.log('\n8️⃣ Test Register with duplicate email (should fail)');
    try {
      const response = await axios.post(`${baseURL}/register`, testUser);
      console.log('❌ Duplicate Register should have failed:', response.data);
    } catch (error) {
      console.log('✅ Duplicate Register correctly failed:', error.response?.data || error.message);
    }

    // 9. Test Login with wrong password (should fail)
    console.log('\n9️⃣ Test Login with wrong password (should fail)');
    try {
      const response = await axios.post(`${baseURL}/login`, {
        email: testUser.email,
        password: 'wrongpassword'
      });
      console.log('❌ Wrong password login should have failed:', response.data);
    } catch (error) {
      console.log('✅ Wrong password login correctly failed:', error.response?.data || error.message);
    }

    // 10. Test accessing protected route without token (should fail)
    console.log('\n🔟 Test GET /api/auth/me without token (should fail)');
    try {
      const response = await axios.get(`${baseURL}/me`);
      console.log('❌ No token request should have failed:', response.data);
    } catch (error) {
      console.log('✅ No token request correctly failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Test hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error.message);
  }
};

testUserAuthEndpoints();
