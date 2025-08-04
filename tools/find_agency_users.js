const { User, Agency } = require('./models');

(async () => {
  try {
    console.log('🔍 Finding all agency users...\n');
    
    // Tìm tất cả users có role = agency
    const agencyUsers = await User.findAll({
      where: { role: 'agency' },
      attributes: ['id', 'email', 'name', 'role'],
      include: [{
        model: Agency,
        as: 'agency',
        attributes: ['id', 'name'],
        required: false
      }]
    });
    
    console.log(`Found ${agencyUsers.length} agency users:`);
    agencyUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      if (user.agency) {
        console.log(`   Agency ID: ${user.agency.id}`);
        console.log(`   Agency Name: ${user.agency.name}`);
      } else {
        console.log(`   ⚠️ No agency linked`);
      }
    });
    
    console.log('\n🔍 Also checking agencies...\n');
    
    // Tìm tất cả agencies
    const allAgencies = await Agency.findAll({
      attributes: ['id', 'name', 'user_id'],
      limit: 10
    });
    
    console.log(`Found ${allAgencies.length} agencies:`);
    allAgencies.forEach((agency, index) => {
      console.log(`\n${index + 1}. Agency ID: ${agency.id}`);
      console.log(`   Agency Name: ${agency.name}`);
      console.log(`   User ID: ${agency.user_id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
