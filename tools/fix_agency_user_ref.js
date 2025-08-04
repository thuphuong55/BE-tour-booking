const { Agency, User } = require('./models');

(async () => {
  try {
    console.log('🔧 Fixing agency user_id reference...');
    
    const agencyId = '487ef622-57b5-43a1-8d40-e02792bcc1d4';
    const targetEmail = 'thuthu060403@gmail.com';
    
    // Tìm user thật với email này
    const realUser = await User.findOne({ where: { email: targetEmail } });
    if (!realUser) {
      console.log('❌ No user found with email:', targetEmail);
      process.exit(1);
    }
    
    console.log('Found real user:', {
      id: realUser.id,
      email: realUser.email,
      username: realUser.username,
      status: realUser.status
    });
    
    // Cập nhật agency để tham chiếu đến user thật
    const agency = await Agency.findByPk(agencyId);
    if (!agency) {
      console.log('❌ Agency not found');
      process.exit(1);
    }
    
    const oldUserId = agency.user_id;
    await agency.update({ user_id: realUser.id });
    
    console.log('✅ Updated agency user_id:');
    console.log('  From:', oldUserId);
    console.log('  To:', realUser.id);
    
    // Verify the fix
    const fixedAgency = await Agency.findByPk(agencyId, { include: 'user' });
    console.log('✅ Verification:');
    console.log('  Agency has user:', !!fixedAgency.user);
    console.log('  User email:', fixedAgency.user?.email);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
