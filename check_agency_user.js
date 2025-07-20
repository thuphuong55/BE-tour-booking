const { User, Agency } = require('./models');

async function checkAgencyUser() {
  try {
    console.log('=== CHECKING AGENCY USER ===');
    
    // 1. Tìm user với email agency@test.com
    const user = await User.findOne({ 
      where: { email: 'agency@test.com' },
      include: [{ 
        model: Agency, 
        as: 'agency' 
      }]
    });
    
    if (!user) {
      console.log('❌ User agency@test.com không tồn tại');
      
      // Hiển thị các user có role agency
      const agencyUsers = await User.findAll({ 
        where: { role: 'agency' },
        include: [{ model: Agency, as: 'agency' }],
        limit: 5
      });
      
      console.log('\n📋 Danh sách users có role agency:');
      agencyUsers.forEach(u => {
        console.log(`- Email: ${u.email}, Name: ${u.name}, Agency ID: ${u.agency?.id}, Status: ${u.agency?.status}`);
      });
      
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agency_id: user.agency?.id,
      agency_status: user.agency?.status
    });
    
    // 2. Kiểm tra password bằng cách so sánh hash
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare('123456', user.password);
    console.log('Password "123456" matches:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('\n🔧 Cập nhật password thành "123456"...');
      const hashedPassword = await bcrypt.hash('123456', 12);
      await user.update({ password: hashedPassword });
      console.log('✅ Password đã được cập nhật');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkAgencyUser();
