const { User, Agency } = require('./models');

async function debugAuth() {
  try {
    console.log('=== DEBUG AUTHENTICATION DATA ===\n');
    
    // Kiểm tra tất cả users
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    console.log('🔍 ALL USERS:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id} | Email: ${user.email} | Role: ${user.role}`);
    });
    
    console.log('\n🔍 AGENCIES AND THEIR USER_IDs:');
    const agencies = await Agency.findAll({
      attributes: ['id', 'user_id', 'name', 'status'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role']
      }],
      order: [['created_at', 'DESC']]
    });
    
    agencies.forEach(agency => {
      console.log(`  - Agency ID: ${agency.id} | Name: ${agency.name} | Status: ${agency.status}`);
      console.log(`    -> User ID: ${agency.user_id} | Email: ${agency.user?.email} | Role: ${agency.user?.role}`);
    });
    
    // Kiểm tra cụ thể 2 agency IDs từ user
    console.log('\n🔍 SPECIFIC AGENCY CHECK:');
    const agency1 = await Agency.findByPk('d3a463c7-fa0f-486c-8b89-8429c5640186', {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }]
    });
    
    const agency2 = await Agency.findByPk('855ff6be-bed7-497c-84e0-4230faa2c61a', {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'role'] }]
    });
    
    if (agency1) {
      console.log(`Agency 1: ${agency1.id} -> User ID: ${agency1.user_id} (${agency1.user?.email})`);
    } else {
      console.log('Agency 1 NOT FOUND');
    }
    
    if (agency2) {
      console.log(`Agency 2: ${agency2.id} -> User ID: ${agency2.user_id} (${agency2.user?.email})`);
    } else {
      console.log('Agency 2 NOT FOUND');
    }
    
    // Kiểm tra ngược lại từ user_id
    console.log('\n🔍 REVERSE CHECK - Find agencies by user_id:');
    for (const user of users.filter(u => u.role === 'agency')) {
      const userAgency = await Agency.findOne({ where: { user_id: user.id } });
      console.log(`User ${user.id} (${user.email}) -> Agency: ${userAgency?.id || 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAuth();
