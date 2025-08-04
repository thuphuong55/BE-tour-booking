const { User, Agency } = require('./models');

(async () => {
  try {
    console.log('🔍 Debugging agency and user relationship...');
    
    // Kiểm tra user cụ thể
    const userId = 'a3842971-f60c-473b-bfe2-707377c81b22';
    const agencyId = '487ef622-57b5-43a1-8d40-e02792bcc1d4';
    
    console.log('\n1. Checking specific user:');
    const user = await User.findByPk(userId);
    console.log('User found:', user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role
    } : 'NOT FOUND');
    
    console.log('\n2. Checking specific agency:');
    const agency = await Agency.findByPk(agencyId);
    console.log('Agency found:', agency ? {
      id: agency.id,
      name: agency.name,
      user_id: agency.user_id,
      status: agency.status
    } : 'NOT FOUND');
    
    console.log('\n3. All agency users:');
    const agencyUsers = await User.findAll({ 
      where: { role: 'agency' },
      attributes: ['id', 'name', 'email', 'status'],
      limit: 10
    });
    console.log(`Found ${agencyUsers.length} agency users:`);
    agencyUsers.forEach(u => {
      console.log(`- ${u.id} | ${u.email} | ${u.status}`);
    });
    
    console.log('\n4. All agencies:');
    const agencies = await Agency.findAll({
      attributes: ['id', 'name', 'user_id', 'status'],
      limit: 10
    });
    console.log(`Found ${agencies.length} agencies:`);
    agencies.forEach(a => {
      console.log(`- ${a.id} | ${a.name} | user_id: ${a.user_id} | ${a.status}`);
    });
    
    console.log('\n5. Check if user_id exists in user table:');
    const userIds = agencies.map(a => a.user_id);
    const existingUsers = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'email', 'status']
    });
    console.log(`${existingUsers.length}/${userIds.length} users exist for agencies`);
    
    // Tìm agencies có user_id không tồn tại
    const existingUserIds = existingUsers.map(u => u.id);
    const orphanAgencies = agencies.filter(a => !existingUserIds.includes(a.user_id));
    console.log(`Orphan agencies (no user): ${orphanAgencies.length}`);
    orphanAgencies.forEach(a => {
      console.log(`- Agency ${a.name} (${a.id}) references non-existent user ${a.user_id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
