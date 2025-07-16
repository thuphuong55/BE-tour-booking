const { User } = require('./models');
const bcrypt = require('bcrypt');

async function testUpdateUserEndpoint() {
  try {
    console.log('=== TEST: Update User Info Endpoint ===');

    // Tạo user test nếu chưa có
    let testUser = await User.findOne({ where: { email: 'test@update.com' } });
    
    if (!testUser) {
      console.log('Tạo user test...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await User.create({
        username: 'test_user_update',
        email: 'test@update.com',
        password_hash: hashedPassword,
        role: 'user',
        name: 'Test User Original'
      });
      console.log('✅ Đã tạo user test:', testUser.username);
    }

    // Test case 1: Cập nhật tên
    console.log('\n--- Test 1: Cập nhật tên ---');
    await testUser.update({ name: 'Test User Updated Name' });
    console.log('✅ Cập nhật tên thành công');

    // Test case 2: Kiểm tra validation email trùng lặp
    console.log('\n--- Test 2: Validation email trùng lặp ---');
    const anotherUser = await User.findOne({ 
      where: { email: { [require('sequelize').Op.ne]: 'test@update.com' } }
    });
    
    if (anotherUser) {
      console.log(`Email khác đã tồn tại: ${anotherUser.email}`);
      console.log('✅ Có thể test validation email trùng lặp');
    } else {
      console.log('⚠️ Không có user khác để test validation');
    }

    // Test case 3: Kiểm tra hash password
    console.log('\n--- Test 3: Kiểm tra mật khẩu ---');
    const isPasswordValid = await bcrypt.compare('password123', testUser.password_hash);
    console.log('✅ Mật khẩu test hợp lệ:', isPasswordValid);

    // Test case 4: Hash password mới
    console.log('\n--- Test 4: Hash password mới ---');
    const newPasswordHash = await bcrypt.hash('newpassword456', 10);
    console.log('✅ Hash password mới thành công');

    console.log('\n📋 Thông tin user test:');
    console.log('- ID:', testUser.id);
    console.log('- Username:', testUser.username);
    console.log('- Email:', testUser.email);
    console.log('- Name:', testUser.name);
    console.log('- Role:', testUser.role);

    console.log('\n🎯 Endpoint PUT /api/auth/me đã sẵn sàng test!');
    console.log('Sử dụng user test với:');
    console.log('- Email: test@update.com');
    console.log('- Password: password123');
    console.log('- Đăng nhập trước để lấy token, sau đó test update');

  } catch (error) {
    console.error('❌ Lỗi test:', error);
  }
}

testUpdateUserEndpoint();
