const { User } = require('./models');

async function findAdmins() {
  try {
    console.log('🔍 Looking for admin users...');
    
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email', 'role', 'created_at']
    });
    
    if (admins.length > 0) {
      console.log(`✅ Found ${admins.length} admin(s):`);
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.name || 'No name'})`);
      });
      
      // Sử dụng admin đầu tiên để test
      const firstAdmin = admins[0];
      console.log(`\n🔑 Testing with admin: ${firstAdmin.email}`);
      
      return firstAdmin;
    } else {
      console.log('❌ No admin users found');
      
      // Tìm tất cả users để xem có gì
      const allUsers = await User.findAll({
        attributes: ['id', 'name', 'email', 'role'],
        limit: 5
      });
      
      console.log('\n📋 Sample users in database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

findAdmins();
