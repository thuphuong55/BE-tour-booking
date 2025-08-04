// Script để force logout user bị lock
const { User } = require('./models');

async function forceLogoutLockedUsers() {
  try {
    console.log('🔧 Force logout cho tất cả users bị inactive...');
    
    // Tìm tất cả users inactive
    const inactiveUsers = await User.findAll({
      where: { status: 'inactive' },
      attributes: ['id', 'email', 'status', 'role']
    });
    
    console.log(`Found ${inactiveUsers.length} inactive users:`);
    inactiveUsers.forEach(user => {
      console.log(`- ${user.email} (${user.id}) - ${user.role} - ${user.status}`);
    });
    
    // Trong production, bạn có thể implement token blacklist hoặc
    // thêm trường last_logout_at để invalidate tokens cũ
    
    console.log('\n💡 Giải pháp:');
    console.log('1. Frontend: Xóa token trong localStorage/sessionStorage');
    console.log('2. Frontend: Implement auto-logout khi nhận 403');
    console.log('3. Backend: Implement token blacklist (advanced)');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

forceLogoutLockedUsers();
